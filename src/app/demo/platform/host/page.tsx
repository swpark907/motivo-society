import Link from "next/link";
import {
  ACTIVITY_STATUS_LABELS,
  KIND_LABELS,
  ORGANIZER_LABELS,
  won,
} from "@/lib/platform/messages";
import { createSessionClient } from "@/lib/platform/supabase-server";
import { formatWhen, getViewer } from "../_data";
import { Badge } from "../_ui";
import styles from "./host.module.scss";

// 호스트·클럽 운영진 대시보드 시안. 회원 홈과 달리 "처리할 일"과 숫자를 앞에 둔다.
// 관리 권한은 DB의 can_manage_activity로 판정한다(개인 주최·진행자·클럽 참가자 관리 권한).

type Kind = "gathering" | "series" | "challenge";

type Todo = { key: string; href: string; tone: "act" | "info"; title: string; detail: string };

type CalendarItem = { id: string; kind: Kind; title: string; startsAt: string; href: string };

const KST_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });
const KST_WEEKDAY = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  weekday: "short",
  day: "numeric",
});
const KST_TIME = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
});

/** 렌더 밖에서 오늘부터 7일의 한국 날짜를 만든다. */
function week() {
  const now = Date.now();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now + i * 86_400_000);
    return { key: KST_DAY.format(d), label: i === 0 ? "오늘" : KST_WEEKDAY.format(d) };
  });
  return { nowIso: new Date(now).toISOString(), today: days[0].key, days };
}

export default async function HostDashboardPage() {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>호스트 대시보드</h1>
        <p className={styles.muted}>
          위에서 바라호스트·클럽장·클럽운영진 중 한 사람을 골라 보세요.
        </p>
      </div>
    );
  }

  const supabase = await createSessionClient();
  const { nowIso, today, days } = week();

  // ── 내가 관리하는 활동(회차 제외)
  const { data: allActs } = await supabase
    .from("activities")
    .select(
      "id, kind, organizer_kind, title, status, starts_at, ends_at, capacity, price, clubs(name)",
    )
    .is("series_id", null)
    .order("starts_at");
  const manageFlags = await Promise.all(
    (allActs ?? []).map(async (a) => {
      const { data } = await supabase.rpc("can_manage_activity", { p_activity: a.id });
      return Boolean(data);
    }),
  );
  const acts = (allActs ?? []).filter((_, i) => manageFlags[i]);
  const ids = acts.map((a) => a.id);

  if (ids.length === 0) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>호스트 대시보드</h1>
        <p className={styles.muted}>
          {viewer.nickname}님이 관리하는 활동이 없어요.{" "}
          <Link href="/demo/platform/new">활동 만들기</Link>에서 시작할 수 있어요.
        </p>
      </div>
    );
  }

  const seriesIds = acts.filter((a) => a.kind === "series").map((a) => a.id);
  const challengeIds = acts.filter((a) => a.kind === "challenge").map((a) => a.id);

  const [
    { data: counts },
    { data: parts },
    { data: pendingOrders },
    { data: sessions },
    { data: todayCerts },
    { data: challengeDetails },
    { data: myPaidOrders },
    { data: mySettlements },
  ] = await Promise.all([
    supabase.rpc("activity_seat_counts", { p_ids: ids }),
    supabase.from("participations").select("activity_id, user_id, status").in("activity_id", ids),
    supabase
      .from("orders")
      .select("id, activity_id, amount")
      .in("activity_id", ids)
      .eq("status", "pending"),
    seriesIds.length
      ? supabase
          .from("activities")
          .select("id, series_id, title, starts_at, status")
          .in("series_id", seriesIds)
          .neq("status", "cancelled")
          .order("starts_at")
      : Promise.resolve({ data: [] }),
    challengeIds.length
      ? supabase
          .from("certifications")
          .select("id, activity_id, status")
          .in("activity_id", challengeIds)
          .eq("cert_date", today)
      : Promise.resolve({ data: [] }),
    challengeIds.length
      ? supabase
          .from("challenge_details")
          .select("activity_id, ends_on")
          .in("activity_id", challengeIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from("orders")
      .select("id, amount, fee_rate, settlement_items(id)")
      .eq("payee_user_id", viewer.id)
      .eq("status", "paid"),
    supabase
      .from("settlements")
      .select("id, payout_amount, status")
      .eq("payee_user_id", viewer.id)
      .eq("status", "scheduled"),
  ]);

  const seatBy = new Map((counts ?? []).map((c) => [c.activity_id, c]));
  const countParts = (activityId: string, status: string) =>
    (parts ?? []).filter((p) => p.activity_id === activityId && p.status === status).length;

  // 오늘 출석: 오늘 시작하는 모임·회차와 출석 기록
  const todayGatherings = [
    ...acts
      .filter(
        (a) =>
          a.kind === "gathering" && a.starts_at && KST_DAY.format(new Date(a.starts_at)) === today,
      )
      .map((a) => ({ id: a.id, title: a.title, participantsOf: a.id })),
    ...(sessions ?? [])
      .filter((s) => s.starts_at && KST_DAY.format(new Date(s.starts_at)) === today)
      .map((s) => ({ id: s.id, title: s.title, participantsOf: s.series_id! })),
  ];
  const { data: todayAttendance } = todayGatherings.length
    ? await supabase
        .from("attendances")
        .select("gathering_id, user_id")
        .in(
          "gathering_id",
          todayGatherings.map((g) => g.id),
        )
    : { data: [] as { gathering_id: string; user_id: string }[] };

  // ── 지금 처리할 일
  const todos: Todo[] = [];
  for (const a of acts) {
    const approvals = countParts(a.id, "pending_approval");
    if (approvals > 0) {
      todos.push({
        key: `approve-${a.id}`,
        href: `/demo/platform/activities/${a.id}`,
        tone: "act",
        title: `가입 승인 ${approvals}건`,
        detail: a.title,
      });
    }
    if (a.status === "draft") {
      todos.push({
        key: `draft-${a.id}`,
        href: `/demo/platform/activities/${a.id}`,
        tone: "act",
        title: "공개 전 초안",
        detail: a.title,
      });
    }
  }
  for (const g of todayGatherings) {
    const confirmed = countParts(g.participantsOf, "confirmed");
    const checked = (todayAttendance ?? []).filter((r) => r.gathering_id === g.id).length;
    if (confirmed > checked) {
      todos.push({
        key: `attend-${g.id}`,
        href: `/demo/platform/activities/${g.id}`,
        tone: "act",
        title: `오늘 출석 체크 ${confirmed - checked}명`,
        detail: g.title,
      });
    }
  }
  for (const d of challengeDetails ?? []) {
    const act = acts.find((a) => a.id === d.activity_id);
    if (act && act.status !== "ended" && d.ends_on < today) {
      todos.push({
        key: `finalize-${d.activity_id}`,
        href: `/demo/platform/activities/${d.activity_id}`,
        tone: "act",
        title: "완주 판정 대기",
        detail: act.title,
      });
    }
  }
  const certsToday = (todayCerts ?? []).filter((c) => c.status === "accepted");
  for (const id of challengeIds) {
    const n = certsToday.filter((c) => c.activity_id === id).length;
    if (n > 0) {
      todos.push({
        key: `certs-${id}`,
        href: `/demo/platform/activities/${id}`,
        tone: "info",
        title: `오늘 올라온 인증 ${n}건`,
        detail: acts.find((a) => a.id === id)?.title ?? "",
      });
    }
  }
  const pendingByAct = new Map<string, number>();
  for (const o of pendingOrders ?? [])
    pendingByAct.set(o.activity_id, (pendingByAct.get(o.activity_id) ?? 0) + 1);
  for (const [id, n] of pendingByAct) {
    todos.push({
      key: `pay-${id}`,
      href: `/demo/platform/activities/${id}`,
      tone: "info",
      title: `입금 대기 ${n}건 · 운영진이 확인해요`,
      detail: acts.find((a) => a.id === id)?.title ?? "",
    });
  }

  // ── 숫자 타일
  const live = acts.filter((a) => ["open", "in_progress"].includes(a.status));
  const byKind = (k: Kind) => live.filter((a) => a.kind === k).length;
  const confirmedTotal = (parts ?? []).filter((p) => p.status === "confirmed").length;
  const unsettled = (myPaidOrders ?? []).filter((o) => !o.settlement_items);
  const unsettledNet = unsettled.reduce(
    (sum, o) => sum + o.amount - Math.round(o.amount * Number(o.fee_rate ?? 0)),
    0,
  );
  // 정산받을 사람(유료 활동의 정산 대상)에게만 정산 타일을 보여 준다.
  const isPayee = (myPaidOrders ?? []).length > 0 || (mySettlements ?? []).length > 0;
  const scheduledPayout = (mySettlements ?? []).reduce((s, x) => s + x.payout_amount, 0);

  // ── 이번 주 일정
  const calendar: CalendarItem[] = [
    ...acts
      .filter((a) => a.kind === "gathering" && a.starts_at && a.starts_at >= nowIso.slice(0, 10))
      .map((a) => ({
        id: a.id,
        kind: "gathering" as const,
        title: a.title,
        startsAt: a.starts_at!,
        href: `/demo/platform/activities/${a.id}`,
      })),
    ...(sessions ?? [])
      .filter((s) => s.starts_at)
      .map((s) => ({
        id: s.id,
        kind: "series" as const,
        title: s.title,
        startsAt: s.starts_at!,
        href: `/demo/platform/activities/${s.id}`,
      })),
  ];

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className="label">HOST</p>
        <h1 className={styles.title}>{viewer.nickname}님이 여는 활동</h1>
        <p className={styles.muted}>
          관리 중인 활동 {acts.length}개 · 처리할 일 {todos.filter((t) => t.tone === "act").length}
          건
        </p>
      </header>

      <div className={styles.bento}>
        {/* 지금 처리할 일 — 검은 기준 패널 */}
        <section className={styles.todoPanel} aria-labelledby="todo-h">
          <h2 id="todo-h" className={styles.todoTitle}>
            지금 처리할 일
          </h2>
          {todos.length === 0 ? (
            <p className={styles.todoEmpty}>지금 처리할 일이 없어요.</p>
          ) : (
            <ul className={styles.todoList}>
              {todos.map((t) => (
                <li key={t.key}>
                  <Link href={t.href} className={styles.todoItem} data-tone={t.tone}>
                    <span className={styles.todoText}>
                      <strong>{t.title}</strong>
                      <span>{t.detail}</span>
                    </span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 숫자 타일 — 종류 색 */}
        <div className={styles.tiles}>
          {(["gathering", "series", "challenge"] as const).map((k) => (
            <div key={k} className={`${styles.tile} ${styles[`kind_${k}`]}`}>
              <span className={styles.tileLabel}>운영 중 {KIND_LABELS[k]}</span>
              <span className={styles.tileValue}>{byKind(k)}</span>
            </div>
          ))}
          <div className={styles.tile}>
            <span className={styles.tileLabel}>확정 참가자</span>
            <span className={styles.tileValue}>{confirmedTotal}명</span>
          </div>
          {isPayee && (
            <Link href="/demo/platform/settlements" className={`${styles.tile} ${styles.tileWide}`}>
              <span className={styles.tileLabel}>정산</span>
              <span className={styles.money}>
                <span>
                  <small>지급 예정</small>
                  <strong>{won(scheduledPayout)}</strong>
                </span>
                <span>
                  <small>아직 정산 전(수수료 뺀 금액)</small>
                  <strong>{won(unsettledNet)}</strong>
                </span>
              </span>
            </Link>
          )}
        </div>

        {/* 이번 주 일정 */}
        <section className={styles.week} aria-labelledby="week-h">
          <h2 id="week-h" className={styles.sectionTitle}>
            이번 주 일정
          </h2>
          <div className={styles.weekGrid}>
            {days.map((d) => {
              const items = calendar
                .filter((c) => KST_DAY.format(new Date(c.startsAt)) === d.key)
                .sort((x, y) => x.startsAt.localeCompare(y.startsAt));
              return (
                <div
                  key={d.key}
                  className={styles.day}
                  data-today={d.key === today}
                  data-empty={items.length === 0}
                >
                  <span className={styles.dayLabel}>{d.label}</span>
                  {items.map((c) => (
                    <Link
                      key={c.id}
                      href={c.href}
                      className={`${styles.block} ${styles[`kind_${c.kind}`]}`}
                    >
                      <span className={styles.blockTime}>
                        {KST_TIME.format(new Date(c.startsAt))}
                      </span>
                      <span className={styles.blockTitle}>{c.title}</span>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* 내 활동 표 */}
      <section className={styles.tableBox} aria-labelledby="acts-h">
        <h2 id="acts-h" className={styles.sectionTitle}>
          관리 중인 활동
        </h2>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">활동</th>
                <th scope="col">상태</th>
                <th scope="col">일정</th>
                <th scope="col">자리</th>
                <th scope="col">대기</th>
                <th scope="col">승인 대기</th>
                <th scope="col">입금 대기</th>
              </tr>
            </thead>
            <tbody>
              {acts.map((a) => {
                const seat = seatBy.get(a.id);
                return (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/demo/platform/activities/${a.id}`} className={styles.actLink}>
                        <span
                          className={`${styles.kindDot} ${styles[`kind_${a.kind}`]}`}
                          aria-hidden="true"
                        />
                        <span>
                          <strong>{a.title}</strong>
                          <small>
                            {KIND_LABELS[a.kind]} ·{" "}
                            {a.clubs?.name ?? ORGANIZER_LABELS[a.organizer_kind]}
                            {a.price > 0 ? ` · ${won(a.price)}` : ""}
                          </small>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <Badge status={a.status} label={ACTIVITY_STATUS_LABELS[a.status]} />
                    </td>
                    <td className={styles.nowrap}>{formatWhen(a.starts_at)}</td>
                    <td className={styles.num}>
                      {seat?.taken ?? 0}/{a.capacity ?? "∞"}
                    </td>
                    <td className={styles.num}>{seat?.waitlisted || "-"}</td>
                    <td className={styles.num}>{seat?.pending || "-"}</td>
                    <td className={styles.num}>{pendingByAct.get(a.id) ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

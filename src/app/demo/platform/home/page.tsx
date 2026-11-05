import Link from "next/link";
import { KIND_LABELS, won } from "@/lib/platform/messages";
import { createSessionClient } from "@/lib/platform/supabase-server";
import { formatWhen, getViewer } from "../_data";
import styles from "./home.module.scss";

// 회원 홈 시안: 대시보드가 아니라 위에서 아래로 읽는 한 줄 — 오늘 → 내 사람들 → 발견.
// 숫자 요약·차트는 두지 않는다. 플랫폼 제품 화면 예외(의미별 파스텔, 라운드 16px)를 쓴다.

type Kind = "gathering" | "series" | "challenge";

type Upcoming = {
  activityId: string;
  kind: Kind;
  title: string;
  startsAt: string;
  endsAt: string | null;
  place: string;
  online: boolean;
};

const KST_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });
const KST_HOUR = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  hour: "numeric",
  hourCycle: "h23",
});
const KST_TIME = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
});

/** 서버 컴포넌트는 요청마다 한 번 그려진다. 시각 계산은 렌더 밖 도우미에서 한다. */
function clock() {
  const now = new Date();
  return {
    nowIso: now.toISOString(),
    today: KST_DAY.format(now),
    tomorrow: KST_DAY.format(new Date(now.getTime() + 86_400_000)),
    hour: Number(KST_HOUR.format(now)),
  };
}

function greeting(hour: number): string {
  if (hour < 6) return "늦은 밤이에요";
  if (hour < 12) return "좋은 아침이에요";
  if (hour < 18) return "좋은 오후예요";
  return "좋은 저녁이에요";
}

function dayWord(iso: string, today: string, tomorrow: string): string {
  const d = KST_DAY.format(new Date(iso));
  if (d === today) return "오늘";
  if (d === tomorrow) return "내일";
  return formatWhen(iso).split(" ").slice(0, 3).join(" ");
}

function initial(name: string): string {
  return name.slice(0, 1);
}

/** 이름에서 아바타 바탕색을 고른다. 의미 없는 장식이 되지 않도록 네 가지 안에서만. */
function avatarTone(name: string): string {
  const tones = [styles.toneA, styles.toneB, styles.toneC, styles.toneD];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return tones[h % tones.length];
}

function Avatar({ name }: { name: string }) {
  return (
    <span className={`${styles.avatar} ${avatarTone(name)}`} aria-hidden="true">
      {initial(name)}
    </span>
  );
}

export default async function MemberHomePage() {
  const viewer = await getViewer();
  const supabase = await createSessionClient();
  const { nowIso, today, tomorrow, hour } = clock();

  // ── 발견: 누구나 보는 모집 중 활동 (로그인 전에도 보인다)
  const { data: openActs } = await supabase
    .from("activities")
    .select(
      "id, kind, title, summary, status, starts_at, price, capacity, allow_late_join, audience, gathering_details(format, area), clubs(name), creator:profiles!activities_created_by_fkey(nickname)",
    )
    .is("series_id", null)
    .in("status", ["open", "in_progress"])
    .order("starts_at");

  if (!viewer) {
    return (
      <div className={styles.home}>
        <header className={styles.hello}>
          <p className="label">MOTIVO SOCIETY</p>
          <h1 className={styles.helloTitle}>{greeting(hour)}</h1>
          <p className={styles.helloSub}>
            지금 모집 중인 모임·시즌·챌린지예요. 위에서 사람을 고르면 그 사람의 홈이 보여요.
          </p>
        </header>
        <Discover acts={openActs ?? []} joined={new Set()} seats={new Map()} />
      </div>
    );
  }

  // ── 오늘: 내가 확정된 참가와 그 일정
  const { data: parts } = await supabase
    .from("participations")
    .select(
      "status, activity:activities(id, kind, title, starts_at, ends_at, status, gathering_details(format, place_name, area))",
    )
    .eq("user_id", viewer.id);
  const confirmed = (parts ?? []).filter((p) => p.status === "confirmed" && p.activity);
  const waiting = (parts ?? []).filter(
    (p) => ["waitlisted", "pending_approval"].includes(p.status) && p.activity,
  );
  const joined = new Set(
    (parts ?? []).filter((p) => p.status !== "cancelled").map((p) => p.activity?.id ?? ""),
  );

  const seriesIds = confirmed
    .filter((p) => p.activity!.kind === "series")
    .map((p) => p.activity!.id);
  const challengeIds = confirmed
    .filter((p) => p.activity!.kind === "challenge" && p.activity!.status === "in_progress")
    .map((p) => p.activity!.id);

  const [{ data: sessions }, { data: myCerts }, { data: pendingOrders }, { data: myClubs }] =
    await Promise.all([
      seriesIds.length
        ? supabase
            .from("activities")
            .select(
              "id, title, starts_at, ends_at, series_id, gathering_details(format, place_name, area)",
            )
            .in("series_id", seriesIds)
            .neq("status", "cancelled")
        : Promise.resolve({ data: [] }),
      challengeIds.length
        ? supabase
            .from("certifications")
            .select("activity_id")
            .eq("user_id", viewer.id)
            .eq("cert_date", today)
        : Promise.resolve({ data: [] as { activity_id: string }[] }),
      supabase
        .from("orders")
        .select("id, amount, due_at, activity:activities(id, title)")
        .eq("user_id", viewer.id)
        .eq("status", "pending"),
      supabase
        .from("club_members")
        .select("club:clubs(id, slug, name, tagline)")
        .eq("user_id", viewer.id)
        .eq("status", "active"),
    ]);

  const upcoming: Upcoming[] = [];
  const pushIf = (u: Upcoming) => {
    const end = u.endsAt ?? u.startsAt;
    if (end >= nowIso) upcoming.push(u);
  };
  for (const p of confirmed) {
    const a = p.activity!;
    if (a.kind !== "gathering" || !a.starts_at) continue;
    pushIf({
      activityId: a.id,
      kind: "gathering",
      title: a.title,
      startsAt: a.starts_at,
      endsAt: a.ends_at,
      online: a.gathering_details?.format === "online",
      place: a.gathering_details?.place_name ?? a.gathering_details?.area ?? "",
    });
  }
  for (const s of sessions ?? []) {
    if (!s.starts_at) continue;
    pushIf({
      activityId: s.id,
      kind: "series",
      title: s.title,
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      online: s.gathering_details?.format === "online",
      place: s.gathering_details?.place_name ?? s.gathering_details?.area ?? "",
    });
  }
  upcoming.sort((x, y) => x.startsAt.localeCompare(y.startsAt));
  const [next, ...later] = upcoming;

  const certifiedToday = new Set((myCerts ?? []).map((c) => c.activity_id));
  const challengeTodos = confirmed
    .filter((p) => challengeIds.includes(p.activity!.id) && !certifiedToday.has(p.activity!.id))
    .map((p) => p.activity!);

  // ── 내 사람들: 내 클럽과 함께하는 챌린지의 최근 인증
  const clubs = (myClubs ?? []).map((m) => m.club).filter((c) => c !== null);
  const clubIds = clubs.map((c) => c.id);
  const [{ data: clubMembers }, { data: clubActs }, { data: companionCerts }] = await Promise.all([
    clubIds.length
      ? supabase
          .from("club_members")
          .select("club_id, user_id, profile:profiles!club_members_user_id_fkey(nickname)")
          .in("club_id", clubIds)
          .eq("status", "active")
      : Promise.resolve({ data: [] }),
    clubIds.length
      ? supabase
          .from("activities")
          .select("id, kind, title, status, starts_at, club_id")
          .in("club_id", clubIds)
          .is("series_id", null)
          .in("status", ["open", "in_progress"])
          .order("starts_at")
      : Promise.resolve({ data: [] }),
    confirmed.some((p) => p.activity!.kind === "challenge")
      ? supabase
          .from("certifications")
          .select(
            "id, cert_date, body, user_id, activity:activities(id, title), author:profiles!certifications_user_id_fkey(nickname)",
          )
          .in(
            "activity_id",
            confirmed.filter((p) => p.activity!.kind === "challenge").map((p) => p.activity!.id),
          )
          .eq("status", "accepted")
          .neq("user_id", viewer.id)
          .order("cert_date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(40)
      : Promise.resolve({ data: [] }),
  ]);

  // 한 사람이 피드를 채우지 않게 사람마다 최신 기록 하나만 보여 준다.
  const seenAuthors = new Set<string>();
  const peopleFeed = (companionCerts ?? []).filter((c) => {
    if (seenAuthors.has(c.user_id)) return false;
    seenAuthors.add(c.user_id);
    return true;
  });

  const { data: seatRows } = await supabase.rpc("activity_seat_counts", {
    p_ids: (openActs ?? []).map((a) => a.id),
  });
  const seats = new Map((seatRows ?? []).map((r) => [r.activity_id, r.taken]));

  const hasToday = next || challengeTodos.length || (pendingOrders ?? []).length || waiting.length;
  // 처음 온 회원: 오늘·내 사람들이 비어 있으면 빈 칸 대신 발견을 먼저 보여 준다.
  const isNewcomer = !hasToday && clubs.length === 0 && peopleFeed.length === 0;

  return (
    <div className={styles.home}>
      <header className={styles.hello}>
        <p className="label">MOTIVO SOCIETY</p>
        <h1 className={styles.helloTitle}>
          {greeting(hour)}, {viewer.nickname}님
        </h1>
      </header>

      {isNewcomer ? (
        <>
          <p className={styles.helloSub}>
            아직 참여 중인 활동이나 클럽이 없어요. 이번 주 열리는 것부터 둘러보세요.
          </p>
          <Discover acts={openActs ?? []} joined={joined} seats={seats} />
          <p className={styles.empty}>
            함께할 사람들을 먼저 찾고 싶다면 <Link href="/demo/platform/clubs">클럽 둘러보기</Link>
          </p>
        </>
      ) : (
        <>
          {/* ── 오늘 */}
          <section className={styles.section} aria-labelledby="today-h">
            <div className={styles.sectionHead}>
              <h2 id="today-h">오늘</h2>
              <span className="label">TODAY</span>
            </div>

            {!hasToday && (
              <p className={styles.empty}>
                다가오는 일정이 없어요. 아래 &quot;발견&quot;에서 이번 주 모임을 둘러보세요.
              </p>
            )}

            {next && (
              <Link
                href={`/demo/platform/activities/${next.activityId}`}
                className={`${styles.nextCard} ${styles[`kind_${next.kind}`]}`}
              >
                <span className={styles.nextWhen}>
                  {dayWord(next.startsAt, today, tomorrow)}{" "}
                  {KST_TIME.format(new Date(next.startsAt))}
                </span>
                <span className={styles.nextTitle}>{next.title}</span>
                <span className={styles.nextMeta}>
                  {KIND_LABELS[next.kind === "series" ? "series" : "gathering"]} ·{" "}
                  {next.online
                    ? "온라인 · 링크는 시작 30분 전부터 열려요"
                    : next.place || "장소 미정"}
                </span>
                <span className={styles.nextAction}>자세히 보기 →</span>
              </Link>
            )}

            <ul className={styles.todoList}>
              {challengeTodos.map((c) => (
                <li key={c.id}>
                  <Link href={`/demo/platform/activities/${c.id}`} className={styles.todo}>
                    <span className={`${styles.dot} ${styles.kind_challenge}`} aria-hidden="true" />
                    <span>
                      <strong>{c.title}</strong> 오늘 인증이 아직이에요
                    </span>
                    <span className={styles.todoGo}>인증하기</span>
                  </Link>
                </li>
              ))}
              {(pendingOrders ?? []).map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/demo/platform/activities/${o.activity?.id}`}
                    className={styles.todo}
                  >
                    <span className={`${styles.dot} ${styles.dotWait}`} aria-hidden="true" />
                    <span>
                      <strong>{o.activity?.title}</strong> {won(o.amount)} 입금을 기다려요 ·{" "}
                      {formatWhen(o.due_at)}까지
                    </span>
                    <span className={styles.todoGo}>안내 보기</span>
                  </Link>
                </li>
              ))}
              {waiting.map((p) => (
                <li key={p.activity!.id}>
                  <Link
                    href={`/demo/platform/activities/${p.activity!.id}`}
                    className={styles.todo}
                  >
                    <span className={`${styles.dot} ${styles.dotWait}`} aria-hidden="true" />
                    <span>
                      <strong>{p.activity!.title}</strong>{" "}
                      {p.status === "waitlisted" ? "대기 명단에 있어요" : "승인을 기다리고 있어요"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {later.length > 0 && (
              <ol className={styles.laterList}>
                {later.slice(0, 3).map((u) => (
                  <li key={u.activityId}>
                    <Link href={`/demo/platform/activities/${u.activityId}`}>
                      <span
                        className={`${styles.dot} ${styles[`kind_${u.kind}`]}`}
                        aria-hidden="true"
                      />
                      <span className={styles.laterWhen}>
                        {dayWord(u.startsAt, today, tomorrow)}{" "}
                        {KST_TIME.format(new Date(u.startsAt))}
                      </span>
                      <span>{u.title}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* ── 내 사람들 */}
          <section className={styles.section} aria-labelledby="people-h">
            <div className={styles.sectionHead}>
              <h2 id="people-h">내 사람들</h2>
              <span className="label">MY PEOPLE</span>
            </div>

            {clubs.length === 0 && peopleFeed.length === 0 && (
              <p className={styles.empty}>
                아직 함께하는 클럽이 없어요. <Link href="/demo/platform/clubs">클럽 둘러보기</Link>
              </p>
            )}

            {peopleFeed.length > 0 && (
              <div className={styles.feed}>
                <p className={styles.feedLead}>
                  같이 챌린지 중인 {peopleFeed.length}명이 최근에 남긴 기록
                </p>
                <ul>
                  {peopleFeed.slice(0, 4).map((c) => (
                    <li key={c.id} className={styles.feedItem}>
                      <Avatar name={c.author?.nickname ?? "?"} />
                      <div>
                        <p className={styles.feedMeta}>
                          <strong>{c.author?.nickname}</strong> · {c.activity?.title} ·{" "}
                          {c.cert_date === today ? "오늘" : c.cert_date.slice(5).replace("-", "/")}
                        </p>
                        <p className={styles.feedBody}>{c.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.clubGrid}>
              {clubs.map((club) => {
                const members = (clubMembers ?? []).filter((m) => m.club_id === club.id);
                const acts = (clubActs ?? []).filter((a) => a.club_id === club.id).slice(0, 2);
                return (
                  <Link
                    key={club.id}
                    href={`/demo/platform/clubs/${club.slug}`}
                    className={styles.clubCard}
                  >
                    <span className={styles.clubName}>
                      <span className={`${styles.clubTag} ${styles.kind_club}`}>클럽</span>
                      {club.name}
                    </span>
                    <span className={styles.avatarStack}>
                      {members.slice(0, 5).map((m) => (
                        <Avatar key={m.user_id} name={m.profile?.nickname ?? "?"} />
                      ))}
                      <span className={styles.memberCount}>{members.length}명이 함께해요</span>
                    </span>
                    {acts.length > 0 ? (
                      <ul className={styles.clubActs}>
                        {acts.map((a) => (
                          <li key={a.id}>
                            <span className={`${styles.dot} ${styles[`kind_${a.kind}`]}`} />
                            {a.title}
                            <span className={styles.clubActWhen}>
                              {a.status === "in_progress"
                                ? "진행 중"
                                : a.starts_at
                                  ? dayWord(a.starts_at, today, tomorrow)
                                  : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className={styles.clubQuiet}>아직 잡힌 활동이 없어요</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>

          <Discover acts={openActs ?? []} joined={joined} seats={seats} />
        </>
      )}
    </div>
  );
}

type OpenAct = {
  id: string;
  kind: string;
  title: string;
  summary: string | null;
  status: string;
  starts_at: string | null;
  price: number;
  capacity: number | null;
  allow_late_join: boolean;
  audience: string;
  gathering_details: { format: string; area: string | null } | null;
  clubs: { name: string } | null;
  creator: { nickname: string } | null;
};

function Discover({
  acts,
  joined,
  seats,
}: {
  acts: OpenAct[];
  joined: Set<string>;
  seats: Map<string, number>;
}) {
  const list = acts
    .filter((a) => !joined.has(a.id))
    .filter((a) => a.status === "open" || a.allow_late_join)
    .slice(0, 6);
  return (
    <section className={styles.section} aria-labelledby="discover-h">
      <div className={styles.sectionHead}>
        <h2 id="discover-h">발견</h2>
        <span className="label">DISCOVER</span>
      </div>
      {list.length === 0 ? (
        <p className={styles.empty}>지금 새로 참여할 수 있는 활동이 없어요.</p>
      ) : (
        <div className={styles.discoverGrid}>
          {list.map((a) => {
            const left = a.capacity !== null ? a.capacity - (seats.get(a.id) ?? 0) : null;
            return (
              <Link
                key={a.id}
                href={`/demo/platform/activities/${a.id}`}
                className={`${styles.discoverCard} ${styles[`kind_${a.kind}`]}`}
              >
                <span className={styles.discoverKind}>
                  {KIND_LABELS[a.kind]}
                  {a.status === "in_progress" && " · 중간에 합류할 수 있어요"}
                </span>
                <span className={styles.discoverTitle}>{a.title}</span>
                {a.summary && <span className={styles.discoverSummary}>{a.summary}</span>}
                <span className={styles.discoverMeta}>
                  {a.status === "in_progress"
                    ? "지금 진행 중"
                    : a.starts_at
                      ? formatWhen(a.starts_at)
                      : "일정 미정"}
                  {a.gathering_details?.area ? ` · ${a.gathering_details.area}` : ""}
                </span>
                <span className={styles.discoverFoot}>
                  <span>{a.clubs?.name ?? a.creator?.nickname}</span>
                  <span>
                    {a.price > 0 ? won(a.price) : "무료"}
                    {left !== null && ` · ${left > 0 ? `${left}자리 남음` : "대기 가능"}`}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

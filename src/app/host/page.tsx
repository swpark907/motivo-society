import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { KindTag } from "@/components/KindTag/KindTag";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { gatheringWhen, periodWhen } from "@/lib/platform/activity-time";
import { getHostAccess, listHostActivities } from "@/lib/platform/host";
import {
  countByTab,
  filterHostActivities,
  HOST_TABS,
  hostHref,
  hostStatusLabel,
  hostTabOf,
  hostTodos,
  parseHostFilters,
  seatText,
  type HostActivity,
} from "@/lib/platform/host-view";
import { ACTIVITY_STATUS_LABELS, KIND_LABELS, won } from "@/lib/platform/messages";
import { requireUser } from "@/lib/platform/session";
import s from "./host.module.scss";

export const metadata: Metadata = {
  title: "호스트 도구",
  description: "내가 여는 모임·시즌·챌린지를 한곳에서 관리해요.",
  robots: { index: false },
};

const EMPTY_TEXT: Record<string, string> = {
  live: "지금 모집하거나 진행 중인 활동이 없어요.",
  draft: "작성 중인 활동이 없어요.",
  past: "지난 활동이 아직 없어요.",
  cancelled: "취소한 활동이 없어요.",
};

export default async function HostPage({ searchParams }: PageProps<"/host">) {
  const filters = parseHostFilters(await searchParams);
  const user = await requireUser(hostHref(filters));
  const access = await getHostAccess();

  if (!access.eligible) {
    return (
      <PlatformPage label="HOST" title="호스트 도구">
        <EmptyState
          title="활동을 여는 사람이 쓰는 곳이에요"
          body="호스트 자격이 있거나 클럽에서 활동을 만드는 역할을 맡으면, 여기서 내가 연 모임·시즌·챌린지를 관리해요."
          action={{ href: "/explore", label: "발견에서 활동 찾기" }}
        />
      </PlatformPage>
    );
  }

  const now = new Date();
  const all = await listHostActivities(now);
  const todos = hostTodos(all, now);
  const counts = countByTab(all, now);
  const rows = filterHostActivities(all, filters, now);
  const clubs = [
    ...new Map(all.filter((a) => a.clubId).map((a) => [a.clubId!, a.clubName ?? "클럽"])),
  ];
  const filtered = Boolean(filters.kind || filters.club || filters.q);
  // 활동을 열 수 있는 사람에게만 만들기와 도구(보관함 · 정산)를 보인다. 진행만 맡은 사람은 활동 목록만.
  const canCreate = Boolean(access.hostTier || access.clubCreate || access.official);

  return (
    <PlatformPage
      label="HOST"
      title="호스트 도구"
      lead={`${user.nickname}님이 여는 활동을 한곳에서 봐요. 끝난 활동의 기록도 여기 남아요.`}
    >
      <section className={s.todo} aria-labelledby="todo-h">
        <h2 id="todo-h">지금 처리할 일</h2>
        {todos.length === 0 ? (
          <p className={s.todoEmpty}>지금 처리할 일이 없어요.</p>
        ) : (
          <ul>
            {todos.map((t) => (
              <li key={t.key}>
                <Link href={`/host/activities/${t.activityId}`} data-tone={t.tone}>
                  <span>
                    <strong>{t.title}</strong>
                    <small>{t.detail}</small>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canCreate && (
        <nav className={s.tools} aria-label="도구">
          <Link href="/host/saved">
            <strong>내 보관함</strong>
            <small>양식 · 장소 · 공지 문구</small>
          </Link>
          <Link href="/host/media">
            <strong>이미지 보관함</strong>
            <small>표지 사진</small>
          </Link>
          <Link href="/host/settlements">
            <strong>정산</strong>
            <small>받을 참가비 · 지급 내역</small>
          </Link>
        </nav>
      )}

      <section className={s.acts} aria-labelledby="acts-h">
        <div className={s.actsHead}>
          <h2 id="acts-h" className={s.sectionTitle}>
            내가 연 활동
          </h2>
          {canCreate && (
            <Link href="/host/new" className={s.create}>
              활동 만들기
            </Link>
          )}
        </div>

        <nav className={s.tabs} aria-label="활동 나누기">
          {HOST_TABS.map((t) => (
            <Link
              key={t.tab}
              href={hostHref(filters, { tab: t.tab })}
              aria-current={t.tab === filters.tab ? "page" : undefined}
            >
              {t.label}
              <span>{counts[t.tab]}</span>
            </Link>
          ))}
        </nav>

        <form className={s.filters} action="/host" role="search" aria-label="활동 거르기">
          {filters.tab !== "live" && <input type="hidden" name="tab" value={filters.tab} />}
          <label className={s.field}>
            <span>종류</span>
            <select name="kind" defaultValue={filters.kind ?? ""}>
              <option value="">전체</option>
              {(["gathering", "series", "challenge"] as const).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          {clubs.length > 0 && (
            <label className={s.field}>
              <span>클럽</span>
              <select name="club" defaultValue={filters.club ?? ""}>
                <option value="">전체</option>
                {clubs.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className={`${s.field} ${s.search}`}>
            <span>제목</span>
            <input type="search" name="q" defaultValue={filters.q} placeholder="제목으로 찾기" />
          </label>
          <button type="submit" className={s.apply}>
            찾기
          </button>
          {filtered && (
            <Link href={hostHref(filters, { kind: null, club: null, q: "" })} className={s.reset}>
              조건 지우기
            </Link>
          )}
        </form>

        {rows.length === 0 ? (
          filtered ? (
            <EmptyState
              title="조건에 맞는 활동이 없어요"
              body="종류·클럽·제목 조건을 지우면 이 탭의 활동이 다시 보여요."
              action={{
                href: hostHref(filters, { kind: null, club: null, q: "" }),
                label: "조건 지우기",
              }}
            />
          ) : (
            <EmptyState title={EMPTY_TEXT[filters.tab]} />
          )
        ) : (
          <ul className={s.list}>
            {rows.map((a) => (
              <ActivityRow key={a.id} a={a} now={now} />
            ))}
          </ul>
        )}
      </section>
    </PlatformPage>
  );
}

function whenText(a: HostActivity, now: Date): string {
  if (!a.startsAt) return "일정 미정";
  if (a.kind === "gathering") return gatheringWhen(new Date(a.startsAt), now);
  return periodWhen(new Date(a.startsAt), a.endsAt ? new Date(a.endsAt) : null);
}

function ActivityRow({ a, now }: { a: HostActivity; now: Date }) {
  const alerts = [
    a.pendingApproval > 0 && `승인 대기 ${a.pendingApproval}`,
    a.pendingPayment > 0 && `입금 대기 ${a.pendingPayment}`,
    a.waitlisted > 0 && `대기 ${a.waitlisted}`,
  ].filter(Boolean) as string[];
  return (
    <li className={s.row}>
      <div className={s.rowHead}>
        <KindTag kind={a.kind} />
        <StatusBadge
          status={hostTabOf(a, now) === "past" ? "ended" : a.status}
          label={hostStatusLabel(a, now, ACTIVITY_STATUS_LABELS)}
        />
        {a.clubName && <span className={s.club}>{a.clubName}</span>}
      </div>
      <Link href={`/host/activities/${a.id}`} className={s.rowTitle}>
        {a.title}
      </Link>
      <p className={s.meta}>
        <span>{whenText(a, now)}</span>
        <span>확정 {seatText(a)}</span>
        <span>{a.price > 0 ? won(a.price) : "무료"}</span>
      </p>
      {alerts.length > 0 && (
        <p className={s.alerts}>
          {alerts.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </p>
      )}
    </li>
  );
}

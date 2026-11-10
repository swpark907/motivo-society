// 호스트 도구(/host) 첫 화면의 계산: 활동 나누기 · 거르기 · 지금 처리할 일. React·DB 의존 없음.
import type { ActivityKind } from "./explore-filters";
import { isUuid } from "./ids";

export type HostActivityStatus =
  "draft" | "open" | "closed" | "in_progress" | "ended" | "cancelled";

export type HostActivity = {
  id: string;
  slug: string;
  kind: ActivityKind;
  title: string;
  status: HostActivityStatus;
  startsAt: string | null;
  endsAt: string | null;
  clubId: string | null;
  clubName: string | null;
  capacity: number | null;
  price: number;
  cover: string | null;
  confirmed: number;
  waitlisted: number;
  pendingApproval: number;
  pendingPayment: number;
  /** 오늘(한국 날짜) 열리는 모임 또는 시즌 회차가 있는가. */
  meetsToday: boolean;
};

export type HostTab = "live" | "draft" | "past" | "cancelled";

export const HOST_TABS: { tab: HostTab; label: string }[] = [
  { tab: "live", label: "모집·진행" },
  { tab: "draft", label: "작성 중" },
  { tab: "past", label: "지난" },
  { tab: "cancelled", label: "취소" },
];

/** 끝난 시각(없으면 시작 시각)이 지났으면 상태와 상관없이 지난 활동이다. */
export function hostTabOf(
  a: Pick<HostActivity, "status" | "startsAt" | "endsAt">,
  now: Date,
): HostTab {
  if (a.status === "cancelled") return "cancelled";
  if (a.status === "draft") return "draft";
  if (a.status === "ended") return "past";
  const finish = a.endsAt ?? a.startsAt;
  if (finish && new Date(finish).getTime() <= now.getTime()) return "past";
  return "live";
}

export type HostFilters = {
  tab: HostTab;
  kind: ActivityKind | null;
  club: string | null;
  q: string;
};

const KINDS: ActivityKind[] = ["gathering", "series", "challenge"];

export function parseHostFilters(sp: Record<string, string | string[] | undefined>): HostFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const tab = HOST_TABS.find((t) => t.tab === one(sp.tab))?.tab ?? "live";
  const kind = KINDS.find((k) => k === one(sp.kind)) ?? null;
  const club = isUuid(one(sp.club)) ? one(sp.club) : null;
  const q = one(sp.q).trim().slice(0, 40);
  return { tab, kind, club, q };
}

/** 같은 화면 주소. 기본값은 주소에 쓰지 않는다. */
export function hostHref(f: HostFilters, patch: Partial<HostFilters> = {}): string {
  const next = { ...f, ...patch };
  const qs = new URLSearchParams();
  if (next.tab !== "live") qs.set("tab", next.tab);
  if (next.kind) qs.set("kind", next.kind);
  if (next.club) qs.set("club", next.club);
  if (next.q) qs.set("q", next.q);
  const s = qs.toString();
  return s ? `/host?${s}` : "/host";
}

/**
 * 탭 · 종류 · 클럽 · 검색으로 거른다.
 * 정렬: 모집·진행 중은 가까운 순, 작성 중은 일정 순(없으면 뒤), 지난·취소는 최근 순.
 */
export function filterHostActivities(
  all: HostActivity[],
  f: HostFilters,
  now: Date,
): HostActivity[] {
  const q = f.q.toLowerCase();
  const time = (a: HostActivity) =>
    a.startsAt ? new Date(a.startsAt).getTime() : Number.POSITIVE_INFINITY;
  const rows = all.filter(
    (a) =>
      hostTabOf(a, now) === f.tab &&
      (!f.kind || a.kind === f.kind) &&
      (!f.club || a.clubId === f.club) &&
      (!q || a.title.toLowerCase().includes(q)),
  );
  const recentFirst = f.tab === "past" || f.tab === "cancelled";
  return rows.sort((x, y) => {
    const d = recentFirst ? time(y) - time(x) : time(x) - time(y);
    return (Number.isNaN(d) ? 0 : d) || x.title.localeCompare(y.title, "ko");
  });
}

export function countByTab(all: HostActivity[], now: Date): Record<HostTab, number> {
  const out: Record<HostTab, number> = { live: 0, draft: 0, past: 0, cancelled: 0 };
  for (const a of all) out[hostTabOf(a, now)] += 1;
  return out;
}

export type HostTodo = {
  key: string;
  activityId: string;
  /** act: 호스트가 할 일 · info: 알고만 있으면 되는 일(입금 확인은 운영진 몫) */
  tone: "act" | "info";
  title: string;
  detail: string;
};

/** 지금 처리할 일: 승인 대기 → 오늘 열리는 모임 → 공개 전 초안 → 입금 대기(알림만). */
export function hostTodos(all: HostActivity[], now: Date): HostTodo[] {
  const todos: HostTodo[] = [];
  const live = all.filter((a) => hostTabOf(a, now) === "live");
  for (const a of live) {
    if (a.pendingApproval > 0) {
      todos.push({
        key: `approve-${a.id}`,
        activityId: a.id,
        tone: "act",
        title: `참가 승인 대기 ${a.pendingApproval}명`,
        detail: a.title,
      });
    }
  }
  for (const a of live) {
    if (a.meetsToday) {
      todos.push({
        key: `today-${a.id}`,
        activityId: a.id,
        tone: "act",
        title: `오늘 열려요 · 확정 ${a.confirmed}명`,
        detail: a.title,
      });
    }
  }
  for (const a of all.filter((x) => x.status === "draft")) {
    todos.push({
      key: `draft-${a.id}`,
      activityId: a.id,
      tone: "act",
      title: "아직 공개 전이에요",
      detail: a.title,
    });
  }
  // 기간이 끝났는데 아직 마무리(완주 판정·종료)가 안 된 활동. 판정 버튼은 활동 관리 화면(H02)에서.
  for (const a of all) {
    if (hostTabOf(a, now) === "past" && a.status !== "ended") {
      todos.push({
        key: `wrap-${a.id}`,
        activityId: a.id,
        tone: "info",
        title:
          a.kind === "challenge" ? "기간이 끝났어요 · 완주 판정 전" : "기간이 끝났어요 · 마무리 전",
        detail: a.title,
      });
    }
  }
  for (const a of live) {
    if (a.pendingPayment > 0) {
      todos.push({
        key: `pay-${a.id}`,
        activityId: a.id,
        tone: "info",
        title: `입금 대기 ${a.pendingPayment}명 · 운영진이 확인해요`,
        detail: a.title,
      });
    }
  }
  return todos;
}

/** 상태 배지 글자. 기간이 지났는데 DB 상태가 아직 열려 있으면 "기간 끝남"으로 보인다. */
export function hostStatusLabel(
  a: Pick<HostActivity, "status" | "startsAt" | "endsAt">,
  now: Date,
  labels: Record<string, string>,
): string {
  if (hostTabOf(a, now) === "past" && a.status !== "ended") return "기간 끝남";
  return labels[a.status] ?? a.status;
}

/** 자리 표시: "3/5명" · 정원 없음이면 "3명". */
export function seatText(a: Pick<HostActivity, "confirmed" | "capacity">): string {
  return a.capacity ? `${a.confirmed}/${a.capacity}명` : `${a.confirmed}명`;
}

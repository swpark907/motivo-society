// 발견 화면의 필터. URL 쿼리에 담아 공유·뒤로 가기에서 그대로 복원한다. React 의존 없음.
import { kstWeekRange } from "./activity-time";

export type ActivityKind = "gathering" | "series" | "challenge";

export type ExploreFilters = {
  kind: ActivityKind | null;
  format: "online" | "offline" | null;
  when: "this-week" | "next-week" | null;
  free: boolean;
};

export const EMPTY_FILTERS: ExploreFilters = { kind: null, format: null, when: null, free: false };

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string): string | undefined {
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

/** 모르는 값은 버린다(옛 링크·잘못된 링크도 화면이 깨지지 않게). */
export function parseExploreFilters(params: Params): ExploreFilters {
  const kind = one(params, "kind");
  const format = one(params, "format");
  const when = one(params, "when");
  return {
    kind: kind === "gathering" || kind === "series" || kind === "challenge" ? kind : null,
    format: format === "online" || format === "offline" ? format : null,
    when: when === "this-week" || when === "next-week" ? when : null,
    free: one(params, "free") === "1",
  };
}

export function hasFilters(f: ExploreFilters): boolean {
  return f.kind !== null || f.format !== null || f.when !== null || f.free;
}

/** 필터 하나를 바꾼 주소. 같은 값을 다시 누르면 해제된다. */
export function exploreHref(current: ExploreFilters, change: Partial<ExploreFilters>): string {
  const next: ExploreFilters = { ...current };
  for (const [key, value] of Object.entries(change) as [keyof ExploreFilters, never][]) {
    next[key] = (current[key] === value ? EMPTY_FILTERS[key] : value) as never;
  }
  const q = new URLSearchParams();
  if (next.kind) q.set("kind", next.kind);
  if (next.format) q.set("format", next.format);
  if (next.when) q.set("when", next.when);
  if (next.free) q.set("free", "1");
  const s = q.toString();
  return s ? `/explore?${s}` : "/explore";
}

/** 필터에 쓰는 활동 정보. */
export type FilterableActivity = {
  kind: ActivityKind;
  online: boolean;
  price: number;
  startsAt: string | null;
  endsAt: string | null;
};

export function matchesFilters(a: FilterableActivity, f: ExploreFilters, now: Date): boolean {
  if (f.kind && a.kind !== f.kind) return false;
  if (f.format === "online" && !a.online) return false;
  if (f.format === "offline" && a.online) return false;
  if (f.free && a.price > 0) return false;
  if (f.when) {
    if (!a.startsAt) return false;
    // 기간이 그 주와 겹치면 포함한다(진행 중인 시즌·챌린지도 그 주에 할 수 있다).
    const [weekStart, weekEnd] = kstWeekRange(now, f.when === "this-week" ? 0 : 1);
    const start = new Date(a.startsAt);
    const end = new Date(a.endsAt ?? a.startsAt);
    if (start >= weekEnd || end < weekStart) return false;
  }
  return true;
}

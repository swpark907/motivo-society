// 내 일정의 계산(정렬·묶기·달력). 모든 날짜는 한국 시간 기준이다. React·DB 의존 없음.
import { kstDayStart, shortDate } from "./activity-time";
import type { ActivityKind } from "./explore-filters";

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const VIDEO_OPENS_BEFORE_MS = 30 * 60 * 1000; // DB의 get_activity_private와 같은 값

export type ParticipationStatus =
  "confirmed" | "pending_payment" | "pending_approval" | "waitlisted";

/** 일정 한 줄. 시즌은 회차마다 한 줄, 챌린지는 기간 한 줄. */
export type ScheduleRow = {
  key: string;
  /** 참가 정보(화상 링크)를 물어볼 활동: 모임이면 그 모임, 회차면 그 회차. */
  activityId: string;
  slug: string; // 상세 주소. 회차는 소속 시즌의 slug
  kind: ActivityKind;
  title: string;
  /** 회차 이름: "2회차 · 첫 화면" */
  sub: string | null;
  startsAt: string;
  endsAt: string | null;
  place: string | null;
  online: boolean;
  status: ParticipationStatus;
  attendance: "attended" | "absent" | null;
  challenge: { accepted: number; threshold: number; outcome: string | null } | null;
};

export type Schedule = { upcoming: ScheduleRow[]; past: ScheduleRow[] };

/** 언제까지 "다가오는" 일정인가: 끝나는 시각(없으면 시작 시각). */
function finishOf(row: ScheduleRow): number {
  return new Date(row.endsAt ?? row.startsAt).getTime();
}

/** 정렬 기준: 진행 중인 챌린지는 오늘 맨 앞에, 나머지는 시작 시각. */
export function sortKey(row: ScheduleRow, now: Date): number {
  const start = new Date(row.startsAt).getTime();
  if (row.kind !== "challenge") return start;
  return Math.max(start, kstDayStart(now).getTime());
}

/**
 * 다가오는 것과 지난 것으로 나눈다.
 * - 다가오는: 아직 끝나지 않은 것(기다리는 신청 포함), 가까운 순.
 * - 지난: 확정된 참가만(대기·입금 대기로 끝난 건 내 활동이 아니다), 최근 순.
 */
export function splitSchedule(rows: ScheduleRow[], now: Date): Schedule {
  const t = now.getTime();
  const upcoming = rows
    .filter((r) => finishOf(r) > t)
    .sort((x, y) => sortKey(x, now) - sortKey(y, now) || x.title.localeCompare(y.title, "ko"));
  const past = rows
    .filter((r) => finishOf(r) <= t && r.status === "confirmed")
    .sort((x, y) => finishOf(y) - finishOf(x));
  return { upcoming, past };
}

/** "2026-11-09" — 한국 날짜 키. */
export function kstDateKey(at: Date): string {
  return new Date(at.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

function keyToDate(key: string): Date {
  return new Date(`${key}T00:00:00+09:00`);
}

export type DayGroup = { key: string; label: string; rows: ScheduleRow[] };

/** 다가오는 일정을 날짜별로 묶는다. 진행 중인 챌린지는 오늘에 들어간다. */
export function groupByDay(rows: ScheduleRow[], now: Date): DayGroup[] {
  const groups: DayGroup[] = [];
  const today = kstDateKey(now);
  const tomorrow = kstDateKey(new Date(now.getTime() + DAY_MS));
  for (const row of rows) {
    const key = kstDateKey(new Date(sortKey(row, now)));
    let group = groups.find((g) => g.key === key);
    if (!group) {
      const date = shortDate(keyToDate(key));
      const label = key === today ? `오늘 · ${date}` : key === tomorrow ? `내일 · ${date}` : date;
      group = { key, label, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  }
  return groups;
}

/** 지난 일정을 달별로 묶는다: "2026년 11월". */
export function groupByMonth(rows: ScheduleRow[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const row of rows) {
    const key = kstDateKey(new Date(row.startsAt)).slice(0, 7);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      const [y, m] = key.split("-").map(Number);
      group = { key, label: `${y}년 ${m}월`, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  }
  return groups;
}

/** 챌린지의 오늘이 며칠째인지: { day: 5, total: 14 }. 시작 전이면 day 0, 끝났으면 total. */
export function challengeDay(row: ScheduleRow, now: Date): { day: number; total: number } {
  const start = kstDayStart(new Date(row.startsAt)).getTime();
  const end = row.endsAt ? new Date(row.endsAt).getTime() : start + DAY_MS;
  const total = Math.max(1, Math.round((end - start) / DAY_MS));
  const elapsed = Math.floor((kstDayStart(now).getTime() - start) / DAY_MS) + 1;
  return { day: Math.min(total, Math.max(0, elapsed)), total };
}

/** 화상 링크 상태. 확정된 온라인 모임·회차만. */
export function videoState(
  row: ScheduleRow,
  now: Date,
): { kind: "open" } | { kind: "later"; opensAt: Date } | null {
  if (!row.online || row.kind === "challenge" || row.status !== "confirmed") return null;
  if (finishOf(row) <= now.getTime()) return null;
  const opensAt = new Date(new Date(row.startsAt).getTime() - VIDEO_OPENS_BEFORE_MS);
  return now >= opensAt ? { kind: "open" } : { kind: "later", opensAt };
}

// ── 달력

/** "2026-11" 같은 값이 맞으면 그대로, 아니면 이번 달. */
export function parseMonth(value: string | undefined, now: Date): string {
  if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value;
  return kstDateKey(now).slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** 그 달을 덮는 주들(월요일 시작). 앞뒤 달의 날도 칸을 채운다. */
export function monthGrid(month: string): string[][] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const sinceMonday = (first.getUTCDay() + 6) % 7;
  const start = new Date(first.getTime() - sinceMonday * DAY_MS);
  const last = new Date(Date.UTC(y, m, 0));
  const weeks: string[][] = [];
  for (let cursor = start; cursor <= last;) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor.toISOString().slice(0, 10));
      cursor = new Date(cursor.getTime() + DAY_MS);
    }
    weeks.push(week);
  }
  return weeks;
}

/** 그날에 걸친 일정: 모임·회차는 시작한 날, 챌린지는 기간 안의 모든 날. */
export function rowsOnDay(rows: ScheduleRow[], day: string): ScheduleRow[] {
  const dayStart = keyToDate(day).getTime();
  const dayEnd = dayStart + DAY_MS;
  return rows.filter((r) => {
    const start = new Date(r.startsAt).getTime();
    if (r.kind !== "challenge") return start >= dayStart && start < dayEnd;
    const end = r.endsAt ? new Date(r.endsAt).getTime() : start + DAY_MS;
    return start < dayEnd && end > dayStart;
  });
}

/** 챌린지 막대가 그날 이어지는 모양: 시작 · 중간 · 끝 · 하루. */
export function barShape(row: ScheduleRow, day: string): "start" | "middle" | "end" | "single" {
  const first = kstDateKey(new Date(row.startsAt));
  const lastMoment = row.endsAt
    ? new Date(new Date(row.endsAt).getTime() - 1)
    : new Date(row.startsAt);
  const last = kstDateKey(lastMoment);
  if (first === last) return "single";
  if (day === first) return "start";
  if (day === last) return "end";
  return "middle";
}

/** 달력 날짜 파라미터 검사: 그 달 안의 "YYYY-MM-DD"만. */
export function parseDay(value: string | undefined, month: string): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !value.startsWith(month)) return null;
  return Number.isNaN(keyToDate(value).getTime()) ? null : value;
}

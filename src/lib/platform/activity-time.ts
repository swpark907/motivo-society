// 활동 날짜 표시. 모든 계산은 한국 시간 기준이다(명세 0절). React 의존 없음.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 한국 시간 기준 그날 0시(UTC 시각으로). */
export function kstDayStart(at: Date): Date {
  const kst = new Date(at.getTime() + KST_OFFSET_MS);
  return new Date(
    Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - KST_OFFSET_MS,
  );
}

/** 한국 시간 기준 날짜 차이(오늘 0, 내일 1). */
export function kstDaysUntil(target: Date, now: Date): number {
  return Math.round((kstDayStart(target).getTime() - kstDayStart(now).getTime()) / DAY_MS);
}

/** 이번 주(offset 0)·다음 주(1)의 [월요일 0시, 다음 월요일 0시). */
export function kstWeekRange(now: Date, offset = 0): [Date, Date] {
  const today = kstDayStart(now);
  const weekday = new Date(today.getTime() + KST_OFFSET_MS).getUTCDay(); // 0=일
  const sinceMonday = (weekday + 6) % 7;
  const start = new Date(today.getTime() - sinceMonday * DAY_MS + offset * 7 * DAY_MS);
  return [start, new Date(start.getTime() + 7 * DAY_MS)];
}

function parts(at: Date) {
  const kst = new Date(at.getTime() + KST_OFFSET_MS);
  return {
    month: kst.getUTCMonth() + 1,
    day: kst.getUTCDate(),
    weekday: WEEKDAYS[kst.getUTCDay()],
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
  };
}

/** 장부·티켓의 큰 날짜: { date: "11.8", weekday: "일" } */
export function dateMark(at: Date): { date: string; weekday: string } {
  const p = parts(at);
  return { date: `${p.month}.${p.day}`, weekday: p.weekday };
}

/** 티켓의 큰 시각: "19:30"(24시간제) */
export function clock24(at: Date): string {
  const p = parts(at);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** "11.8 (일)" */
export function shortDate(at: Date): string {
  const p = parts(at);
  return `${p.month}.${p.day} (${p.weekday})`;
}

/** "오후 7:30" */
export function clockTime(at: Date): string {
  const p = parts(at);
  const ampm = p.hour < 12 ? "오전" : "오후";
  const h = p.hour % 12 === 0 ? 12 : p.hour % 12;
  return `${ampm} ${h}:${String(p.minute).padStart(2, "0")}`;
}

/** 카드 오른쪽 위 배지: "오늘" · "내일" · "D-5". 지난 날짜면 null. */
export function dayBadge(startsAt: Date, now: Date): string | null {
  const days = kstDaysUntil(startsAt, now);
  if (days < 0) return null;
  if (days === 0) return "오늘";
  if (days === 1) return "내일";
  return `D-${days}`;
}

/** 오늘·내일이면 날짜 대신 그 말을 쓴다. */
function dayWord(at: Date, now: Date): string {
  const days = kstDaysUntil(at, now);
  return days === 0 ? "오늘" : days === 1 ? "내일" : shortDate(at);
}

/** 모임: "오늘 · 오후 8:00" / "11.8 (일) · 오후 7:30" */
export function gatheringWhen(startsAt: Date, now: Date): string {
  return `${dayWord(startsAt, now)} · ${clockTime(startsAt)}`;
}

/** 기간: "11.2 (일) – 11.15 (토)" */
export function periodWhen(startsAt: Date, endsAt: Date | null): string {
  if (!endsAt) return `${shortDate(startsAt)}부터`;
  // 끝 시각이 0시면 그 전날까지다(챌린지는 마지막 날 다음 0시로 저장한다).
  const lastDay =
    kstDayStart(endsAt).getTime() === endsAt.getTime() ? new Date(endsAt.getTime() - 1) : endsAt;
  return `${shortDate(startsAt)} – ${shortDate(lastDay)}`;
}

/** 입금 기한까지 남은 시간: "23시간 5분 남았어요" · "12분 남았어요" · null(지남). */
export function timeLeftText(due: Date, now: Date): string | null {
  const ms = due.getTime() - now.getTime();
  if (ms <= 0) return null;
  const minutes = Math.ceil(ms / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분 남았어요`;
  return m === 0 ? `${h}시간 남았어요` : `${h}시간 ${m}분 남았어요`;
}

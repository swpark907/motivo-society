// 챌린지 참여 화면의 날짜 계산. 날짜는 한국 시간 "YYYY-MM-DD" 문자열로 다룬다. React·DB 의존 없음.

const DAY_MS = 24 * 60 * 60 * 1000;

function utc(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function addDays(date: string, days: number): string {
  return new Date(utc(date) + days * DAY_MS).toISOString().slice(0, 10);
}

/** 시작일을 1일째로 센 날짜 번호. */
export function dayNoOf(startsOn: string, date: string): number {
  return Math.round((utc(date) - utc(startsOn)) / DAY_MS) + 1;
}

export function totalDays(startsOn: string, endsOn: string): number {
  return dayNoOf(startsOn, endsOn);
}

export type Phase = "before" | "during" | "after";

export function challengePhase(startsOn: string, endsOn: string, today: string): Phase {
  if (today < startsOn) return "before";
  if (today > endsOn) return "after";
  return "during";
}

export type DayCell = {
  date: string;
  no: number;
  /** done 인정 · rejected 반려 · missed 매일 인증인데 빠짐 · today 오늘(아직) · rest 그 밖(미래 또는 쉬어도 되는 날) */
  state: "done" | "rejected" | "missed" | "today" | "rest";
};

/** 기간의 날마다 내 인증 상태. 매일 인증일 때만 지난 빈 날을 "빠짐"으로 본다. */
export function dayStrip(
  startsOn: string,
  endsOn: string,
  today: string,
  certs: { date: string; status: "accepted" | "rejected" }[],
  rule: "daily" | "weekly_n" | "total_n",
): DayCell[] {
  const byDate = new Map(certs.map((c) => [c.date, c.status]));
  const cells: DayCell[] = [];
  for (let date = startsOn; date <= endsOn; date = addDays(date, 1)) {
    const cert = byDate.get(date);
    let state: DayCell["state"] = "rest";
    if (cert === "accepted") state = "done";
    else if (cert === "rejected") state = "rejected";
    else if (date === today) state = "today";
    else if (date < today && rule === "daily") state = "missed";
    cells.push({ date, no: dayNoOf(startsOn, date), state });
  }
  return cells;
}

/** 완주까지 남은 인증 수와 진행 비율(0~100). */
export function finishProgress(accepted: number, threshold: number): { left: number; pct: number } {
  const left = Math.max(0, threshold - accepted);
  const pct = threshold > 0 ? Math.min(100, Math.round((accepted / threshold) * 100)) : 0;
  return { left, pct };
}

/** 오늘의 미션: 그날 번호의 미션이 있으면 그것, 없으면 자유 미션(번호 없음). */
export function missionFor<T extends { dayNo: number | null }>(
  missions: T[],
  dayNo: number,
): T | null {
  return missions.find((m) => m.dayNo === dayNo) ?? missions.find((m) => m.dayNo === null) ?? null;
}

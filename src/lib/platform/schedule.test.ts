import { describe, expect, it } from "vitest";
import {
  barShape,
  challengeDay,
  groupByDay,
  groupByMonth,
  monthGrid,
  parseDay,
  parseMonth,
  rowsOnDay,
  shiftMonth,
  splitSchedule,
  videoState,
  type ScheduleRow,
} from "./schedule";

// 2026-11-09 (월) 오후 3시, 한국 시간
const NOW = new Date("2026-11-09T15:00:00+09:00");

function row(over: Partial<ScheduleRow> & Pick<ScheduleRow, "key" | "startsAt">): ScheduleRow {
  return {
    activityId: over.key,
    slug: over.key,
    kind: "gathering",
    title: over.key,
    sub: null,
    endsAt: null,
    place: "망원동",
    online: false,
    status: "confirmed",
    attendance: null,
    challenge: null,
    ...over,
  };
}

const challenge = row({
  key: "chal",
  kind: "challenge",
  startsAt: "2026-11-05T00:00:00+09:00",
  endsAt: "2026-11-19T00:00:00+09:00", // 11.18까지
  online: true,
  place: null,
});
const tonight = row({
  key: "tonight",
  startsAt: "2026-11-09T20:00:00+09:00",
  endsAt: "2026-11-09T22:00:00+09:00",
});
const session2 = row({
  key: "s2",
  kind: "series",
  sub: "2회차",
  startsAt: "2026-11-11T19:30:00+09:00",
  endsAt: "2026-11-11T21:30:00+09:00",
  online: true,
});
const futureChallenge = row({
  key: "chal-next",
  kind: "challenge",
  startsAt: "2026-11-10T00:00:00+09:00",
  endsAt: "2026-11-17T00:00:00+09:00",
});
const lastWeek = row({
  key: "last",
  startsAt: "2026-11-02T20:00:00+09:00",
  endsAt: "2026-11-02T22:00:00+09:00",
  attendance: "attended",
});
const session1 = row({
  key: "s1",
  kind: "series",
  startsAt: "2026-10-28T19:30:00+09:00",
  endsAt: "2026-10-28T21:30:00+09:00",
});
const waitedAndEnded = row({
  key: "waited",
  status: "waitlisted",
  startsAt: "2026-11-03T20:00:00+09:00",
});

describe("splitSchedule", () => {
  const all = [session2, lastWeek, tonight, futureChallenge, session1, challenge, waitedAndEnded];
  const { upcoming, past } = splitSchedule(all, NOW);

  it("회차와 챌린지를 섞어 가까운 순으로: 진행 중인 챌린지가 오늘 맨 앞", () => {
    expect(upcoming.map((r) => r.key)).toEqual(["chal", "tonight", "chal-next", "s2"]);
  });

  it("지난 것은 확정 참가만, 최근 순", () => {
    expect(past.map((r) => r.key)).toEqual(["last", "s1"]);
  });

  it("오늘 진행 중인 모임은 아직 다가오는 일정이다", () => {
    const now = new Date("2026-11-09T21:00:00+09:00");
    expect(splitSchedule([tonight], now).upcoming).toHaveLength(1);
  });
});

describe("groupByDay / groupByMonth", () => {
  it("오늘·내일은 말로, 나머지는 날짜로", () => {
    const { upcoming } = splitSchedule([challenge, tonight, futureChallenge, session2], NOW);
    expect(groupByDay(upcoming, NOW).map((g) => [g.label, g.rows.length])).toEqual([
      ["오늘 · 11.9 (월)", 2],
      ["내일 · 11.10 (화)", 1],
      ["11.11 (수)", 1],
    ]);
  });

  it("지난 일정은 달별로", () => {
    expect(groupByMonth([lastWeek, session1]).map((g) => g.label)).toEqual([
      "2026년 11월",
      "2026년 10월",
    ]);
  });
});

describe("challengeDay", () => {
  it("며칠째인지", () => {
    expect(challengeDay(challenge, NOW)).toEqual({ day: 5, total: 14 });
  });
  it("시작 전이면 0일째", () => {
    expect(challengeDay(futureChallenge, NOW)).toEqual({ day: 0, total: 7 });
  });
});

describe("videoState", () => {
  it("시작 30분 전부터 열린다", () => {
    expect(videoState(session2, NOW)).toMatchObject({ kind: "later" });
    expect(videoState(session2, new Date("2026-11-11T19:00:00+09:00"))).toEqual({ kind: "open" });
  });
  it("오프라인·챌린지·확정 전에는 없다", () => {
    expect(videoState(tonight, NOW)).toBeNull();
    expect(videoState(challenge, NOW)).toBeNull();
    expect(videoState({ ...session2, status: "waitlisted" }, NOW)).toBeNull();
  });
});

describe("달력", () => {
  it("월요일로 시작하는 주들", () => {
    const weeks = monthGrid("2026-11");
    expect(weeks[0][0]).toBe("2026-10-26");
    expect(weeks.at(-1)!.at(-1)).toBe("2026-12-06");
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });

  it("월 이동과 파라미터 검사", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(parseMonth("2026-13", NOW)).toBe("2026-11");
    expect(parseMonth("2027-02", NOW)).toBe("2027-02");
    expect(parseDay("2026-11-12", "2026-11")).toBe("2026-11-12");
    expect(parseDay("2026-12-01", "2026-11")).toBeNull();
  });

  it("챌린지는 기간 안의 모든 날에, 모임은 그날에만", () => {
    expect(rowsOnDay([challenge, tonight], "2026-11-09").map((r) => r.key)).toEqual([
      "chal",
      "tonight",
    ]);
    expect(rowsOnDay([challenge, tonight], "2026-11-18").map((r) => r.key)).toEqual(["chal"]);
    expect(rowsOnDay([challenge], "2026-11-19")).toEqual([]);
  });

  it("막대 모양", () => {
    expect(barShape(challenge, "2026-11-05")).toBe("start");
    expect(barShape(challenge, "2026-11-10")).toBe("middle");
    expect(barShape(challenge, "2026-11-18")).toBe("end");
  });
});

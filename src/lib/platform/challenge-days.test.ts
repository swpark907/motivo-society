import { describe, expect, it } from "vitest";
import {
  challengePhase,
  dayNoOf,
  dayStrip,
  finishProgress,
  missionFor,
  totalDays,
} from "./challenge-days";

describe("챌린지 날짜", () => {
  it("시작일이 1일째, 기간 일수", () => {
    expect(dayNoOf("2026-11-05", "2026-11-09")).toBe(5);
    expect(totalDays("2026-11-05", "2026-11-18")).toBe(14);
    expect(dayNoOf("2026-10-30", "2026-11-02")).toBe(4); // 달을 넘어도
  });

  it("기간 전·중·후", () => {
    expect(challengePhase("2026-11-05", "2026-11-18", "2026-11-04")).toBe("before");
    expect(challengePhase("2026-11-05", "2026-11-18", "2026-11-18")).toBe("during");
    expect(challengePhase("2026-11-05", "2026-11-18", "2026-11-19")).toBe("after");
  });

  it("매일 인증: 지난 빈 날은 빠짐, 오늘은 아직, 나머지는 쉼", () => {
    const cells = dayStrip(
      "2026-11-05",
      "2026-11-10",
      "2026-11-08",
      [
        { date: "2026-11-05", status: "accepted" },
        { date: "2026-11-07", status: "rejected" },
      ],
      "daily",
    );
    expect(cells.map((c) => c.state)).toEqual([
      "done",
      "missed",
      "rejected",
      "today",
      "rest",
      "rest",
    ]);
    expect(cells[3]).toMatchObject({ date: "2026-11-08", no: 4 });
  });

  it("주 N회·총 N회는 빈 날을 빠짐으로 보지 않는다", () => {
    const cells = dayStrip("2026-11-05", "2026-11-07", "2026-11-07", [], "weekly_n");
    expect(cells.map((c) => c.state)).toEqual(["rest", "rest", "today"]);
  });

  it("완주까지 남은 수", () => {
    expect(finishProgress(3, 10)).toEqual({ left: 7, pct: 30 });
    expect(finishProgress(12, 10)).toEqual({ left: 0, pct: 100 });
  });

  it("그날 미션이 없으면 자유 미션", () => {
    const missions = [
      { dayNo: null, title: "자유" },
      { dayNo: 5, title: "5일째" },
    ];
    expect(missionFor(missions, 5)?.title).toBe("5일째");
    expect(missionFor(missions, 4)?.title).toBe("자유");
    expect(missionFor([{ dayNo: 1, title: "첫날" }], 2)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  clockTime,
  dayBadge,
  gatheringWhen,
  kstDaysUntil,
  kstWeekRange,
  periodWhen,
  shortDate,
} from "./activity-time";

// 2026-11-06(금) 22:30 KST = 13:30 UTC
const NOW = new Date("2026-11-06T13:30:00Z");

describe("한국 시간 날짜 계산", () => {
  it("자정을 넘기는 UTC 시각도 한국 날짜로 센다", () => {
    expect(kstDaysUntil(new Date("2026-11-06T15:30:00Z"), NOW)).toBe(1); // 11.7 00:30 KST
    expect(kstDaysUntil(new Date("2026-11-06T14:59:00Z"), NOW)).toBe(0);
  });

  it("이번 주는 월요일부터 일요일까지", () => {
    const [start, end] = kstWeekRange(NOW);
    expect(start.toISOString()).toBe("2026-11-01T15:00:00.000Z"); // 11.2(월) 0시 KST
    expect(end.toISOString()).toBe("2026-11-08T15:00:00.000Z");
    expect(kstWeekRange(NOW, 1)[0].toISOString()).toBe("2026-11-08T15:00:00.000Z");
  });

  it("일요일 밤도 그 주에 속한다", () => {
    const sundayNight = new Date("2026-11-08T14:00:00Z"); // 11.8(일) 23:00 KST
    expect(kstWeekRange(sundayNight)[0].toISOString()).toBe("2026-11-01T15:00:00.000Z");
  });
});

describe("표시", () => {
  it("배지는 오늘·내일·D-n", () => {
    expect(dayBadge(new Date("2026-11-06T14:00:00Z"), NOW)).toBe("오늘");
    expect(dayBadge(new Date("2026-11-07T05:00:00Z"), NOW)).toBe("내일");
    expect(dayBadge(new Date("2026-11-11T05:00:00Z"), NOW)).toBe("D-5");
    expect(dayBadge(new Date("2026-11-01T05:00:00Z"), NOW)).toBeNull();
  });

  it("날짜와 시각", () => {
    const at = new Date("2026-11-08T10:30:00Z"); // 11.8(일) 19:30 KST
    expect(shortDate(at)).toBe("11.8 (일)");
    expect(clockTime(at)).toBe("오후 7:30");
    expect(clockTime(new Date("2026-11-08T03:05:00Z"))).toBe("오후 12:05");
    expect(gatheringWhen(at, NOW)).toBe("11.8 (일) · 오후 7:30");
    expect(gatheringWhen(new Date("2026-11-06T14:00:00Z"), NOW)).toBe("오늘 · 오후 11:00");
  });

  it("기간의 끝이 0시면 그 전날까지로 보인다", () => {
    expect(periodWhen(new Date("2026-11-01T15:00:00Z"), new Date("2026-11-15T15:00:00Z"))).toBe(
      "11.2 (월) – 11.15 (일)",
    );
  });
});

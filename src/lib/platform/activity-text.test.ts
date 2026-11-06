import { describe, expect, it } from "vitest";
import {
  accountNumber,
  certFormatsText,
  certRuleText,
  dateOnly,
  refundText,
  sessionState,
} from "./activity-text";

describe("activity-text", () => {
  it("인증 규칙", () => {
    expect(certRuleText("daily", null)).toBe("매일 한 번 인증해요");
    expect(certRuleText("weekly_n", 3)).toBe("한 주에 3번 인증해요");
    expect(certFormatsText(["text", "link"])).toBe("글 · 링크");
  });

  it("환불 규정 문장", () => {
    expect(
      refundText([
        { days_before: 0, rate: 0 },
        { days_before: 7, rate: 100 },
        { days_before: 3, rate: 50 },
      ]),
    ).toBe("시작 7일 전까지 전액 · 3일 전까지 50% · 그 뒤에는 환불되지 않아요");
  });

  it("회차 상태", () => {
    const now = new Date("2026-11-06T09:00:00Z");
    expect(sessionState("2026-11-06T11:00:00Z", "open", now)).toBe("오늘");
    expect(sessionState("2026-10-30T11:00:00Z", "ended", now)).toBe("끝남");
    expect(sessionState("2026-11-13T11:00:00Z", "open", now)).toBeNull();
  });

  it("날짜만", () => {
    expect(dateOnly("2026-11-02")).toBe("11.2 (월)");
  });
});

describe("accountNumber", () => {
  it("문구에서 계좌번호만", () => {
    expect(accountNumber("(가짜) 모쏘은행 000-0000-0000 예금주 오디스트웍스")).toBe(
      "000-0000-0000",
    );
    expect(accountNumber("계좌 준비 중")).toBe("계좌 준비 중");
  });
});

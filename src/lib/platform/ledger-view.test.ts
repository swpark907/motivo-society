import { describe, expect, it } from "vitest";
import { historyText, parseLedger } from "./ledger-view";

describe("장부 읽기", () => {
  it("관리하는 사람: 정산 몫을 나눠 보여 준다", () => {
    const l = parseLedger({
      access: "manager",
      public: false,
      received: 30000,
      refunded: 0,
      fee: 3000,
      other_income: 0,
      expense: 10000,
      net: 17000,
      payout: 27000,
      settled: 13500,
      scheduled: 0,
      entries: [
        { id: "e", kind: "expense", amount: 10000, memo: "대관", occurred_on: "2026-11-09" },
      ],
      history: [],
    });
    expect(l).toMatchObject({
      access: "manager",
      payout: { total: 27000, settled: 13500, scheduled: 0, unsettled: 13500 },
    });
  });

  it("참가자에게는 정산이 없고, 볼 수 없으면 none", () => {
    expect(parseLedger({ access: "participant", entries: [] })).toMatchObject({ payout: null });
    expect(parseLedger({ access: "none" })).toEqual({ access: "none" });
    expect(parseLedger(null)).toEqual({ access: "none" });
  });
});

describe("고친 기록", () => {
  it("적음 · 고침 · 지움 · 공개", () => {
    const a = { kind: "expense", amount: 30000, memo: "대관" };
    expect(historyText("ledger.created", { after: a })).toBe("적음: 지출 · 대관 30,000원");
    expect(historyText("ledger.updated", { before: a, after: { ...a, amount: 25000 } })).toBe(
      "고침: 지출 · 대관 30,000원 → 지출 · 대관 25,000원",
    );
    expect(historyText("ledger.deleted", { before: { ...a, kind: "income" } })).toBe(
      "지움: 기타 수입 · 대관 30,000원",
    );
    expect(historyText("ledger.visibility", { public: true })).toBe("장부를 참가자에게 공개");
  });
});

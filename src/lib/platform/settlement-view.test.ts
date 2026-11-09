import { describe, expect, it } from "vitest";
import {
  groupByMonth,
  parseOverview,
  periodText,
  totals,
  type Settlement,
} from "./settlement-view";

const s = (over: Partial<Settlement>): Settlement => ({
  id: "s",
  periodStart: "2026-10-26",
  periodEnd: "2026-11-02",
  status: "paid",
  paidAt: null,
  gross: 10000,
  refund: 0,
  fee: 1000,
  payout: 9000,
  activities: [],
  ...over,
});

describe("정산 화면", () => {
  it("DB 결과를 읽고 모르는 값은 0으로", () => {
    const o = parseOverview({
      settlements: [
        { id: "a", status: "scheduled", payout: 5, activities: [{ id: "x", title: "t" }] },
      ],
      unsettled: { payout: 7 },
    });
    expect(o.settlements[0]).toMatchObject({ status: "scheduled", payout: 5, gross: 0 });
    expect(o.settlements[0].activities[0]).toMatchObject({ manageable: false });
    expect(o.unsettled).toMatchObject({ payout: 7, activities: [] });
    expect(parseOverview(null).settlements).toEqual([]);
  });

  it("끝난 달로 묶고 최근 달부터, 달 합계", () => {
    const g = groupByMonth([
      s({ id: "1", periodEnd: "2026-10-31", payout: 1 }),
      s({ id: "2", periodEnd: "2026-11-02", payout: 2 }),
      s({ id: "3", periodEnd: "2026-11-09", payout: 3 }),
    ]);
    expect(g.map((m) => [m.label, m.payout])).toEqual([
      ["2026년 11월", 5],
      ["2026년 10월", 1],
    ]);
  });

  it("정산 예정 · 지급 완료 합계와 기간 글자", () => {
    expect(totals([s({ payout: 9000 }), s({ status: "scheduled", payout: 4000 })])).toEqual({
      scheduled: 4000,
      paid: 9000,
    });
    expect(periodText("2026-10-26", "2026-11-02")).toBe("10.26 – 11.2");
    expect(periodText("2026-11-02", "2026-11-02")).toBe("11.2");
  });
});

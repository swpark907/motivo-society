import { describe, expect, it } from "vitest";
import { canRequestRefund, orderStage, quoteText, stageTone, type RefundInfo } from "./order-view";

const refund = (status: RefundInfo["status"]): RefundInfo => ({
  status,
  amount: 10000,
  rate: 50,
  requestedAt: "2026-11-09T10:00:00+09:00",
  processedAt: null,
  paidAt: null,
  reason: null,
  note: null,
});

describe("orderStage", () => {
  it("환불이 있으면 환불 단계가 먼저", () => {
    expect(orderStage("paid", refund("requested"))).toBe("refund_requested");
    expect(orderStage("partially_refunded", refund("approved"))).toBe("refund_approved");
    expect(orderStage("refunded", refund("paid"))).toBe("refund_paid");
  });

  it("거절된 환불이면 다시 결제 완료", () => {
    expect(orderStage("paid", refund("rejected"))).toBe("paid");
  });

  it("환불이 없으면 주문 상태 그대로", () => {
    expect(orderStage("pending", null)).toBe("pending");
    expect(orderStage("expired", null)).toBe("expired");
    expect(orderStage("cancelled", null)).toBe("cancelled");
    expect(orderStage("paid", null)).toBe("paid");
  });
});

describe("환불 요청", () => {
  it("결제 완료이고 돌려받을 돈이 있을 때만", () => {
    expect(canRequestRefund("paid", 10000)).toBe(true);
    expect(canRequestRefund("paid", 0)).toBe(false);
    expect(canRequestRefund("refund_requested", 10000)).toBe(false);
    expect(canRequestRefund("pending", 10000)).toBe(false);
  });

  it("견적 문장", () => {
    expect(quoteText(20000, 100)).toBe("지금 요청하면 20,000원 전액을 돌려받아요.");
    expect(quoteText(10000, 50)).toBe("지금 요청하면 10,000원(50%)을 돌려받아요.");
    expect(quoteText(0, 0)).toBe("지금은 규정상 돌려받을 수 있는 금액이 없어요.");
  });

  it("배지 모양", () => {
    expect(stageTone("refund_requested")).toBe("pending");
    expect(stageTone("refund_paid")).toBe("paid");
    expect(stageTone("expired")).toBe("cancelled");
  });
});

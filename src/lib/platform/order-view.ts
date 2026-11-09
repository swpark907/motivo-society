// 회원에게 보이는 주문 상태. 주문 상태와 환불 상태를 합쳐 한 줄로 말한다. React·DB 의존 없음.

export type RefundInfo = {
  status: "requested" | "approved" | "rejected" | "paid";
  amount: number;
  rate: number;
  requestedAt: string;
  processedAt: string | null;
  paidAt: string | null;
  reason: string | null;
  note: string | null;
};

export type OrderStage =
  | "pending" // 입금 대기
  | "expired" // 기한 만료
  | "cancelled" // 입금 전 취소
  | "paid" // 결제 완료(환불 없음 또는 거절됨)
  | "refund_requested"
  | "refund_approved" // 승인, 송금 전
  | "refund_paid";

/** 가장 최근 환불(거절된 것 포함) 하나와 주문 상태로 단계를 정한다. */
export function orderStage(orderStatus: string, refund: RefundInfo | null): OrderStage {
  if (refund?.status === "paid") return "refund_paid";
  if (refund?.status === "approved") return "refund_approved";
  if (refund?.status === "requested") return "refund_requested";
  if (orderStatus === "pending") return "pending";
  if (orderStatus === "expired") return "expired";
  if (orderStatus === "cancelled") return "cancelled";
  return "paid";
}

export const STAGE_LABELS: Record<OrderStage, string> = {
  pending: "입금 대기",
  expired: "기한 만료",
  cancelled: "입금 전 취소",
  paid: "결제 완료",
  refund_requested: "환불 요청됨",
  refund_approved: "환불 승인",
  refund_paid: "환불 완료",
};

/** 배지 모양: 진행됐거나 유효(진한 면) · 기다림(오렌지 선) · 끝남(흐린 글자). StatusBadge의 status 값으로 쓴다. */
export function stageTone(stage: OrderStage): "paid" | "pending" | "cancelled" {
  if (stage === "paid" || stage === "refund_paid") return "paid";
  if (stage === "pending" || stage === "refund_requested" || stage === "refund_approved")
    return "pending";
  return "cancelled";
}

/** 환불을 요청할 수 있는가: 결제 완료이고, 진행 중인 환불이 없고, 돌려받을 돈이 있을 때. */
export function canRequestRefund(stage: OrderStage, quoteAmount: number | null): boolean {
  return stage === "paid" && quoteAmount !== null && quoteAmount > 0;
}

/** 견적 문장: "지금 요청하면 10,000원(50%)을 돌려받아요" */
export function quoteText(amount: number, rate: number): string {
  if (amount <= 0) return "지금은 규정상 돌려받을 수 있는 금액이 없어요.";
  const won = `${amount.toLocaleString("ko-KR")}원`;
  return rate === 100
    ? `지금 요청하면 ${won} 전액을 돌려받아요.`
    : `지금 요청하면 ${won}(${rate}%)을 돌려받아요.`;
}

"use server";

import { redirect } from "next/navigation";
import { errorMessage } from "@/lib/platform/messages";
import { requestRefund } from "@/lib/platform/orders";

export type RefundFormState = { error: string | null };

/** 환불을 요청한다. 성공하면 같은 주문 화면에서 요청됨을 보여 준다. */
export async function submitRefund(
  _prev: RefundFormState,
  formData: FormData,
): Promise<RefundFormState> {
  const orderNo = String(formData.get("orderNo") ?? "");
  if (!/^MS-\d{6}-\d{4,}$/.test(orderNo)) throw new Error("invalid order");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (reason && reason.length > 500) return { error: "사유는 500자까지 적을 수 있어요." };
  const code = await requestRefund(String(formData.get("orderId")), reason);
  if (code) return { error: errorMessage(code) };
  redirect(`/me/orders/${orderNo}?notice=refund_requested`);
}

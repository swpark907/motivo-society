import type { MyParticipation } from "./apply-state";
import { errorCodeFrom } from "./messages";
import { createSessionClient } from "./supabase-server";

// 신청·취소와 내 신청 내역. 상태를 바꾸는 일은 DB 함수(security definer)만 한다.

export type MyApplication = {
  status: Exclude<MyParticipation, null>;
  order: {
    no: string;
    amount: number;
    depositor: string;
    dueAt: string;
    status: string;
  } | null;
  bankNote: string | null;
  waitlisted: number;
};

/** 신청한다. 성공하면 결과 상태, 실패하면 오류 코드. */
export async function applyTo(
  activityId: string,
  depositor: string | null,
): Promise<{ status: string } | { error: string }> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("participation_apply", {
    p_activity: activityId,
    p_depositor: depositor ?? undefined,
  });
  if (error) return { error: errorCodeFrom(error.message) };
  return { status: String(data) };
}

/** 내 신청을 취소한다(결제가 끝난 것은 DB가 막고 환불 요청으로 보낸다). */
export async function cancelMine(activityId: string): Promise<string | null> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("participation_cancel", { p_activity: activityId });
  return error ? errorCodeFrom(error.message) : null;
}

/** 이 활동에 대한 내 신청 내역. 없거나 취소했으면 null. */
export async function getMyApplication(activityId: string): Promise<MyApplication | null> {
  const supabase = await createSessionClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: part } = await supabase
    .from("participations")
    .select(
      "status, orders!participations_order_id_fkey(order_no, amount, depositor_name, due_at, status)",
    )
    .eq("activity_id", activityId)
    .eq("user_id", auth.user.id)
    .neq("status", "cancelled")
    .maybeSingle();
  if (!part) return null;

  const [{ data: settings }, { data: seats }] = await Promise.all([
    part.status === "pending_payment"
      ? supabase.from("platform_settings").select("bank_account_note").maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.rpc("activity_seat_counts", { p_ids: [activityId] }),
  ]);
  const order = part.orders;
  return {
    status: part.status as MyApplication["status"],
    order: order
      ? {
          no: order.order_no,
          amount: order.amount,
          depositor: order.depositor_name,
          dueAt: order.due_at,
          status: order.status,
        }
      : null,
    bankNote: settings?.bank_account_note ?? null,
    waitlisted: seats?.[0]?.waitlisted ?? 0,
  };
}

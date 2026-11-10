import { errorCodeFrom } from "./messages";
import { orderStage, type OrderStage, type RefundInfo } from "./order-view";
import { createSessionClient } from "./supabase-server";

// 내 주문과 환불. 읽기는 내 주문만(운영진 권한이 있어도 MY 화면에서는 내 것만), 쓰기는 DB 함수만.

export type MyOrder = {
  id: string;
  no: string;
  title: string;
  slug: string | null;
  kind: string | null;
  startsAt: string | null;
  amount: number;
  depositor: string;
  dueAt: string;
  createdAt: string;
  confirmedAt: string | null;
  status: string;
  stage: OrderStage;
  refund: RefundInfo | null;
};

const ORDER_COLUMNS =
  "id, order_no, amount, depositor_name, due_at, created_at, confirmed_at, status, item_snapshot, refund_policy_id, activity:activities(slug, kind, title, starts_at), refunds(status, amount, rate, requested_at, processed_at, paid_at, reason, note)";

type Row = {
  id: string;
  order_no: string;
  amount: number;
  depositor_name: string;
  due_at: string;
  created_at: string;
  confirmed_at: string | null;
  status: string;
  item_snapshot: unknown;
  activity: { slug: string; kind: string; title: string; starts_at: string | null } | null;
  refunds: {
    status: string;
    amount: number;
    rate: number;
    requested_at: string;
    processed_at: string | null;
    paid_at: string | null;
    reason: string | null;
    note: string | null;
  }[];
};

function toOrder(r: Row): MyOrder {
  // 가장 최근 환불 하나(거절된 뒤 다시 요청할 수 있으므로).
  const last = [...r.refunds].sort((x, y) => y.requested_at.localeCompare(x.requested_at))[0];
  const refund: RefundInfo | null = last
    ? {
        status: last.status as RefundInfo["status"],
        amount: last.amount,
        rate: last.rate,
        requestedAt: last.requested_at,
        processedAt: last.processed_at,
        paidAt: last.paid_at,
        reason: last.reason,
        note: last.note,
      }
    : null;
  const snapshotTitle = (r.item_snapshot as { title?: string } | null)?.title;
  return {
    id: r.id,
    no: r.order_no,
    title: r.activity?.title ?? snapshotTitle ?? "활동",
    slug: r.activity?.slug ?? null,
    kind: r.activity?.kind ?? null,
    startsAt: r.activity?.starts_at ?? null,
    amount: r.amount,
    depositor: r.depositor_name,
    dueAt: r.due_at,
    createdAt: r.created_at,
    confirmedAt: r.confirmed_at,
    status: r.status,
    stage: orderStage(r.status, refund),
    refund,
  };
}

export async function listMyOrders(userId: string): Promise<MyOrder[]> {
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as Row[]).map(toOrder);
}

export type OrderDetail = MyOrder & {
  quote: { amount: number; rate: number; daysBefore: number } | null;
  rules: { days_before: number; rate: number }[] | null;
  bankNote: string | null;
};

export async function getMyOrder(userId: string, orderNo: string): Promise<OrderDetail | null> {
  if (!/^MS-\d{6}-\d{4,}$/.test(orderNo)) return null;
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("user_id", userId)
    .eq("order_no", orderNo)
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as Row & { refund_policy_id: string | null };
  const order = toOrder(row);

  const [quote, policy, settings] = await Promise.all([
    order.stage === "paid"
      ? supabase.rpc("refund_quote", { p_order: order.id })
      : Promise.resolve({ data: null }),
    row.refund_policy_id
      ? supabase
          .from("refund_policies")
          .select("rules")
          .eq("id", row.refund_policy_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    order.stage === "pending"
      ? supabase.from("platform_settings").select("bank_account_note").maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const q = quote.data as { amount: number; rate: number; days_before: number } | null;
  return {
    ...order,
    quote: q ? { amount: q.amount, rate: q.rate, daysBefore: q.days_before } : null,
    rules: (policy.data?.rules as { days_before: number; rate: number }[] | undefined) ?? null,
    bankNote: settings.data?.bank_account_note ?? null,
  };
}

/** 환불을 요청한다. 성공이면 null, 실패면 오류 코드. 금액은 DB가 그 순간의 규정으로 다시 계산한다. */
export async function requestRefund(
  orderId: string,
  reason: string | null,
): Promise<string | null> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("refund_request", {
    p_order: orderId,
    p_reason: reason ?? undefined,
  });
  return error ? errorCodeFrom(error.message) : null;
}

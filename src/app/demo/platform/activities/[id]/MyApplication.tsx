import {
  ORDER_STATUS_LABELS,
  PARTICIPATION_LABELS,
  REFUND_STATUS_LABELS,
  won,
} from "@/lib/platform/messages";
import { createSessionClient } from "@/lib/platform/supabase-server";
import { applyToActivity, cancelParticipation, requestRefund } from "../../actions";
import { formatWhen, type Viewer } from "../../_data";
import { Badge, ReturnTo } from "../../_ui";
import styles from "../../sandbox.module.scss";

type Quote = { days_before: number; rate: number; amount: number; order_amount: number };

/** 활동 상세의 "내 신청" 칸: 신청 · 입금 안내 · 입금 전 취소 · 환불 요청. */
export async function MyApplication({
  activityId,
  price,
  viewer,
  path,
}: {
  activityId: string;
  price: number;
  viewer: Viewer;
  path: string;
}) {
  if (!viewer) {
    return <p className={styles.muted}>위에서 사람을 골라 로그인하면 신청할 수 있어요.</p>;
  }

  const supabase = await createSessionClient();
  const [{ data: mine }, { data: order }, { data: settings }] = await Promise.all([
    supabase
      .from("participations")
      .select("status")
      .eq("activity_id", activityId)
      .eq("user_id", viewer.id)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("id, order_no, amount, status, due_at, depositor_name, refunds(status, amount, rate)")
      .eq("activity_id", activityId)
      .eq("user_id", viewer.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("platform_settings").select("bank_account_note, order_due_hours").maybeSingle(),
  ]);

  const status = mine?.status ?? null;
  const active = status !== null && status !== "cancelled";
  const openRefund = order?.refunds.find((r) => r.status !== "rejected");
  const { data: quoteData } =
    order?.status === "paid" && !openRefund
      ? await supabase.rpc("refund_quote", { p_order: order.id })
      : { data: null };
  const quote = quoteData as Quote | null;

  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <p>{status ? `지금 상태: ${PARTICIPATION_LABELS[status]}` : "아직 신청하지 않았어요."}</p>
        {!active && (
          <form action={applyToActivity} className={styles.row}>
            <ReturnTo path={path} />
            <input type="hidden" name="activityId" value={activityId} />
            {price > 0 && (
              <label className={styles.field}>
                <span>입금자명</span>
                <input name="depositor" defaultValue={viewer.nickname} maxLength={20} />
              </label>
            )}
            <button type="submit" className={styles.primaryButton}>
              {status === "cancelled" ? "다시 신청하기" : "신청하기"}
            </button>
          </form>
        )}
        {active && status !== "confirmed" && (
          <form action={cancelParticipation}>
            <ReturnTo path={path} />
            <input type="hidden" name="activityId" value={activityId} />
            <button type="submit" className={styles.ghostButton}>
              {status === "pending_payment" ? "입금 전 취소" : "신청 취소"}
            </button>
          </form>
        )}
        {status === "confirmed" && price === 0 && (
          <form action={cancelParticipation}>
            <ReturnTo path={path} />
            <input type="hidden" name="activityId" value={activityId} />
            <button type="submit" className={styles.ghostButton}>
              신청 취소
            </button>
          </form>
        )}
      </div>

      {price > 0 && !order && (
        <p className={styles.muted}>
          신청하면 주문이 생기고 자리가 잡혀요. {settings?.order_due_hours ?? 24}시간 안에 입금하면
          운영진이 확인한 뒤 확정돼요.
        </p>
      )}

      {order && (
        <dl className={styles.meta}>
          <div>
            <dt>주문 번호</dt>
            <dd>{order.order_no}</dd>
          </div>
          <div>
            <dt>주문 상태</dt>
            <dd>
              <Badge status={order.status} label={ORDER_STATUS_LABELS[order.status]} />
            </dd>
          </div>
          <div>
            <dt>금액</dt>
            <dd>{won(order.amount)}</dd>
          </div>
          <div>
            <dt>입금자명</dt>
            <dd>{order.depositor_name}</dd>
          </div>
          {order.status === "pending" && (
            <>
              <div>
                <dt>입금 기한</dt>
                <dd>{formatWhen(order.due_at)}</dd>
              </div>
              <div>
                <dt>입금 계좌</dt>
                <dd>{settings?.bank_account_note}</dd>
              </div>
            </>
          )}
          {openRefund && (
            <div>
              <dt>환불</dt>
              <dd>
                {REFUND_STATUS_LABELS[openRefund.status]} · {won(openRefund.amount)} (
                {openRefund.rate}%)
              </dd>
            </div>
          )}
        </dl>
      )}

      {quote && order && (
        <form action={requestRefund} className={styles.refundBox}>
          <ReturnTo path={path} />
          <input type="hidden" name="orderId" value={order.id} />
          <p>
            지금 환불을 요청하면 시작 {quote.days_before}일 전이라 규정상{" "}
            <strong>
              {quote.rate}%, {won(quote.amount)}
            </strong>
            을 돌려받아요. (시험 규정: 7일 전 100%, 3일 전 50%, 그 뒤 0%)
          </p>
          <label className={styles.field}>
            <span>사유 (선택)</span>
            <input name="reason" maxLength={100} />
          </label>
          <button type="submit" className={styles.ghostButton}>
            환불 요청
          </button>
        </form>
      )}
    </div>
  );
}

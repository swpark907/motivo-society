import Link from "next/link";
import { ORDER_STATUS_LABELS, REFUND_STATUS_LABELS, won } from "@/lib/platform/messages";
import { createSessionClient } from "@/lib/platform/supabase-server";
import { confirmPayment, decideRefund, expireOverdueOrders, markRefundPaid } from "../actions";
import { formatWhen } from "../_data";
import { Badge, Notice, ReturnTo, type SearchParams } from "../_ui";
import styles from "../sandbox.module.scss";

const PATH = "/demo/platform/ops";

/** 서버 컴포넌트는 요청마다 한 번 그려진다. 지금 시각과 기한을 비교해 표시만 한다. */
function isOverdue(dueAt: string): boolean {
  return new Date(dueAt).getTime() < Date.now();
}

export default async function OpsQueuePage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createSessionClient();
  const { data: isCommerce } = await supabase.rpc("has_platform_permission", {
    p_permission: "commerce",
  });

  if (!isCommerce) {
    return (
      <>
        <Notice searchParams={searchParams} />
        <h1 className={styles.title}>운영 대기열</h1>
        <p className={styles.muted}>
          입금 확인과 환불 처리는 거래 권한이 있는 운영진(지금은 소유자)만 해요. 위에서 모쏘운영으로
          바꿔 보세요.
        </p>
      </>
    );
  }

  const [{ data: pending }, { data: refunds }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, order_no, amount, depositor_name, due_at, status, buyer:profiles!orders_user_id_fkey(nickname), activity:activities(id, title)",
      )
      .eq("status", "pending")
      .order("due_at"),
    supabase
      .from("refunds")
      .select(
        "id, status, amount, rate, reason, requested_at, order:orders(order_no, amount, status, buyer:profiles!orders_user_id_fkey(nickname), activity:activities(title))",
      )
      .in("status", ["requested", "approved"])
      .order("requested_at"),
  ]);

  return (
    <>
      <Notice searchParams={searchParams} />
      <h1 className={styles.title}>운영 대기열</h1>
      <p className={styles.muted}>
        계좌이체 단계의 운영 업무예요. 입금을 확인하면 이용권 발급과 참가 확정이 한 번에 일어나요.
        나중에 PG 결제가 붙으면 같은 함수를 결제 웹훅이 불러요.
      </p>

      <section className={styles.panel} aria-labelledby="pending-heading">
        <div className={styles.row}>
          <h2 id="pending-heading" className={styles.panelTitle}>
            입금 확인 대기 {pending?.length ?? 0}건
          </h2>
          <form action={expireOverdueOrders}>
            <ReturnTo path={PATH} />
            <button type="submit" className={styles.ghostButton}>
              기한 지난 주문 만료 처리
            </button>
          </form>
        </div>
        <p className={styles.muted}>
          운영에서는 주기 작업이 만료를 자동으로 돌려요. 여기서는 버튼으로 대신 실행해요.
        </p>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">주문</th>
              <th scope="col">활동</th>
              <th scope="col">입금자명</th>
              <th scope="col">금액</th>
              <th scope="col">기한</th>
              <th scope="col">처리</th>
            </tr>
          </thead>
          <tbody>
            {(pending ?? []).map((o) => {
              const overdue = isOverdue(o.due_at);
              return (
                <tr key={o.id}>
                  <td className={styles.nowrap}>
                    {o.order_no}
                    <br />
                    <small className={styles.muted}>{o.buyer?.nickname}</small>
                  </td>
                  <td>
                    <Link href={`/demo/platform/activities/${o.activity?.id}`}>
                      {o.activity?.title}
                    </Link>
                  </td>
                  <td>{o.depositor_name}</td>
                  <td className={styles.nowrap}>{won(o.amount)}</td>
                  <td className={overdue ? styles.overdue : undefined}>
                    {formatWhen(o.due_at)}
                    {overdue && " (지남)"}
                  </td>
                  <td>
                    <form action={confirmPayment}>
                      <ReturnTo path={PATH} />
                      <input type="hidden" name="orderId" value={o.id} />
                      <button type="submit" className={styles.smallPrimary}>
                        입금 확인
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className={styles.panel} aria-labelledby="refund-heading">
        <h2 id="refund-heading" className={styles.panelTitle}>
          환불 처리 {refunds?.length ?? 0}건
        </h2>
        <p className={styles.muted}>
          승인하면 이용권이 회수되고 참가가 취소되며, 빈자리는 대기자에게 넘어가요. 돈을 보낸 뒤
          송금 완료로 표시해요.
        </p>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">주문</th>
              <th scope="col">활동</th>
              <th scope="col">환불액</th>
              <th scope="col">사유</th>
              <th scope="col">상태</th>
              <th scope="col">처리</th>
            </tr>
          </thead>
          <tbody>
            {(refunds ?? []).map((r) => (
              <tr key={r.id}>
                <td className={styles.nowrap}>
                  {r.order?.order_no}
                  <br />
                  <small className={styles.muted}>
                    {r.order?.buyer?.nickname} ·{" "}
                    {r.order ? ORDER_STATUS_LABELS[r.order.status] : ""}
                  </small>
                </td>
                <td>{r.order?.activity?.title}</td>
                <td className={styles.nowrap}>
                  {won(r.amount)} ({r.rate}%)
                </td>
                <td>{r.reason || "-"}</td>
                <td>
                  <Badge status={r.status} label={REFUND_STATUS_LABELS[r.status]} />
                </td>
                <td>
                  {r.status === "requested" ? (
                    <div className={styles.inlineForms}>
                      {[true, false].map((approve) => (
                        <form key={String(approve)} action={decideRefund}>
                          <ReturnTo path={PATH} />
                          <input type="hidden" name="refundId" value={r.id} />
                          <input type="hidden" name="approve" value={String(approve)} />
                          <button
                            type="submit"
                            className={approve ? styles.smallPrimary : styles.smallGhost}
                          >
                            {approve ? "승인" : "거절"}
                          </button>
                        </form>
                      ))}
                    </div>
                  ) : (
                    <form action={markRefundPaid}>
                      <ReturnTo path={PATH} />
                      <input type="hidden" name="refundId" value={r.id} />
                      <button type="submit" className={styles.smallGhost}>
                        송금 완료
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

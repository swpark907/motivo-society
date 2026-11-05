import { ORDER_STATUS_LABELS, won } from "@/lib/platform/messages";
import { createSessionClient } from "@/lib/platform/supabase-server";
import { createSettlement, markSettlementPaid } from "../actions";
import { getViewer } from "../_data";
import { Badge, Notice, ReturnTo, type SearchParams } from "../_ui";
import styles from "../sandbox.module.scss";

const PATH = "/demo/platform/settlements";

function seoulDate(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d);
}

export default async function SettlementsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createSessionClient();
  const viewer = await getViewer();
  const { data: isCommerce } = await supabase.rpc("has_platform_permission", {
    p_permission: "commerce",
  });

  const [{ data: settlements }, { data: orders }, { data: settings }] = await Promise.all([
    supabase
      .from("settlements")
      .select(
        "id, period_start, period_end, gross_amount, refund_amount, fee_amount, payout_amount, status, paid_at, payee:profiles!settlements_payee_user_id_fkey(nickname), settlement_items(id, amount, fee_amount, order:orders(order_no), refund:refunds(id, order:orders(order_no)))",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select(
        "id, order_no, amount, fee_rate, status, confirmed_at, payee_user_id, payee:profiles!orders_payee_user_id_fkey(nickname), activity:activities(title), settlement_items(id)",
      )
      .not("payee_user_id", "is", null)
      .in("status", ["paid", "refunded", "partially_refunded"])
      .order("confirmed_at", { ascending: false }),
    supabase.from("platform_settings").select("fee_rate").maybeSingle(),
  ]);

  // 거래 권한 운영진은 모든 정산 대상, 호스트는 자기 것만 본다(RLS가 거른다).
  const visibleOrders = (orders ?? []).filter((o) => isCommerce || o.payee_user_id === viewer?.id);
  const payees = new Map<string, string>();
  for (const o of visibleOrders) {
    if (o.payee_user_id) payees.set(o.payee_user_id, o.payee?.nickname ?? "");
  }
  const todayStr = seoulDate(new Date());
  const monthStart = `${todayStr.slice(0, 8)}01`;

  return (
    <>
      <Notice searchParams={searchParams} />
      <h1 className={styles.title}>정산</h1>
      <p className={styles.muted}>
        호스트 주최 유료 활동의 결제 완료 주문은 매출(+), 처리된 환불은 차감(−)으로 정산에 한 번씩만
        들어가요. 지급 뒤에 생긴 환불은 다음 정산에서 빠져요. 수수료율{" "}
        {settings ? `${Math.round(Number(settings.fee_rate) * 100)}%` : "-"}는 대표 승인 전
        시험값이에요.
      </p>
      {!isCommerce && !viewer && (
        <p className={styles.muted}>호스트나 소유자로 바꾸면 정산이 보여요.</p>
      )}

      {isCommerce && (
        <section className={styles.panel} aria-labelledby="create-heading">
          <h2 id="create-heading" className={styles.panelTitle}>
            정산 만들기
          </h2>
          {payees.size === 0 && <p className={styles.muted}>정산 대상 호스트가 없어요.</p>}
          {[...payees].map(([payeeId, nickname]) => (
            <form key={payeeId} action={createSettlement} className={styles.row}>
              <ReturnTo path={PATH} />
              <input type="hidden" name="payeeId" value={payeeId} />
              <strong>{nickname}</strong>
              <label className={styles.field}>
                <span>시작일</span>
                <input type="date" name="start" defaultValue={monthStart} />
              </label>
              <label className={styles.field}>
                <span>종료일</span>
                <input type="date" name="end" defaultValue={todayStr} />
              </label>
              <button type="submit" className={styles.primaryButton}>
                이 기간 정산 만들기
              </button>
            </form>
          ))}
        </section>
      )}

      <section className={styles.panel} aria-labelledby="list-heading">
        <h2 id="list-heading" className={styles.panelTitle}>
          정산 내역
        </h2>
        {(settlements ?? []).length === 0 ? (
          <p className={styles.muted}>아직 만든 정산이 없어요.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">호스트</th>
                <th scope="col">기간</th>
                <th scope="col">매출</th>
                <th scope="col">환불 차감</th>
                <th scope="col">수수료</th>
                <th scope="col">지급액</th>
                <th scope="col">상태</th>
              </tr>
            </thead>
            <tbody>
              {(settlements ?? []).map((s) => (
                <tr key={s.id}>
                  <td>{s.payee?.nickname}</td>
                  <td className={styles.nowrap}>
                    {s.period_start} ~ {s.period_end}
                    <br />
                    <small className={styles.muted}>
                      {s.settlement_items
                        .map((i) =>
                          i.order
                            ? `+${i.order.order_no}`
                            : `−환불(${i.refund?.order?.order_no ?? ""})`,
                        )
                        .join(", ")}
                    </small>
                  </td>
                  <td className={styles.nowrap}>{won(s.gross_amount)}</td>
                  <td className={styles.nowrap}>{won(s.refund_amount)}</td>
                  <td className={styles.nowrap}>{won(s.fee_amount)}</td>
                  <td className={styles.nowrap}>
                    <strong>{won(s.payout_amount)}</strong>
                  </td>
                  <td>
                    {s.status === "paid" ? (
                      "지급 완료"
                    ) : isCommerce ? (
                      <form action={markSettlementPaid}>
                        <ReturnTo path={PATH} />
                        <input type="hidden" name="settlementId" value={s.id} />
                        <button type="submit" className={styles.smallPrimary}>
                          지급 완료
                        </button>
                      </form>
                    ) : (
                      "지급 예정"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.panel} aria-labelledby="orders-heading">
        <h2 id="orders-heading" className={styles.panelTitle}>
          정산 대상 주문
        </h2>
        {visibleOrders.length === 0 ? (
          <p className={styles.muted}>보이는 주문이 없어요.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">주문</th>
                <th scope="col">호스트</th>
                <th scope="col">활동</th>
                <th scope="col">금액</th>
                <th scope="col">수수료율</th>
                <th scope="col">상태</th>
                <th scope="col">정산</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((o) => (
                <tr key={o.id}>
                  <td className={styles.nowrap}>{o.order_no}</td>
                  <td>{o.payee?.nickname}</td>
                  <td>{o.activity?.title}</td>
                  <td className={styles.nowrap}>{won(o.amount)}</td>
                  <td>{o.fee_rate !== null ? `${Math.round(Number(o.fee_rate) * 100)}%` : "-"}</td>
                  <td>
                    <Badge status={o.status} label={ORDER_STATUS_LABELS[o.status]} />
                  </td>
                  <td>
                    <Badge
                      status={o.settlement_items ? "completed" : "pending"}
                      label={o.settlement_items ? "포함됨" : "미정산"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

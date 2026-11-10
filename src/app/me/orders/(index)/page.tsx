import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { KindTag } from "@/components/KindTag/KindTag";
import { LineIcon } from "@/components/LineIcon/LineIcon";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { timeLeftText } from "@/lib/platform/activity-time";
import { won } from "@/lib/platform/messages";
import { STAGE_LABELS, stageTone } from "@/lib/platform/order-view";
import { listMyOrders, type MyOrder } from "@/lib/platform/orders";
import { requireUser } from "@/lib/platform/session";
import s from "../orders.module.scss";

export const metadata: Metadata = {
  title: "주문과 환불",
  description: "입금 안내, 결제 내역, 환불 요청.",
  robots: { index: false },
};

const DAY = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function OrdersPage() {
  const user = await requireUser("/me/orders");
  const orders = await listMyOrders(user.id);
  const now = new Date();

  return (
    <PlatformPage
      label="ORDERS"
      title="주문과 환불"
      lead="유료 활동에 신청하면 주문이 생겨요. 입금 안내와 환불 요청도 여기서 해요."
    >
      {orders.length ? (
        <ul className={s.list}>
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/me/orders/${o.no}`} className={s.row}>
                <span className={s.rowMain}>
                  <span className={s.rowTags}>
                    {o.kind && <KindTag kind={o.kind} />}
                    <StatusBadge status={stageTone(o.stage)} label={STAGE_LABELS[o.stage]} />
                  </span>
                  <strong>{o.title}</strong>
                  <small>
                    {DAY.format(new Date(o.createdAt))} · {o.no}
                  </small>
                  {nextLine(o, now) && <span className={s.next}>{nextLine(o, now)}</span>}
                </span>
                <span className={s.rowAmount}>
                  {won(o.amount)}
                  <LineIcon name="arrow" size={16} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="주문이 없어요"
          body="유료 모임·시즌·챌린지에 신청하면 여기에 주문이 생겨요."
          action={{ href: "/explore", label: "둘러보기에서 찾아보기" }}
        />
      )}
    </PlatformPage>
  );
}

/** 목록에서 다음에 할 일이나 진행 상황을 한 줄로. */
function nextLine(o: MyOrder, now: Date): string | null {
  if (o.stage === "pending") {
    const left = timeLeftText(new Date(o.dueAt), now);
    return left ? `입금 기한 ${left}` : "입금 기한이 지났어요";
  }
  if (o.refund && o.stage.startsWith("refund_")) {
    return `환불 ${won(o.refund.amount)}`;
  }
  return null;
}

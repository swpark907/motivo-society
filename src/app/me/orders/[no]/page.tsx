import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { accountNumber, refundText } from "@/lib/platform/activity-text";
import { clockTime, shortDate } from "@/lib/platform/activity-time";
import { won } from "@/lib/platform/messages";
import {
  STAGE_LABELS,
  canRequestRefund,
  quoteText,
  stageTone,
  type OrderStage,
} from "@/lib/platform/order-view";
import { getMyOrder, type OrderDetail } from "@/lib/platform/orders";
import { requireUser } from "@/lib/platform/session";
import { PaymentGuide } from "../../../activities/[slug]/apply/PaymentGuide";
import s from "../orders.module.scss";
import { RefundForm } from "./RefundForm";

export const metadata: Metadata = { title: "주문 상세", robots: { index: false } };

// 다른 플랫폼 화면과 같은 꼴: "11.15 (일) · 오후 4:08"(검수 U10 — 화면마다 같은 날짜 형식).
const at = (iso: string | null) =>
  iso ? `${shortDate(new Date(iso))} · ${clockTime(new Date(iso))}` : null;

export default async function OrderPage({ params, searchParams }: PageProps<"/me/orders/[no]">) {
  const { no } = await params;
  const user = await requireUser(`/me/orders/${encodeURIComponent(no)}`);
  const order = await getMyOrder(user.id, no);
  if (!order) notFound();
  const notice = (await searchParams).notice === "refund_requested";

  return (
    <main data-platform className={`paper ${s.page}`}>
      <div className={s.narrow}>
        <nav className={s.crumbs} aria-label="위치">
          <Link href="/me">나</Link>
          <span aria-hidden="true">/</span>
          <Link href="/me/orders">주문과 환불</Link>
        </nav>

        {notice && (
          <p className={s.notice} role="status">
            환불을 요청했어요. 운영진이 확인하면 여기에서 상태가 바뀌어요.
          </p>
        )}

        <header className={s.head}>
          <p className="label">ORDER · {order.no}</p>
          <h1 className={s.title}>{order.title}</h1>
          <StatusBadge status={stageTone(order.stage)} label={STAGE_LABELS[order.stage]} />
        </header>

        <dl className={s.facts}>
          <div>
            <dt>금액</dt>
            <dd>{won(order.amount)}</dd>
          </div>
          <div>
            <dt>입금자명</dt>
            <dd>{order.depositor}</dd>
          </div>
          <div>
            <dt>주문한 때</dt>
            <dd>{at(order.createdAt)}</dd>
          </div>
          {order.confirmedAt && (
            <div>
              <dt>입금 확인</dt>
              <dd>{at(order.confirmedAt)}</dd>
            </div>
          )}
          {order.slug && (
            <div>
              <dt>활동</dt>
              <dd>
                <Link href={`/activities/${order.slug}`}>{order.title}</Link>
                {order.startsAt && <small> · {at(order.startsAt)} 시작</small>}
              </dd>
            </div>
          )}
        </dl>

        <StageSection order={order} />
      </div>
    </main>
  );
}

function StageSection({ order }: { order: OrderDetail }) {
  const stage = order.stage;
  if (stage === "pending") {
    return (
      <section className={s.card} aria-labelledby="stage-h">
        <h2 id="stage-h">입금 안내</h2>
        {order.bankNote ? (
          <PaymentGuide
            amount={won(order.amount)}
            bankNote={order.bankNote}
            account={accountNumber(order.bankNote)}
            depositor={order.depositor}
            dueAt={order.dueAt}
            dueLabel={at(order.dueAt) ?? ""}
            orderNo={order.no}
            renderedAt={new Date().toISOString()}
          />
        ) : (
          <p className={s.muted}>입금 계좌를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>
        )}
        {order.slug && (
          <p className={s.muted}>
            입금 전 취소는 <Link href={`/activities/${order.slug}/apply`}>신청 내역</Link>에서 해요.
          </p>
        )}
      </section>
    );
  }
  if (stage === "expired" || stage === "cancelled") {
    return (
      <section className={s.card} aria-labelledby="stage-h">
        <h2 id="stage-h">
          {stage === "expired" ? "입금 기한이 지났어요" : "입금 전에 취소했어요"}
        </h2>
        <p className={s.muted}>
          {stage === "expired"
            ? "기한 안에 입금이 확인되지 않아 자리가 풀렸어요. 돈은 오가지 않았어요."
            : "돈은 오가지 않았어요."}
        </p>
        {order.slug && (
          <Link href={`/activities/${order.slug}`} className={s.ghost}>
            활동 다시 보기
          </Link>
        )}
      </section>
    );
  }
  if (stage === "paid") {
    const rejected = order.refund?.status === "rejected" ? order.refund : null;
    return (
      <section className={s.card} aria-labelledby="stage-h">
        <h2 id="stage-h">환불 요청</h2>
        {rejected && (
          <p className={s.rejected}>
            지난 환불 요청은 거절됐어요{rejected.note ? `: ${rejected.note}` : "."}
          </p>
        )}
        {order.quote ? (
          <>
            <p className={s.quote}>{quoteText(order.quote.amount, order.quote.rate)}</p>
            <p className={s.muted}>
              {order.quote.daysBefore >= 0
                ? `활동 시작까지 ${order.quote.daysBefore}일 남았어요.`
                : "활동이 이미 시작했어요."}
              {order.rules && ` 규정: ${refundText(order.rules)}.`}
              {order.rules && process.env.NODE_ENV === "development" && " (시험값 · 대표 승인 전)"}
            </p>
            <p className={s.muted}>금액은 요청하는 순간의 규정으로 다시 계산돼요.</p>
          </>
        ) : (
          <p className={s.muted}>환불 금액을 계산하지 못했어요. 잠시 뒤 다시 열어 주세요.</p>
        )}
        {canRequestRefund(stage, order.quote?.amount ?? null) && (
          <RefundForm orderId={order.id} orderNo={order.no} />
        )}
      </section>
    );
  }
  return <RefundProgress order={order} stage={stage} />;
}

/** 요청 → 승인 → 송금 완료. 지금 단계까지 진하게. */
function RefundProgress({ order, stage }: { order: OrderDetail; stage: OrderStage }) {
  const r = order.refund!;
  const done = { refund_requested: 1, refund_approved: 2, refund_paid: 3 }[
    stage as "refund_requested" | "refund_approved" | "refund_paid"
  ];
  const steps = [
    {
      title: "환불을 요청했어요",
      body: `${won(r.amount)} (${r.rate}%)${r.reason ? ` · 사유: ${r.reason}` : ""}`,
      when: at(r.requestedAt),
    },
    {
      title: "운영진이 승인했어요",
      body: "참가는 취소됐고, 자리는 다음 대기자에게 넘어가요.",
      when: at(r.processedAt),
    },
    {
      title: "돈을 보냈어요",
      body: "송금을 마쳤어요.",
      when: at(r.paidAt),
    },
  ];
  return (
    <section className={s.card} aria-labelledby="stage-h">
      <h2 id="stage-h">환불 진행</h2>
      <ol className={s.steps}>
        {steps.map((step, i) => (
          <li key={step.title} data-done={i < done || undefined}>
            <span className={s.stepDot} aria-hidden="true">
              {i + 1}
            </span>
            <div>
              <strong>{i < done ? step.title : stepWaiting(i)}</strong>
              {i < done && <p>{step.body}</p>}
              {i < done && step.when && <small>{step.when}</small>}
            </div>
          </li>
        ))}
      </ol>
      {stage !== "refund_paid" && (
        <p className={s.muted}>
          송금은 운영진이 처리해요. 끝나면 여기 상태가 &ldquo;환불 완료&rdquo;로 바뀌어요.
        </p>
      )}
    </section>
  );
}

function stepWaiting(i: number): string {
  return i === 1 ? "운영진 확인을 기다려요" : "송금을 기다려요";
}

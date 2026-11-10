import type { Metadata } from "next";
import Image from "next/image";
import { isRemoteImage } from "@/lib/platform/media";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { KindTag } from "@/components/KindTag/KindTag";
import { getActivityDetail, type ActivityDetail } from "@/lib/platform/activity-detail";
import { accountNumber, refundText, sessionWhen } from "@/lib/platform/activity-text";
import { clockTime, gatheringWhen, periodWhen, shortDate } from "@/lib/platform/activity-time";
import { getMyApplication, type MyApplication } from "@/lib/platform/apply";
import { applyState } from "@/lib/platform/apply-state";
import { errorMessage, won } from "@/lib/platform/messages";
import { requireUser } from "@/lib/platform/session";
import { cancelApplication } from "./actions";
import { ApplyForm } from "./ApplyForm";
import { PaymentGuide } from "./PaymentGuide";
import s from "./apply.module.scss";
import { SubmitButton } from "@/components/SubmitButton/SubmitButton";

export const metadata: Metadata = { title: "신청", robots: { index: false } };

// 다른 플랫폼 화면과 같은 꼴: "11.11 (수) · 오후 4:16"(검수 U10).
const due = (at: Date) => `${shortDate(at)} · ${clockTime(at)}`;

/**
 * 신청 확인 → 결과. 같은 주소가 신청 전에는 확인 단계, 신청 뒤에는 내 신청 내역(입금 안내 포함)을 보여 준다.
 * 비로그인·온보딩 전이면 로그인 → 온보딩 → 이 주소로 돌아와 이어서 신청한다.
 */
export default async function ApplyPage({
  params,
  searchParams,
}: PageProps<"/activities/[slug]/apply">) {
  const { slug } = await params;
  const query = await searchParams;
  const user = await requireUser(`/activities/${slug}/apply`);
  const result = await getActivityDetail(slug);
  if (!result.found) {
    if (result.seriesSlug) redirect(`/activities/${result.seriesSlug}/apply`);
    notFound();
  }
  const a = result.activity;
  const mine = await getMyApplication(a.id);
  const error = typeof query.error === "string" ? errorMessage(query.error) : null;

  return (
    <main data-platform className={`paper ${s.page}`}>
      <div className={s.inner}>
        <Link href={`/activities/${a.slug}`} className={s.back}>
          ← 활동으로 돌아가기
        </Link>
        <Summary a={a} />
        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}
        {mine ? <Result a={a} mine={mine} /> : <Confirm a={a} nickname={user.nickname ?? ""} />}
      </div>
    </main>
  );
}

function Summary({ a }: { a: ActivityDetail }) {
  const when = !a.startsAt
    ? "일정 미정"
    : a.kind === "challenge"
      ? periodWhen(new Date(a.startsAt), a.endsAt ? new Date(a.endsAt) : null)
      : a.kind === "series"
        ? `${sessionWhen(a.startsAt)} 시작 · ${a.sessions.length}회`
        : gatheringWhen(new Date(a.startsAt), new Date());
  const place = a.place?.online ? "온라인" : (a.place?.area ?? "");
  return (
    <section className={s.summary} aria-label="신청할 활동">
      <div className={s.thumb} data-kind={a.kind}>
        {a.cover && (
          <Image src={a.cover} unoptimized={isRemoteImage(a.cover)} alt="" fill sizes="96px" />
        )}
      </div>
      <div>
        <KindTag kind={a.kind} />
        <p className={s.summaryTitle}>{a.title}</p>
        <p className={s.summaryMeta}>
          {[when, place, a.organizer.name].filter(Boolean).join(" · ")}
        </p>
      </div>
    </section>
  );
}

function Confirm({ a, nickname }: { a: ActivityDetail; nickname: string }) {
  const state = applyState(
    {
      status: a.status,
      allowLateJoin: a.allowLateJoin,
      applyOpensAt: a.applyOpensAt,
      applyClosesAt: a.applyClosesAt,
      capacity: a.capacity,
      taken: a.taken,
      price: a.price,
      audience: a.audience,
      signedIn: true,
      isManager: a.viewer.isManager,
      isClubMember: a.viewer.isClubMember,
      hasEntitlement: a.viewer.hasEntitlement,
      mine: null,
    },
    new Date(),
  );
  if (state.kind !== "apply") {
    return (
      <section className={s.card}>
        <h1 className={s.title}>{state.label}</h1>
        <p className={s.lead}>{state.note}</p>
        <Link href="/explore" className={s.ghost}>
          다른 활동 둘러보기
        </Link>
      </section>
    );
  }

  const paid = a.price > 0;
  const approval = a.joinMode === "approval";
  const waitlist = state.waitlist;
  const payNow = paid && !approval && !waitlist;
  const isDev = process.env.NODE_ENV === "development";
  const steps = [
    waitlist
      ? "정원이 찼어요. 대기로 신청하면 자리가 날 때 먼저 신청한 순서대로 확정돼요."
      : approval
        ? "신청하면 여는 사람이 확인한 뒤 알려 드려요."
        : paid
          ? "신청하면 자리가 잡혀요."
          : "신청하면 바로 참가가 확정돼요.",
    paid &&
      (payNow
        ? "안내된 기한 안에 계좌로 입금하면 운영진이 확인한 뒤 확정돼요. 기한이 지나면 자리가 풀려요."
        : "확정 단계에서 입금 안내를 드려요."),
  ].filter(Boolean) as string[];

  return (
    <section className={s.card} aria-labelledby="confirm-h">
      <p className="label">STEP 1 · 신청 확인</p>
      <h1 id="confirm-h" className={s.title}>
        이렇게 신청할게요
      </h1>
      <dl className={s.facts}>
        <div>
          <dt>비용</dt>
          <dd>
            <strong>{paid ? won(a.price) : "무료"}</strong>
            {a.kind === "series" && paid && " (시즌 전체)"}
          </dd>
        </div>
        <div>
          <dt>진행</dt>
          <dd>
            <ul className={s.steps}>
              {steps.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>취소</dt>
          <dd>
            {paid && a.refundRules ? (
              <>
                입금 전에는 언제든 취소할 수 있어요. 입금한 뒤에는 환불 요청으로 진행해요:{" "}
                {refundText(a.refundRules)}
                {isDev && <span className={s.devNote}> (시험값 · 대표 승인 전)</span>}
              </>
            ) : (
              "시작 전까지 언제든 취소할 수 있어요."
            )}
          </dd>
        </div>
      </dl>
      <ApplyForm
        activityId={a.id}
        slug={a.slug}
        submitLabel={paid && !waitlist ? `${won(a.price)} · ${state.label}` : state.label}
        askDepositor={payNow}
        defaultDepositor={nickname}
        needsAgree={paid}
      />
    </section>
  );
}

const RESULT_COPY: Record<MyApplication["status"], { title: string; lead: string }> = {
  confirmed: {
    title: "참가가 확정됐어요",
    lead: "참가 정보(장소·화상 링크)는 활동 화면에서 볼 수 있어요.",
  },
  waitlisted: {
    title: "대기 신청했어요",
    lead: "자리가 나면 먼저 신청한 순서대로 확정되고, 이 화면에 바로 반영돼요.",
  },
  pending_approval: {
    title: "신청했어요",
    lead: "여는 사람이 확인하면 확정돼요. 유료 활동이면 그때 입금 안내가 나와요.",
  },
  pending_payment: {
    title: "입금하면 확정돼요",
    lead: "아래 계좌로 입금해 주세요. 운영진이 입금을 확인하면 참가가 확정돼요.",
  },
};

function Result({ a, mine }: { a: ActivityDetail; mine: MyApplication }) {
  const copy = RESULT_COPY[mine.status];
  const isDev = process.env.NODE_ENV === "development";
  const canCancel =
    a.status !== "ended" && a.status !== "cancelled" && mine.order?.status !== "paid";

  return (
    <section className={s.card} aria-labelledby="result-h">
      <p className="label">
        {mine.status === "pending_payment" ? "STEP 2 · 입금 안내" : "신청 내역"}
      </p>
      <h1 id="result-h" className={s.title} data-status={mine.status}>
        {copy.title}
      </h1>
      <p className={s.lead}>
        {mine.status === "confirmed" && a.kind === "challenge"
          ? "미션과 오늘 인증은 활동 화면의 '내 챌린지'에서 올려요."
          : copy.lead}
      </p>
      {mine.status === "waitlisted" && <p className={s.muted}>지금 대기 {mine.waitlisted}명</p>}

      {mine.status === "pending_payment" && mine.order && mine.bankNote && (
        <>
          <PaymentGuide
            amount={won(mine.order.amount)}
            bankNote={mine.bankNote}
            account={accountNumber(mine.bankNote)}
            depositor={mine.order.depositor}
            dueAt={mine.order.dueAt}
            dueLabel={due(new Date(mine.order.dueAt))}
            orderNo={mine.order.no}
            renderedAt={new Date().toISOString()}
          />
          {isDev && (
            <p className={s.devBox}>
              개발용: 시험 계좌라 실제로 입금하지 마세요. 입금 확인은{" "}
              <Link href="/demo/platform/ops">시험장 운영 화면</Link>에서 모쏘운영으로 해요.
            </p>
          )}
        </>
      )}

      <div className={s.actions}>
        <Link
          href={`/activities/${a.slug}`}
          className={mine.status === "confirmed" ? s.cta : s.ghost}
        >
          활동 화면으로
        </Link>
        {mine.order && mine.order.status !== "pending" && (
          <Link href={`/me/orders/${mine.order.no}`} className={s.ghost}>
            {mine.order.status === "paid" ? "주문 보기 · 환불 요청" : "주문 보기"}
          </Link>
        )}
        {canCancel && (
          <details className={s.cancel}>
            <summary>{mine.status === "pending_payment" ? "입금 전 취소" : "신청 취소"}</summary>
            <form action={cancelApplication}>
              <input type="hidden" name="activityId" value={a.id} />
              <input type="hidden" name="slug" value={a.slug} />
              <p>
                {mine.status === "confirmed" || mine.status === "pending_payment"
                  ? "취소하면 자리가 다음 대기자에게 넘어가요."
                  : "취소하면 신청 기록이 없어져요."}{" "}
                다시 신청할 수 있어요.
              </p>
              <SubmitButton className={s.danger} pendingLabel="취소하는 중…">
                정말 취소할게요
              </SubmitButton>
            </form>
          </details>
        )}
      </div>
    </section>
  );
}

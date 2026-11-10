import Link from "next/link";
import type { ApplyState } from "@/lib/platform/apply-state";
import { ShareButton } from "./ShareButton";
import s from "./activity.module.scss";

type Props = {
  state: ApplyState;
  /** 신청 확인·내 신청 내역 주소(/activities/[slug]/apply). */
  applyHref: string;
  price: string;
  priceSub: string;
  capacity: number | null;
  taken: number;
  title: string;
  /** 챌린지 확정 참가자: 같은 화면의 참여 영역으로 보내는 링크와 그 이름. */
  room?: { href: string; label: string };
};

/**
 * 신청 영역. 넓은 화면은 오른쪽에 붙는 카드, 좁은 화면은 하단 탭 바 위 고정 바.
 * 버튼은 신청 확인(/apply)으로, 이미 신청했으면 내 신청 내역(같은 주소)으로 간다.
 */
export function ApplyPanel({
  state,
  applyHref,
  price,
  priceSub,
  capacity,
  taken,
  title,
  room,
}: Props) {
  const inRoom = room && state.kind === "mine" && state.status === "confirmed";
  const note = inRoom ? "참가 확정 · 인증은 아래 '내 챌린지'에서" : state.note;
  const action = inRoom ? (
    <a href={room.href} className={s.statusPill} data-kind="mine">
      {room.label}
    </a>
  ) : (
    <Action state={state} applyHref={applyHref} />
  );
  return (
    <>
      <aside className={s.side} aria-label="신청">
        <div className={s.applyCard}>
          <p className={s.applyPrice}>
            {price}
            <small> · {priceSub}</small>
          </p>
          {capacity !== null && (
            <div className={s.meterWrap}>
              {/* 막대만으로는 무엇의 비율인지 모른다 — 숫자를 함께 쓴다(색만으로 전하지 않기). */}
              <div className={s.meter} aria-hidden="true">
                <span style={{ width: `${Math.min(100, (taken / capacity) * 100)}%` }} />
              </div>
              <small className={s.meterText}>
                정원 {capacity}명 중 {taken}명
              </small>
            </div>
          )}
          <p className={s.applyNote} data-state-kind={state.kind}>
            {note}
          </p>
          {action}
          <div className={s.applyActions}>
            <ShareButton title={title} />
          </div>
        </div>
      </aside>

      {/* 좁은 화면의 신청 영역. 넓은 화면 카드와 화면 크기로 하나만 보이므로 같은 이름을 쓴다
          (스크린 리더가 모바일에서도 "신청" 영역으로 찾는다 — 검수 F-023). */}
      <aside className={s.mobileBar} aria-label="신청">
        <span>
          <strong>{price}</strong>
          {/* 좁은 바에는 짧게: 신청 전이면 종류, 대상이 정해졌으면 누가 신청할 수 있는지(검수 F-022). */}
          <small>
            {state.kind === "login"
              ? (state.who ?? priceSub)
              : state.kind === "apply"
                ? priceSub
                : note}
          </small>
        </span>
        {action}
      </aside>
    </>
  );
}

function Action({ state, applyHref }: { state: ApplyState; applyHref: string }) {
  if (state.kind === "login") {
    // 로그인 → (처음이면 온보딩) → 신청 확인으로 이어진다.
    return (
      <Link href={`/login?next=${encodeURIComponent(applyHref)}`} className={s.cta}>
        {state.label}
      </Link>
    );
  }
  if (state.kind === "apply") {
    return (
      <Link href={applyHref} className={s.cta}>
        {state.label}
      </Link>
    );
  }
  if (state.kind === "mine") {
    if (state.status === "pending_payment") {
      return (
        <Link href={applyHref} className={s.cta}>
          입금 안내 보기
        </Link>
      );
    }
    return (
      <Link
        href={applyHref}
        className={s.statusPill}
        data-kind="mine"
        aria-label={`${state.label} · 신청 내역 보기`}
      >
        {state.label}
      </Link>
    );
  }
  return (
    <p className={s.statusPill} data-kind={state.kind} role="status">
      {state.label}
    </p>
  );
}

import Link from "next/link";
import type { ApplyState } from "@/lib/platform/apply-state";
import { ShareButton } from "./ShareButton";
import s from "./activity.module.scss";

type Props = {
  state: ApplyState;
  loginHref: string;
  price: string;
  priceSub: string;
  capacity: number | null;
  taken: number;
  title: string;
};

/**
 * 신청 영역. 넓은 화면은 오른쪽에 붙는 카드, 좁은 화면은 하단 탭 바 위 고정 바.
 * 실제 신청(확인 단계·입금 안내)은 백로그 L06에서 붙인다. 그 전에는 누를 수 없음을 숨기지 않는다.
 */
export function ApplyPanel({ state, loginHref, price, priceSub, capacity, taken, title }: Props) {
  const action = <Action state={state} loginHref={loginHref} />;
  return (
    <>
      <aside className={s.side} aria-label="신청">
        <div className={s.applyCard}>
          <p className={s.applyPrice}>
            {price}
            <small> · {priceSub}</small>
          </p>
          {capacity !== null && (
            <div
              className={s.meter}
              role="img"
              aria-label={`정원 ${capacity}명 중 ${taken}명 참여`}
            >
              <span style={{ width: `${Math.min(100, (taken / capacity) * 100)}%` }} />
            </div>
          )}
          <p className={s.applyNote} data-state-kind={state.kind}>
            {state.note}
          </p>
          {action}
          <div className={s.applyActions}>
            <ShareButton title={title} />
          </div>
        </div>
      </aside>

      <div className={s.mobileBar}>
        <span>
          <strong>{price}</strong>
          <small>{state.kind === "apply" || state.kind === "login" ? priceSub : state.note}</small>
        </span>
        {action}
      </div>
    </>
  );
}

function Action({ state, loginHref }: { state: ApplyState; loginHref: string }) {
  if (state.kind === "login") {
    return (
      <Link href={loginHref} className={s.cta}>
        {state.label}
      </Link>
    );
  }
  if (state.kind === "apply") {
    return (
      <button type="button" className={s.cta} disabled title="신청 기능을 준비하고 있어요">
        {state.label}
        <span className={s.ctaSoon}>준비 중</span>
      </button>
    );
  }
  return (
    <p className={s.statusPill} data-kind={state.kind} role="status">
      {state.label}
    </p>
  );
}

"use client";

// 클라이언트 컴포넌트인 이유: 요청 중 버튼 상태와 오류(useActionState), "결과를 확인했어요" 체크에 따라 버튼을 연다.
import { useActionState, useState } from "react";
import { submitRefund, type RefundFormState } from "./actions";
import s from "../orders.module.scss";

export function RefundForm({ orderId, orderNo }: { orderId: string; orderNo: string }) {
  const [state, action, pending] = useActionState<RefundFormState, FormData>(submitRefund, {
    error: null,
  });
  const [agreed, setAgreed] = useState(false);

  return (
    <form action={action} className={s.form}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="orderNo" value={orderNo} />
      <div className={s.field}>
        <label htmlFor="refund-reason">사유 (선택)</label>
        <textarea
          id="refund-reason"
          name="reason"
          rows={3}
          maxLength={500}
          placeholder="여는 사람과 운영진이 참고해요. 적지 않아도 돼요."
        />
      </div>
      <label className={s.agree}>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        승인되면 참가가 취소되고 되돌릴 수 없어요
      </label>
      {state.error && (
        <p className={s.error} role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className={s.danger} disabled={!agreed || pending}>
        {pending ? "요청하는 중…" : "환불 요청하기"}
      </button>
    </form>
  );
}

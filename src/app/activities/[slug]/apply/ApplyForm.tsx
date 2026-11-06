"use client";

// 클라이언트 컴포넌트인 이유: 신청 중 버튼 상태(useActionState)와 규정 확인 체크에 따라 버튼을 연다.
import { useActionState, useState } from "react";
import { submitApplication, type ApplyFormState } from "./actions";
import s from "./apply.module.scss";

type Props = {
  activityId: string;
  slug: string;
  submitLabel: string;
  askDepositor: boolean;
  defaultDepositor: string;
  needsAgree: boolean;
};

export function ApplyForm({
  activityId,
  slug,
  submitLabel,
  askDepositor,
  defaultDepositor,
  needsAgree,
}: Props) {
  const [state, action, pending] = useActionState<ApplyFormState, FormData>(submitApplication, {
    error: null,
  });
  const [agreed, setAgreed] = useState(!needsAgree);

  return (
    <form action={action} className={s.form}>
      <input type="hidden" name="activityId" value={activityId} />
      <input type="hidden" name="slug" value={slug} />
      {askDepositor && (
        <div className={s.field}>
          <label htmlFor="apply-depositor">입금자명</label>
          <input
            id="apply-depositor"
            name="depositor"
            defaultValue={defaultDepositor}
            maxLength={20}
            autoComplete="name"
            aria-describedby="apply-depositor-hint"
          />
          <p id="apply-depositor-hint" className={s.hint}>
            통장에 찍힐 이름이에요. 운영진이 이 이름으로 입금을 확인해요.
          </p>
        </div>
      )}
      {needsAgree && (
        <label className={s.agree}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          취소·환불 규정을 확인했어요
        </label>
      )}
      {state.error && (
        <p className={s.error} role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className={s.cta} disabled={pending || !agreed}>
        {pending ? "신청하는 중…" : submitLabel}
      </button>
    </form>
  );
}

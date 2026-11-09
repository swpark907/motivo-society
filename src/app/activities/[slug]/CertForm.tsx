"use client";

// 클라이언트 컴포넌트인 이유: 올리는 중 버튼 상태·오류(useActionState)와, 올린 인증을 "고치기"로 펼치는 상태.
import { useActionState, useState } from "react";
import { submitCert, type CertFormState } from "./actions";
import s from "./challenge.module.scss";

type Props = {
  activityId: string;
  slug: string;
  allowText: boolean;
  allowLink: boolean;
  current: { body: string | null; link: string | null } | null;
};

export function CertForm({ activityId, slug, allowText, allowLink, current }: Props) {
  const [state, action, pending] = useActionState<CertFormState, FormData>(submitCert, {
    error: null,
  });
  const [editing, setEditing] = useState(current === null);

  if (!editing && current) {
    return (
      <div className={s.myCert}>
        <p className={s.certDone}>오늘 인증을 올렸어요</p>
        {current.body && <p className={s.certBody}>{current.body}</p>}
        {current.link && (
          <a href={current.link} target="_blank" rel="noreferrer" className={s.certLink}>
            {current.link}
          </a>
        )}
        <button type="button" className={s.ghost} onClick={() => setEditing(true)}>
          고치기
        </button>
        <p className={s.hint}>오늘 자정(한국 시간)까지 고칠 수 있어요.</p>
      </div>
    );
  }

  return (
    <form action={action} className={s.form}>
      <input type="hidden" name="activityId" value={activityId} />
      <input type="hidden" name="slug" value={slug} />
      {allowText && (
        <div className={s.field}>
          <label htmlFor="cert-body">오늘 한 것</label>
          <textarea
            id="cert-body"
            name="body"
            rows={4}
            maxLength={1000}
            defaultValue={current?.body ?? ""}
            placeholder="무엇을 했고, 어떻게 했는지 한두 줄로 남겨요."
          />
        </div>
      )}
      {allowLink && (
        <div className={s.field}>
          <label htmlFor="cert-link">링크{allowText && " (선택)"}</label>
          <input
            id="cert-link"
            name="link"
            type="url"
            inputMode="url"
            defaultValue={current?.link ?? ""}
            placeholder="https://"
          />
        </div>
      )}
      {state.error && (
        <p className={s.error} role="alert">
          {state.error}
        </p>
      )}
      <div className={s.formActions}>
        <button type="submit" className={s.cta} disabled={pending}>
          {pending ? "올리는 중…" : current ? "고친 내용 올리기" : "인증 올리기"}
        </button>
        {current && (
          <button type="button" className={s.ghost} onClick={() => setEditing(false)}>
            그만두기
          </button>
        )}
      </div>
    </form>
  );
}

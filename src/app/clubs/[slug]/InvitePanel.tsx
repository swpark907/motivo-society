"use client";

// 클라이언트 컴포넌트인 이유: 만든 초대 링크를 바로 보여 주고(useActionState) 클립보드로 복사한다.
import { useActionState, useState } from "react";
import { inviteAction, type InviteState } from "./actions";
import s from "./club.module.scss";

export function InvitePanel({ clubId }: { clubId: string }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(inviteAction, {
    code: null,
    error: null,
  });
  const [copied, setCopied] = useState(false);
  const link =
    state.code && typeof window !== "undefined"
      ? `${window.location.origin}/invite/${state.code}`
      : state.code
        ? `/invite/${state.code}`
        : null;

  return (
    <div className={s.invite}>
      <form action={action}>
        <input type="hidden" name="clubId" value={clubId} />
        <button type="submit" className={s.ghost} disabled={pending}>
          {pending ? "만드는 중…" : state.code ? "새 초대 링크 만들기" : "초대 링크 만들기"}
        </button>
      </form>
      {state.error && (
        <p className={s.error} role="alert">
          {state.error}
        </p>
      )}
      {link && (
        <div className={s.inviteLink}>
          <code>{link}</code>
          <button
            type="button"
            className={s.ghost}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "복사했어요" : "복사"}
          </button>
        </div>
      )}
      <p className={s.hint}>
        링크는 7일 동안 쓸 수 있어요. 받은 사람은 승인 없이 바로 멤버가 돼요.
      </p>
    </div>
  );
}

"use client";

// 클라이언트 컴포넌트인 이유: 보낸 뒤 "메일을 보냈어요" 상태와 다시 보내기 대기 시간을 이 화면 안에서 보여 준다.
import { useActionState, useEffect, useState } from "react";
import { sendMagicLink, type MagicLinkState } from "./actions";
import s from "./login.module.scss";

const RESEND_WAIT_SECONDS = 60;

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<MagicLinkState, FormData>(sendMagicLink, {
    status: "idle",
  });
  const [editing, setEditing] = useState(false);
  const sentAt = state.status === "sent" ? state.sentAt : null;
  const left = useCountdown(sentAt, RESEND_WAIT_SECONDS);

  if (state.status === "sent" && !editing) {
    return (
      <div className={s.sent} aria-live="polite">
        <h2>메일을 보냈어요</h2>
        <p>
          <strong>{state.email}</strong>로 보낸 메일의 로그인 버튼을 눌러 주세요. 링크는 이
          브라우저에서 열어야 하고, 1시간 동안 쓸 수 있어요.
        </p>
        <p className={s.muted}>메일이 안 보이면 스팸함도 확인해 주세요.</p>
        <div className={s.row}>
          <form action={action}>
            <input type="hidden" name="email" value={state.email} />
            <input type="hidden" name="next" value={next} />
            <button type="submit" className={s.ghost} disabled={pending || left > 0}>
              {pending ? "보내는 중…" : left > 0 ? `다시 보내기 (${left}초)` : "다시 보내기"}
            </button>
          </form>
          <button type="button" className={s.textButton} onClick={() => setEditing(true)}>
            다른 이메일로 받기
          </button>
        </div>
      </div>
    );
  }

  const defaultEmail = state.status === "idle" ? "" : state.email;
  return (
    <form
      action={(formData) => {
        setEditing(false);
        action(formData);
      }}
      className={s.form}
    >
      <input type="hidden" name="next" value={next} />
      <label htmlFor="login-email">이메일</label>
      <input
        id="login-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder="name@example.com"
        defaultValue={defaultEmail}
        aria-invalid={state.status === "error" || undefined}
        aria-describedby={state.status === "error" ? "login-error" : undefined}
      />
      {state.status === "error" && (
        <p id="login-error" className={s.fieldError} role="alert">
          {state.message}
        </p>
      )}
      <button type="submit" className={s.cta} disabled={pending}>
        {pending ? "보내는 중…" : "로그인 링크 받기"}
      </button>
    </form>
  );
}

/** 보낸 시각부터 남은 대기 초. 0이면 다시 보낼 수 있다. */
function useCountdown(since: number | null, seconds: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (since === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [since]);
  if (since === null) return 0;
  return Math.max(0, Math.ceil(seconds - (now - since) / 1000));
}

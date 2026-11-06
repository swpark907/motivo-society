"use client";

// 클라이언트 컴포넌트인 이유: 닉네임을 입력하는 동안 바로 확인하고, 관심사 개수를 세어 버튼을 연다.
import { useActionState, useEffect, useState } from "react";
import { errorMessage } from "@/lib/platform/messages";
import { INTERESTS_MAX, NICKNAME_MAX, type Interest } from "@/lib/platform/profile-limits";
import {
  checkNicknameAction,
  finishOnboarding,
  type NicknameStatus,
  type OnboardingState,
} from "./actions";
import s from "./onboarding.module.scss";

const CHECK_DELAY_MS = 350;

export function OnboardingForm({ interests, next }: { interests: Interest[]; next: string }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(finishOnboarding, {
    error: null,
    field: null,
  });
  const [nickname, setNickname] = useState("");
  const [checked, setChecked] = useState<NicknameStatus | null>(null);
  const [picked, setPicked] = useState<string[]>([]);

  const trimmed = nickname.trim();
  useEffect(() => {
    if (trimmed.length < 2) return;
    const id = window.setTimeout(() => {
      void checkNicknameAction(trimmed).then(setChecked);
    }, CHECK_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [trimmed]);

  // 지금 입력과 같은 이름을 확인한 결과만 쓴다(늦게 온 이전 결과는 무시).
  const status = trimmed.length < 2 ? null : checked?.name === trimmed ? checked.code : "checking";
  const nicknameOk = status === "ok";
  const countOk = picked.length >= 1 && picked.length <= INTERESTS_MAX;

  const nicknameHint =
    status === null
      ? "2~12자, 한글·영문·숫자·밑줄(_)"
      : status === "checking"
        ? "확인하는 중…"
        : status === "ok"
          ? "쓸 수 있는 닉네임이에요."
          : errorMessage(status);
  const serverNicknameError = state.field === "nickname" ? state.error : null;

  function toggle(id: string) {
    setPicked((now) =>
      now.includes(id)
        ? now.filter((x) => x !== id)
        : now.length >= INTERESTS_MAX
          ? now
          : [...now, id],
    );
  }

  return (
    <form action={action} className={s.form}>
      <input type="hidden" name="next" value={next} />

      <div className={s.field}>
        <label htmlFor="onboarding-nickname">닉네임</label>
        <input
          id="onboarding-nickname"
          name="nickname"
          autoComplete="nickname"
          maxLength={NICKNAME_MAX}
          required
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          aria-invalid={(status !== null && status !== "ok" && status !== "checking") || undefined}
          aria-describedby="onboarding-nickname-hint"
        />
        <p
          id="onboarding-nickname-hint"
          className={s.hint}
          data-tone={
            serverNicknameError
              ? "bad"
              : status === "ok"
                ? "good"
                : status && status !== "checking"
                  ? "bad"
                  : undefined
          }
          aria-live="polite"
        >
          {serverNicknameError ?? nicknameHint}
        </p>
      </div>

      <fieldset className={s.field}>
        <legend>
          관심사{" "}
          <span className={s.count}>
            {picked.length}/{INTERESTS_MAX}
          </span>
        </legend>
        <p className={s.hint}>관심 있는 주제를 1~5개 골라 주세요.</p>
        <div className={s.chips}>
          {interests.map((interest) => {
            const on = picked.includes(interest.id);
            const full = !on && picked.length >= INTERESTS_MAX;
            return (
              <label
                key={interest.id}
                className={s.chip}
                data-on={on || undefined}
                data-full={full || undefined}
              >
                <input
                  type="checkbox"
                  name="interest"
                  value={interest.id}
                  checked={on}
                  disabled={full}
                  onChange={() => toggle(interest.id)}
                />
                {interest.name}
              </label>
            );
          })}
        </div>
        {state.field === "interests" && (
          <p className={s.hint} data-tone="bad" role="alert">
            {state.error}
          </p>
        )}
      </fieldset>

      {state.error && state.field === null && (
        <p className={s.hint} data-tone="bad" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" className={s.cta} disabled={pending || !nicknameOk || !countOk}>
        {pending ? "저장하는 중…" : "시작하기"}
      </button>
      {!pending && (!nicknameOk || !countOk) && (
        <p className={s.need}>
          {!nicknameOk ? "닉네임을 정하면" : "관심사를 1개 이상 고르면"} 시작할 수 있어요.
        </p>
      )}
    </form>
  );
}

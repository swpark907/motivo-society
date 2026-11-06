"use server";

import { redirect } from "next/navigation";
import { safeNext } from "@/lib/platform/auth-paths";
import { errorMessage } from "@/lib/platform/messages";
import { checkNickname, completeOnboarding } from "@/lib/platform/profile";

export type NicknameStatus = { name: string; code: string };

/** 입력하는 동안 닉네임을 바로 확인한다. */
export async function checkNicknameAction(name: string): Promise<NicknameStatus> {
  return { name, code: await checkNickname(name.trim()) };
}

export type OnboardingState = { error: string | null; field: "nickname" | "interests" | null };

export async function finishOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const nickname = String(formData.get("nickname") ?? "").trim();
  const interests = formData.getAll("interest").map(String);
  const next = safeNext(String(formData.get("next") ?? ""));
  const code = await completeOnboarding(nickname, interests);
  if (code) {
    const field = code.startsWith("nickname")
      ? "nickname"
      : code.startsWith("interest")
        ? "interests"
        : null;
    return { error: errorMessage(code), field };
  }
  redirect(next);
}

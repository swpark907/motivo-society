"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isEmailLike, safeNext } from "@/lib/platform/auth-paths";
import { isPersonaHandle, personaEmail, SANDBOX_PASSWORD } from "@/lib/platform/personas";
import { createSessionClient, sandboxEnv } from "@/lib/platform/supabase-server";

export type MagicLinkState =
  | { status: "idle" }
  | { status: "sent"; email: string; sentAt: number }
  | { status: "error"; message: string; email: string };

/** 매직링크 메일을 보낸다. 처음 온 이메일이면 계정이 새로 생긴다(닉네임은 L03 온보딩에서). */
export async function sendMagicLink(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const next = safeNext(String(formData.get("next") ?? ""));
  if (!isEmailLike(email)) {
    return { status: "error", email, message: "이메일 주소를 다시 확인해 주세요." };
  }
  if (!sandboxEnv()) {
    return {
      status: "error",
      email,
      message: "지금은 로그인을 쓸 수 없어요. 잠시 뒤 다시 시도해 주세요.",
    };
  }
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    const tooSoon = error.status === 429 || /rate|seconds/i.test(error.message);
    return {
      status: "error",
      email,
      message: tooSoon
        ? "메일을 너무 자주 요청했어요. 잠시 뒤 다시 보내 주세요."
        : "메일을 보내지 못했어요. 잠시 뒤 다시 시도해 주세요.",
    };
  }
  return { status: "sent", email, sentAt: Date.now() };
}

export async function signOut() {
  if (sandboxEnv()) {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

/** 개발 환경 전용: 시험장의 가짜 사람으로 바로 들어간다. 운영 빌드에서는 막힌다. */
export async function devSignInAs(formData: FormData) {
  if (process.env.NODE_ENV !== "development") throw new Error("development only");
  const handle = String(formData.get("handle") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));
  if (!isPersonaHandle(handle)) throw new Error("unknown persona");
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  const { error } = await supabase.auth.signInWithPassword({
    email: personaEmail(handle),
    password: SANDBOX_PASSWORD,
  });
  if (error) redirect(`/login?error=persona&next=${encodeURIComponent(next)}`);
  redirect(next);
}

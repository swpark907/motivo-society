import { redirect } from "next/navigation";
import { loginHref, onboardingHref } from "./auth-paths";
import { createSessionClient, sandboxEnv } from "./supabase-server";

export type CurrentUser = {
  id: string;
  email: string;
  /** 첫 가입 온보딩 전이면 null. */
  nickname: string | null;
  /** 닉네임·관심사를 정했는지. false면 /onboarding으로 보낸다. */
  onboarded: boolean;
};

/** 지금 로그인한 사람. 연결 정보가 없거나 로그인하지 않았으면 null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!sandboxEnv()) return null;
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, onboarded_at")
    .eq("id", user.id)
    .maybeSingle();
  return {
    id: user.id,
    email: user.email ?? "",
    nickname: profile?.nickname ?? null,
    onboarded: Boolean(profile?.onboarded_at),
  };
}

/** 로그인만 확인한다(온보딩 화면 자체용). */
export async function requireSignedIn(path: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginHref(path));
  return user;
}

/**
 * 회원 화면. 로그인하지 않았으면 로그인 화면으로, 닉네임·관심사를 아직 안 정했으면
 * 온보딩으로 보냈다가 `path`로 돌아온다.
 */
export async function requireUser(path: string): Promise<CurrentUser> {
  const user = await requireSignedIn(path);
  if (!user.onboarded) redirect(onboardingHref(path));
  return user;
}

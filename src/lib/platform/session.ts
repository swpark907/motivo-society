import { redirect } from "next/navigation";
import { loginHref } from "./auth-paths";
import { createSessionClient, sandboxEnv } from "./supabase-server";

export type CurrentUser = {
  id: string;
  email: string;
  /** 첫 가입 온보딩(L03) 전이면 null. */
  nickname: string | null;
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
    .select("nickname")
    .eq("id", user.id)
    .maybeSingle();
  return { id: user.id, email: user.email ?? "", nickname: profile?.nickname ?? null };
}

/** 로그인이 필요한 화면. 로그인하지 않았으면 로그인 화면으로 보냈다가 `path`로 돌아온다. */
export async function requireUser(path: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginHref(path));
  return user;
}

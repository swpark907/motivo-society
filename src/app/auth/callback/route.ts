import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { onboardingHref, safeNext } from "@/lib/platform/auth-paths";
import { createSessionClient } from "@/lib/platform/supabase-server";

/**
 * 메일 속 링크가 돌아오는 곳. 코드를 세션으로 바꾼 뒤 원래 가려던 화면으로 보낸다.
 * 링크가 만료되었거나 다른 브라우저에서 열었으면 로그인 화면에서 다시 보내게 한다.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next"));
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  const supabase = await createSessionClient();
  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }
  if (!ok) redirect(`/login?error=link&next=${encodeURIComponent(next)}`);

  // 처음 온 사람은 닉네임·관심사부터 정한 뒤 가려던 곳으로 간다.
  const { data } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", data.user?.id ?? "")
    .maybeSingle();
  if (!profile?.onboarded_at) redirect(onboardingHref(next));
  redirect(next);
}

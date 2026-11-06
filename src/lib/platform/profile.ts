import { errorCodeFrom } from "./messages";
import { createSessionClient } from "./supabase-server";

import type { Interest } from "./profile-limits";

/** 고를 수 있는 관심사(소유자가 관리하는 목록). */
export async function listActiveInterests(): Promise<Interest[]> {
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("interests")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

/** 닉네임을 쓸 수 있는지: "ok" 또는 오류 코드. */
export async function checkNickname(nickname: string): Promise<string> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("nickname_check", { p_nickname: nickname });
  if (error) return errorCodeFrom(error.message);
  return data ?? "nickname_invalid";
}

/** 닉네임·관심사를 확정한다. 성공하면 null, 실패하면 오류 코드. */
export async function completeOnboarding(
  nickname: string,
  interestIds: string[],
): Promise<string | null> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("profile_complete_onboarding", {
    p_nickname: nickname,
    p_interests: interestIds,
  });
  return error ? errorCodeFrom(error.message) : null;
}

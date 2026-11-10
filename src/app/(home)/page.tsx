import { redirect } from "next/navigation";
import { onboardingHref } from "@/lib/platform/auth-paths";
import { getCurrentUser } from "@/lib/platform/session";
import { MemberHome } from "../_home/MemberHome";
import { PublicHome } from "../_home/PublicHome";

/**
 * `/` — 로그인하면 회원 홈(오늘 → 내 사람들 → 발견), 아니면 모쏘 소개 + 이번 주 활동.
 * 정보 구조: docs/product/platform-ia.md
 */
export default async function Home() {
  const user = await getCurrentUser();
  if (user && !user.onboarded) redirect(onboardingHref("/"));
  if (user) return <MemberHome user={user} />;
  return <PublicHome />;
}

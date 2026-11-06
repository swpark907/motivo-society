/**
 * 로그인 뒤 돌아갈 주소를 고른다. 같은 사이트 안의 경로만 허용하고,
 * 다른 사이트로 보내는 값(`//evil.com`, `https://…`, `/\evil`)은 홈으로 바꾼다.
 */
export function safeNext(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(raw)) return fallback;
  // 로그인 화면 자체로 돌아가면 다시 로그인 화면이 뜬다.
  if (
    raw === "/login" ||
    raw.startsWith("/login?") ||
    raw.startsWith("/auth/") ||
    raw === "/onboarding" ||
    raw.startsWith("/onboarding?")
  ) {
    return fallback;
  }
  return raw;
}

/** 로그인이 필요한 화면에서 보낼 로그인 주소. */
export function loginHref(next: string): string {
  const target = safeNext(next);
  return target === "/" ? "/login" : `/login?next=${encodeURIComponent(target)}`;
}

/** 첫 가입 온보딩 주소. 마치면 `next`로 간다. */
export function onboardingHref(next: string): string {
  const target = safeNext(next);
  return target === "/" ? "/onboarding" : `/onboarding?next=${encodeURIComponent(target)}`;
}

/** 이메일 형식의 아주 기본적인 확인. 실제 확인은 메일이 도착하는지로 한다. */
export function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

/**
 * 로컬 시험장(`supabase/seed.sql`)의 가짜 사람들. 실제 회원이 아니다.
 * 비밀번호는 로컬 시험장 전용 값이며 seed.sql의 sandbox_reseed()와 같아야 한다.
 */
export const SANDBOX_PASSWORD = "sandbox-pass-2026";

export const PERSONAS = [
  { handle: "owner", nickname: "모쏘운영", role: "플랫폼 소유자", note: "운영 기록을 본다" },
  { handle: "host", nickname: "바라호스트", role: "유료 호스트", note: "클럽 밖 카페 번개를 연다" },
  { handle: "club-admin", nickname: "클럽장", role: "클럽 관리자", note: "주말 바이브코딩 클럽" },
  {
    handle: "club-staff",
    nickname: "클럽운영진",
    role: "클럽 운영진",
    note: "참가자 관리 권한이 있는 레이어",
  },
  { handle: "member", nickname: "멤버하나", role: "클럽 멤버", note: "멤버 전용 모임에 신청 가능" },
  { handle: "guest", nickname: "처음온사람", role: "외부인", note: "어느 클럽에도 없다" },
] as const;

export type PersonaHandle = (typeof PERSONAS)[number]["handle"];

export function personaEmail(handle: string): string {
  return `${handle}@sandbox.motivo.test`;
}

export function isPersonaHandle(value: string): value is PersonaHandle {
  return PERSONAS.some((p) => p.handle === value);
}

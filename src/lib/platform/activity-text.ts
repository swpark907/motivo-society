// 활동 상세의 문장 만들기. React 의존 없음.
import { clockTime, kstDaysUntil, shortDate } from "./activity-time";

const FORMAT_NAMES: Record<string, string> = { text: "글", photo: "사진", link: "링크" };

export function certRuleText(rule: "daily" | "weekly_n" | "total_n", n: number | null): string {
  if (rule === "daily") return "매일 한 번 인증해요";
  if (rule === "weekly_n") return `한 주에 ${n}번 인증해요`;
  return `기간 안에 모두 ${n}번 인증해요`;
}

export function certFormatsText(formats: string[]): string {
  return formats.map((f) => FORMAT_NAMES[f] ?? f).join(" · ");
}

/** [{days_before:7, rate:100}, {3, 50}, {0, 0}] → "시작 7일 전까지 전액 · 3일 전까지 50% · 그 뒤에는 환불되지 않아요" */
export function refundText(rules: { days_before: number; rate: number }[]): string {
  const sorted = [...rules].sort((x, y) => y.days_before - x.days_before);
  const parts = sorted.map((r) => {
    const amount = r.rate === 100 ? "전액" : r.rate === 0 ? null : `${r.rate}%`;
    if (r.days_before === 0) return amount ? `시작 전까지 ${amount}` : "그 뒤에는 환불되지 않아요";
    return amount
      ? `${r.days_before}일 전까지 ${amount}`
      : `${r.days_before}일 전부터는 환불되지 않아요`;
  });
  if (parts[0] && !parts[0].startsWith("시작")) parts[0] = `시작 ${parts[0]}`;
  return parts.join(" · ");
}

/** 회차 상태: 끝남 · 오늘 · 날짜 */
export function sessionState(
  startsAt: string | null,
  status: string,
  now: Date,
): "끝남" | "오늘" | null {
  if (status === "ended") return "끝남";
  if (startsAt && kstDaysUntil(new Date(startsAt), now) === 0) return "오늘";
  if (startsAt && new Date(startsAt) < now) return "끝남";
  return null;
}

export function sessionWhen(startsAt: string | null): string {
  if (!startsAt) return "일정 미정";
  const at = new Date(startsAt);
  return `${shortDate(at)} ${clockTime(at)}`;
}

/** "2026-11-02" 같은 날짜 문자열을 한국 날짜로 보여 준다. */
export function dateOnly(isoDate: string): string {
  return shortDate(new Date(`${isoDate}T00:00:00+09:00`));
}

/** 계좌 안내 문구에서 계좌번호만 꺼낸다(복사 버튼용). 못 찾으면 문구 전체. */
export function accountNumber(note: string): string {
  return note.match(/\d[\d-]{6,}\d/)?.[0] ?? note;
}

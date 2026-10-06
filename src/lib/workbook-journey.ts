export const JOURNEY_KEY = "motivo.workbook.mobile-journey.v1";
export const stops = [
  { title: "작업실", subtitle: "친구에게 보낸 첫 페이지", x: 22, y: 60 },
  { title: "작은 정류장", subtitle: "휴대폰에서 생긴 문제", x: 50, y: 43 },
  { title: "마을 광장", subtitle: "내 작업으로 가져가기", x: 78, y: 60 },
] as const;
export type JourneyProgress = {
  chapter: number;
  completed: number;
  note: string;
  applied: boolean;
};
export const initialProgress: JourneyProgress = {
  chapter: 0,
  completed: 0,
  note: "",
  applied: false,
};
export function readProgress(raw: string | null): JourneyProgress {
  if (!raw) return { ...initialProgress };
  try {
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object") return { ...initialProgress };
    const completed = Number.isInteger(p.completed) ? Math.max(0, Math.min(3, p.completed)) : 0;
    return {
      chapter: Number.isInteger(p.chapter) ? Math.max(0, Math.min(2, completed, p.chapter)) : 0,
      completed,
      note: typeof p.note === "string" ? p.note.slice(0, 1200) : "",
      applied: completed === 3 && p.applied === true,
    };
  } catch {
    return { ...initialProgress };
  }
}

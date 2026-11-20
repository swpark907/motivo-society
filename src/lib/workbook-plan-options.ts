import type { PlanButton } from "./workbook-plan-readers";

// 2단원 기획 수업들이 고르게 하는 것들. 학습자는 쓰지 않고 고르며, 고른 id가 기획 기록에 남는다.
// 모두 설명용 예시이고, 실제 사이트 · 회사 · 사람의 이름을 쓰지 않는다.

// ── 2-1 읽을 사람의 상황 ──
export type SituationOption = { id: string; label: string; need: string };
export const situationGroups: readonly {
  key: "entry" | "device" | "pace";
  question: string;
  options: readonly SituationOption[];
}[] = [
  {
    key: "entry",
    question: "어디서 들어오나요?",
    options: [
      { id: "insta", label: "인스타그램 링크", need: "인스타에서 본 내용과 이어지는 첫 문장" },
      { id: "search", label: "검색", need: "검색한 말이 제목이나 첫 문장에 보이기" },
      { id: "friend", label: "아는 사람 소개", need: "누가 만든 페이지인지 바로 보이기" },
    ],
  },
  {
    key: "device",
    question: "무엇으로 보나요?",
    options: [
      { id: "phone", label: "휴대폰", need: "좁은 화면에서도 제목과 버튼이 잘리지 않기" },
      { id: "desktop", label: "컴퓨터", need: "넓은 화면에서 한눈에 들어오는 배치" },
    ],
  },
  {
    key: "pace",
    question: "얼마나 머무르나요?",
    options: [
      { id: "short", label: "30초 훑어보기", need: "3초 안에 무슨 페이지인지 알고, 버튼이 가까이" },
      { id: "long", label: "차분히 읽기", need: "자세한 설명과 믿을 만한 근거는 아래쪽에" },
    ],
  },
];
export function situationLabel(key: "entry" | "device" | "pace", id: string) {
  return situationGroups
    .find((group) => group.key === key)
    ?.options.find((option) => option.id === id)?.label;
}

// ── 2-1 잘 됐다는 기준 ──
export const criteriaOptions = [
  "3초 안에 무슨 페이지인지 알 수 있다",
  "읽을 사람이 찾는 내용이 첫 화면에 있다",
  "다 읽은 사람이 누를 버튼이 보인다",
  "휴대폰에서 글자와 버튼이 잘리지 않는다",
  "내가 말하지 않은 내용(경력 · 숫자)이 없다",
] as const;
/** 고른 상황에 맞춰 먼저 권하는 기준. */
export function suggestedCriteria(plan: { device: string; pace: string }) {
  const picks = new Set<string>([criteriaOptions[0], criteriaOptions[4]]);
  if (plan.device === "phone") picks.add(criteriaOptions[3]);
  if (plan.pace === "short") picks.add(criteriaOptions[2]);
  else picks.add(criteriaOptions[1]);
  return picks;
}

// ── 2-2 레퍼런스 ──
export type ReferencePart = { id: string; label: string; role: string };
export type ReferenceExample = { id: string; name: string; parts: readonly ReferencePart[] };
/** 같은 목적의 예시 페이지 세 장. 그림은 칸과 글로만 그리고, 이름은 "예시 A·B·C"로 둔다. */
export const referenceExamples: readonly ReferenceExample[] = [
  {
    id: "a",
    name: "큰 사진으로 시작하는 페이지",
    parts: [
      { id: "hero-photo", label: "맨 위 큰 사진", role: "첫눈에 분위기와 주제를 보여 줘요" },
      { id: "one-line", label: "한 줄 소개", role: "무엇을 하는 페이지인지 한 문장으로 말해요" },
      { id: "top-button", label: "첫 화면 버튼", role: "바로 행동할 사람에게 길을 열어 줘요" },
    ],
  },
  {
    id: "b",
    name: "목록으로 보여주는 페이지",
    parts: [
      { id: "plain-title", label: "글자만 있는 제목", role: "가볍고 빠르게 주제를 알려 줘요" },
      { id: "card-list", label: "카드 목록", role: "하나씩 비교하며 고르게 해 줘요" },
      { id: "review", label: "후기 한 줄", role: "믿을 만한 근거가 되어 줘요" },
    ],
  },
  {
    id: "c",
    name: "한 문장으로 끝나는 페이지",
    parts: [
      { id: "big-sentence", label: "화면을 채우는 한 문장", role: "기억에 남는 한 가지만 전해요" },
      {
        id: "bottom-button",
        label: "맨 아래 버튼 하나",
        role: "다 읽은 사람의 다음 행동을 정해 줘요",
      },
      { id: "footer-contact", label: "아래 연락처", role: "더 궁금한 사람이 찾아올 곳이에요" },
    ],
  },
];
export function referencePart(id: string) {
  for (const example of referenceExamples) {
    const part = example.parts.find((item) => item.id === id);
    if (part) return part;
  }
  return null;
}

// ── 2-3 배치 틀(와이어프레임) ──
export const layoutOptions = [
  {
    id: "stack",
    label: "한 줄로 쌓기",
    note: "위에서 아래로 차례로. 휴대폰에서 가장 자연스러워요.",
  },
  { id: "two", label: "두 칸으로 나누기", note: "넓은 화면에서 왼쪽 글 · 오른쪽 목록처럼 나눠요." },
  { id: "hero", label: "큰 사진 위에", note: "맨 위를 큰 사진으로 채우고 그 아래에 내용을 둬요." },
] as const;
export function layoutLabel(id: string) {
  return layoutOptions.find((option) => option.id === id)?.label;
}

// ── 2-4 버튼 문구 ──
/** 버튼마다 흐릿한 말(버튼 이름 그대로)과 무엇이 일어나는지 알려 주는 구체적인 말. */
export const buttonWordings: Record<PlanButton["id"], readonly string[]> = {
  contact: ["연락하기", "작업 의뢰 문의하기"],
  works: ["작업 더 보기", "다른 작업 사례 보기"],
  apply: ["신청하기", "이번 달 수업 신청하기"],
  picks: ["추천 목록 보기", "추천 목록 바로 보기"],
};

// ── 2-4 분위기 ──
export const moodOptions = [
  {
    id: "calm",
    label: "차분한",
    note: "흰 바탕에 검은 글자, 얇은 선. 내용이 먼저 보여요.",
    colors: { paper: "#ffffff", ink: "#222222", accent: "#555555" },
    font: "고딕 · 보통 굵기",
  },
  {
    id: "bold",
    label: "선명한",
    note: "또렷한 한 가지 색으로 버튼과 제목을 강조해요.",
    colors: { paper: "#ffffff", ink: "#111111", accent: "#1f5eff" },
    font: "고딕 · 굵은 제목",
  },
  {
    id: "warm",
    label: "따뜻한",
    note: "크림색 바탕과 갈색 글자로 편안한 느낌이에요.",
    colors: { paper: "#fbf3e4", ink: "#4a3426", accent: "#c8642b" },
    font: "명조 제목 · 고딕 본문",
  },
] as const;
export function moodLabel(id: string) {
  return moodOptions.find((option) => option.id === id)?.label;
}

// ── 요청 메모에 쓰는 문장(2-5) ──
// 조사(은/는·이/가)를 붙이지 않는 완성된 문장으로 둔다.
export const situationSentence = {
  entry: {
    insta: "인스타그램 링크를 타고 들어와요.",
    search: "검색해서 들어와요.",
    friend: "아는 사람에게 소개받고 들어와요.",
  } as Record<string, string>,
  device: {
    phone: "주로 휴대폰으로 봐요.",
    desktop: "주로 컴퓨터로 봐요.",
  } as Record<string, string>,
  pace: {
    short: "30초쯤 훑어보고 나가요.",
    long: "시간을 들여 차분히 읽어요.",
  } as Record<string, string>,
};
export const layoutSentence: Record<string, string> = {
  stack: "배치는 위에서 아래로 한 줄로 쌓아 줘.",
  two: "넓은 화면에서는 왼쪽에 제목과 소개, 오른쪽에 내용 목록을 두는 두 칸으로 해 줘.",
  hero: "맨 위를 큰 사진 자리로 비워 두고, 그 아래에 내용을 둬. 사진은 내가 나중에 넣을게.",
};
export const moodSentence: Record<string, string> = {
  calm: "분위기는 차분하게. 흰 바탕에 검은 글자, 얇은 선만 써 줘.",
  bold: "분위기는 선명하게. 흰 바탕에 파란색 한 가지로 제목과 버튼을 강조해 줘.",
  warm: "분위기는 따뜻하게. 크림색 바탕에 갈색 글자, 제목은 명조 느낌으로 해 줘.",
};

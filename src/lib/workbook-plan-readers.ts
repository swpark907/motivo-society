// 2-1 홈페이지 기획하기의 고를 거리. 학습자는 쓰지 않고 고른다: 읽을 사람 → 제목 스티커 → 맨 아래 버튼 →
// 담을 것 카드. 카드는 사실이 아니라 "종류"다(실제 내용은 2-2에서 AI가 학습자에게 물어보며 채운다).
// 워크북 목적(workbook-purpose)의 id와 짝을 이룬다.

export type PlanSticker = { kind: "vague" | "clear" | "long"; text: string };
export type PlanReader = {
  id: "portfolio" | "service" | "personal";
  tag: string;
  /** 기획의 "읽을 사람" 칸에 들어가는 말. */
  audience: string;
  /** 이 사람이 내 첫 화면에서 찾는 것(1-6 페이지에는 아직 없다). */
  looksFor: string;
  stickers: readonly [PlanSticker, PlanSticker, PlanSticker];
  /** 이 사람에게 먼저 권하는 버튼. */
  button: PlanButton["id"];
  /** 담을 것의 종류. 사실을 적지 않는다. */
  cards: readonly string[];
};
export type PlanButton = {
  id: "contact" | "apply" | "picks" | "works";
  label: string;
  purpose: string;
};

export const planButtons: readonly PlanButton[] = [
  { id: "contact", label: "연락하기", purpose: "페이지를 보고 연락하기" },
  { id: "works", label: "작업 더 보기", purpose: "작업을 더 둘러보기" },
  { id: "apply", label: "신청하기", purpose: "내용을 보고 신청하기" },
  { id: "picks", label: "추천 목록 보기", purpose: "추천 목록에서 하나 골라 보기" },
];

/** 1단원에서 만든 페이지의 제목. 셋 모두 첫 스티커로 같은 것을 쓴다. */
const VAGUE = { kind: "vague", text: "내 소개" } as const;

export const planReaders: readonly PlanReader[] = [
  {
    id: "portfolio",
    tag: "채용 담당자",
    audience: "작은 웹 작업을 맡길 사람을 찾는 채용 담당자",
    looksFor: "어떤 작업을 해 봤는지",
    stickers: [
      VAGUE,
      { kind: "clear", text: "AI와 함께 만든 작업들" },
      {
        kind: "long",
        text: "AI 도구를 처음 배우면서 직접 만들고 고쳐 본 여러 가지 웹 작업과 그 과정에서 배운 점 모음",
      },
    ],
    button: "contact",
    cards: [
      "해 본 작업",
      "만들며 배운 점",
      "자주 쓰는 도구",
      "연락 방법",
      "수상·자격",
      "작업 화면 캡처",
    ],
  },
  {
    id: "service",
    tag: "처음 온 손님",
    audience: "우리 서비스를 처음 알게 된 근처 손님",
    looksFor: "무엇을 해 주는지, 어떻게 신청하는지",
    stickers: [
      VAGUE,
      { kind: "clear", text: "처음 오신 분을 위한 안내" },
      {
        kind: "long",
        text: "저희가 무엇을 하는 곳인지와 처음 오시는 분이 알아 두면 좋은 이용 방법과 신청 절차 안내",
      },
    ],
    button: "apply",
    cards: ["무엇을 해 주는지", "요일과 장소", "신청 방법", "가격", "이용 후기", "완성품 사진"],
  },
  {
    id: "personal",
    tag: "오랜 친구",
    audience: "취향이 비슷한 오랜 친구",
    looksFor: "요즘 무엇에 빠져 있는지",
    stickers: [
      VAGUE,
      { kind: "clear", text: "요즘 빠져 있는 것들" },
      {
        kind: "long",
        text: "요즘 매일 쓰고 보고 듣는 것들 가운데 친구에게 꼭 권하고 싶은 것들을 이유와 함께 모아 둔 곳",
      },
    ],
    button: "picks",
    cards: ["요즘 빠진 것", "권하는 이유", "써 본 경험", "사진", "링크 모음"],
  },
];

/** 카피바라가 제목 스티커를 보고 하는 말. */
export const stickerReaction: Record<PlanSticker["kind"], string> = {
  vague: "음… 무엇을 소개하는 페이지인지 모르겠어요.",
  clear: "무엇을 소개하는 페이지인지 바로 알겠어요!",
  long: "내용은 좋은데, 너무 길어서 한눈에 안 들어와요.",
};

/** 1-6 소개 글이 없을 때 기획의 소개 칸에 넣는 말. 요청으로 그대로 가서 AI가 학습자에게 묻게 한다. */
export const ASK_INTRO = "소개 글은 나에게 물어보고 채워줘.";

export function findPlanReader(id: string | null) {
  return planReaders.find((reader) => reader.id === id) ?? null;
}
export function findPlanButton(purpose: string) {
  return planButtons.find((button) => button.purpose === purpose) ?? null;
}

/** 한 줄에 하나씩 적은 내용을 항목으로 나눈다. */
export function planLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

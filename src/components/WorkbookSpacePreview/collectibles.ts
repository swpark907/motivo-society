// 제안 시안의 예시 상태. 실제 회원·학습 진도와 연결하지 않는다.
export const slots = [
  { id: "deskLeft", name: "책상 왼쪽", accepts: ["desk"] },
  { id: "deskRight", name: "책상 오른쪽", accepts: ["desk"] },
  { id: "wall", name: "벽", accepts: ["wall"] },
  { id: "shelf", name: "작은 선반", accepts: ["shelf"] },
  { id: "monitor", name: "작업 전시대", accepts: ["display"] },
] as const;
export type SlotId = (typeof slots)[number]["id"];
export const collectibles = [
  {
    id: "cup",
    name: "늘 쓰던 머그",
    kind: "cup",
    category: "desk",
    chapter: "처음의 작업 공간",
    condition: "처음부터 제공하는 기본 소품",
    origin: "작업실",
    earned: true,
    record: "기본 소품에는 학습 기록이 연결되지 않아요.",
  },
  {
    id: "guide",
    name: "첫 탐험 수첩",
    kind: "book",
    category: "shelf",
    chapter: "AI 도구 준비하기",
    condition: "다섯 입문 수업의 학습 확인과 마지막 정리",
    origin: "AI 도구 준비하기 지도",
    earned: true,
    record: "AI의 역할·도구·첫 대화·에이전트에 대한 학습 정리를 열어요.",
  },
  {
    id: "plan",
    name: "공방의 기획 노트",
    kind: "book",
    category: "desk",
    chapter: "기획하고 첫 화면 만들기 · 기획",
    condition: "목적·대상·콘텐츠를 작성하고 제작 요청 정리",
    origin: "제작 공방",
    earned: true,
    record:
      "예시 기획 · 동네 산책 모임을 처음 만나는 사람에게 소개하는 한 페이지. 확정된 일정과 연락 방법을 담기로 했어요.",
  },
  {
    id: "frame",
    name: "나의 첫 화면",
    kind: "frame",
    category: "display",
    chapter: "기획하고 첫 화면 만들기 · 첫 화면",
    condition: "클래스의 첫 화면 확인 활동 마무리",
    origin: "제작 공방",
    earned: true,
    record:
      "클래스 안의 첫 화면 관찰 기록이 연결돼요. 외부에서 만든 실제 파일의 완성 여부와는 별개예요.",
  },
  {
    id: "ruler",
    name: "화면을 재는 자",
    kind: "ruler",
    category: "desk",
    chapter: "반응형 화면 만들기",
    condition: "문제 관찰 → 개선 요청 → 전후 비교 마무리",
    origin: "반응형 화면 만들기 지도",
    earned: true,
    record: "예시 관찰 · 모바일에서 소개글이 너무 길어 보여 너비와 간격을 한 부분씩 비교했어요.",
  },
  {
    id: "drawer",
    name: "기록 보관함",
    kind: "drawer",
    category: "shelf",
    chapter: "기능과 데이터 저장",
    condition: "입력·표시·저장·다른 기기 예시와 학습 정리",
    origin: "기능과 데이터 저장 지도",
    earned: false,
    record: "학습용 저장 실험과 실제 파일 적용 기록을 구별해 연결해요.",
  },
  {
    id: "sign",
    name: "작은 오픈 간판",
    kind: "sign",
    category: "wall",
    chapter: "배포하고 고치기",
    condition: "공개 전 점검·주소·다른 환경 확인의 학습 정리",
    origin: "배포하고 고치기 지도",
    earned: false,
    record: "공개 준비 학습의 기념품이에요. 사이트가 실제 배포됐다는 인증은 아니에요.",
  },
] as const;
export type Collectible = (typeof collectibles)[number];
export type Arrangement = Record<SlotId, string | null>;
export const initialArrangement: Arrangement = {
  deskLeft: "plan",
  deskRight: "cup",
  wall: null,
  shelf: "guide",
  monitor: "frame",
};

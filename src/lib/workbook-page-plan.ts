import { workbookLearningExample } from "./workbook-learning-example";

// 기획 화면과 요청 생성에서 같은 필드·완료 기준을 사용한다.
export const workbookPlanFields = [
  ["title", "홈페이지 제목", "예: 내가 만든 작은 웹 모음"],
  ["audience", "누가 읽나요?", "예: 내가 만든 작업이 궁금한 친구"],
  ["purpose", "읽은 뒤 무엇을 하길 바라나요?", "예: 내용 보기 버튼을 눌러 작업 목록 살펴보기"],
  ["intro", "첫 소개 문장", "직접 한 일이나 지금 소개할 사실을 적어요."],
  [
    "content",
    "소개할 내용 · 한 줄에 하나",
    "실제 작업·활동·정보를 적어요. 없는 실적은 넣지 않아요.",
  ],
] as const;

export const workbookPlanExample = {
  title: workbookLearningExample.title,
  audience: "혼자 책 읽을 곳을 찾는 사람",
  purpose: "세 장소를 비교해 가볼 곳 고르기",
  intro: workbookLearningExample.intro,
  content: workbookLearningExample.content,
};

export type WorkbookPagePlan = Record<(typeof workbookPlanFields)[number][0], string>;

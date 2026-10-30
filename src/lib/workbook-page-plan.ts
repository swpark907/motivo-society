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

export function makeWorkbookPageRequest(record: WorkbookPagePlan) {
  return `앞서 작업한 my-first-web 폴더의 index.html을 먼저 읽고 같은 파일을 내 주제의 소개 페이지로 수정해줘. 새 폴더나 별도 예제를 만들지 마.\n\n내 기획은 다음과 같아.\n제목: ${record.title.trim()}\n읽을 사람: ${record.audience.trim()}\n페이지의 목적: ${record.purpose.trim()}\n첫 소개 문장: ${record.intro.trim()}\n\n소개할 내용:\n${record.content.trim()}\n\n화면은 제목 → 소개 → ‘내용 보기’ 버튼 → 내용 목록 순서로 배치해줘. 버튼을 누르면 내용 목록으로 이동하게 해줘. 알려주지 않은 실적이나 숫자는 추가하지 마.\n\n기존 내용 중 기획과 맞는 부분은 유지하고 임시 내용만 교체해줘. index.html만 바꾸고 다른 파일·외부 서비스·설치·로그인·배포는 건드리지 마. 파일이 없으면 만들기 전에 알려줘. 브라우저에서 여는 방법과 바뀐 파일, 확인할 것을 알려줘.`;
}

import { practicalLabs, type PracticalStage } from "./workbook-practical-labs";

// 소개·지도·URL·본문이 공유하는 실제 수업 기준. 학습 주제와 선택 심화는 번호에 넣지 않는다.
const units = [
  {
    world: "ai",
    stage: "agent",
    title: "AI 도구 준비하기",
    lessons: [
      { slug: "ai-understanding", title: "AI란 무엇인가" },
      { slug: "ai-tools", title: "어떤 AI를 쓸까" },
      { slug: "ai-usage", title: "AI를 쓰는 만큼" },
      { slug: "tool-setup", title: "도구와 작업 공간 준비" },
      { slug: "first-request", title: "요청 잘하기" },
      { slug: "first-file", title: "첫 코드 만들기" },
    ],
  },
  {
    world: "project",
    stage: "project",
    title: "기획하고 첫 화면 만들기",
    lessons: [
      { slug: "page-planning", title: "누구를 위한 페이지인가" },
      { slug: "page-references", title: "남의 페이지에서 배우기" },
      { slug: "page-structure", title: "무엇을 어떤 순서로" },
      { slug: "page-brief", title: "기획서 한 장 만들기" },
      { slug: "page-request", title: "제작 요청 다듬기" },
      { slug: "page-building", title: "첫 화면 확인하기" },
    ],
  },
  {
    world: "experience",
    stage: "experience",
    title: "반응형 화면 만들기",
    lessons: [
      { slug: "screen-observation", title: "두 화면에서 문제 찾기" },
      { slug: "screen-improvement", title: "개선 요청 쓰기" },
      { slug: "screen-check", title: "수정 전후 확인" },
    ],
  },
  {
    world: "data",
    stage: "data",
    title: "기능과 데이터 저장",
    lessons: [
      { slug: "interaction", title: "입력과 화면 변화" },
      { slug: "browser-storage", title: "새로고침과 저장" },
      { slug: "shared-data", title: "다른 기기와 서버" },
    ],
  },
  {
    world: "publish",
    stage: "publish",
    title: "배포하고 고치기",
    lessons: [
      { slug: "publish-check", title: "공개 전 점검" },
      { slug: "publish-address", title: "주소와 배포" },
      { slug: "publish-debug", title: "공개 후 문제 해결" },
    ],
  },
] as const;
// 수업 화면이 쓰는 번호. 1단원 수업은 순서대로 0부터, 2단원부터는 단원마다 번호 하나를 쓴다.
// 1단원 수업 수가 바뀌어도 다른 파일의 숫자를 고치지 않도록 여기 한 곳에서만 정한다.
const aiCount = units[0].lessons.length;
const aiIndex = (slug: string) => units[0].lessons.findIndex((item) => item.slug === slug);
export const workbookLessonId = {
  aiCount,
  usage: aiIndex("ai-usage"),
  setup: aiIndex("tool-setup"),
  firstRequest: aiIndex("first-request"),
  firstFile: aiIndex("first-file"),
  project: aiCount,
  experience: aiCount + 1,
  data: aiCount + 2,
  publish: aiCount + 3,
} as const;
// 2단원 수업의 순서. 수업이 늘거나 순서가 바뀌어도 다른 파일의 숫자를 고치지 않도록 이름으로 찾는다.
const projectIndex = (slug: string) => units[1].lessons.findIndex((item) => item.slug === slug);
export const workbookProjectStep = {
  audience: projectIndex("page-planning"),
  references: projectIndex("page-references"),
  structure: projectIndex("page-structure"),
  brief: projectIndex("page-brief"),
  request: projectIndex("page-request"),
  result: projectIndex("page-building"),
  count: units[1].lessons.length,
} as const;
export const workbookCourse = units.map((unit, index) => ({
  ...unit,
  optionalTitle: practicalLabs[unit.stage].title,
  number: index + 1,
  lessons: unit.lessons.map((lesson, point) => ({
    ...lesson,
    number: `${index + 1}-${point + 1}`,
  })),
}));
export function getWorkbookUnit(stage: PracticalStage) {
  return workbookCourse.find((unit) => unit.stage === stage)!;
}
export function getWorkbookCourseLesson(stage: PracticalStage, point: number) {
  return getWorkbookUnit(stage).lessons[point];
}
export function workbookLessonLabel(stage: PracticalStage, point: number) {
  const lesson = getWorkbookCourseLesson(stage, point);
  return `${lesson.number} ${lesson.title}`;
}

// 무료 공개 체험에서 제공하는 범위와 기록 한계. 유료 판매·계정 저장을 뜻하지 않는다.
export const workbookTrial = {
  label: "무료 공개 체험",
  scope: `기본 ${workbookCourse.reduce((total, unit) => total + unit.lessons.length, 0)}수업과 선택 심화를 무료로 체험해요.`,
  records:
    "수업 진도·작성 내용은 이번 방문에서만 유지돼요. 새로고침하거나 워크북을 벗어나면 초기화돼요.",
  browserRecords:
    "작업실·화면 비교 실험·첨부는 이 브라우저에 저장돼요. 책상 정리 실험은 이번 방문에서만 유지돼요. 계정 저장·기기 간 동기화는 제공하지 않아요.",
  publishing:
    "5단원은 공개 전 점검과 주소·문제 해결의 개념 체험이에요. 실제 배포·공유·재배포는 제공하지 않아요.",
};

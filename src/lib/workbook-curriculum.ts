import { workbookCourse } from "./workbook-course";
import type { PracticalStage } from "./workbook-practical-labs";

const topics = [
  {
    description: "AI 도구 준비하기 5수업 · 모델과 도구를 구분하고 요청·확인·수정을 연습해요.",
    lessons: [
      "생성형 AI · 초안과 사실 확인",
      "LLM · 모델과 AI 도구의 차이",
      "AI 도구 선택 · 텍스트·이미지·웹 화면",
      "코드 에이전트 · 설치와 로컬 프로젝트 준비",
      "프롬프트 작성 · 대상과 결과 조건 전달",
      "수정 프롬프트 · 바꿀 것과 유지할 것",
      "바이브코딩 · 파일 변경과 실행 결과 확인",
    ],
  },
  {
    description: "기획하고 첫 화면 만들기 3수업 · 내 콘텐츠를 제작 요청과 첫 화면으로 연결해요.",
    lessons: [
      "웹페이지 기획 · 목적과 타깃 독자",
      "콘텐츠 구성 · 제목·소개·목록",
      "제작 프롬프트 · 기획을 작업 요청으로",
      "HTML 기초 · index.html과 페이지 구조",
      "버튼과 페이지 내 이동 · 내용 목록 연결",
      "브라우저 실행 · 첫 화면과 변경 파일 확인",
    ],
  },
  {
    description: "반응형 화면 만들기 3수업 · 두 화면을 비교하고 너비 한 부분을 개선해요.",
    lessons: [
      "CSS 기초 · 화면 너비와 배치",
      "반응형 웹 · 모바일과 데스크톱 비교",
      "사용성 점검 · 잘리는 제목과 콘텐츠 찾기",
      "개선 요청 쓰기 · 관찰한 문제와 수정 범위",
      "수정 전후 확인 · 같은 폭에서 다시 비교",
      "기능 유지 확인 · 내용 보기 버튼 재점검",
    ],
  },
  {
    description: "기능과 데이터 저장 3수업 · 메모 시뮬레이션으로 표시·저장·공유를 구분해요.",
    lessons: [
      "입력과 버튼 · 화면이 바뀌는 동작",
      "상태(State) · 지금 화면이 기억하는 값",
      "새로고침 · 표시한 값이 사라지는 이유",
      "브라우저 저장 · 저장 전후 비교 예시",
      "브라우저와 서버 · 다른 기기에서 읽기",
      "데이터베이스 · 함께 쓸 저장소가 필요한 경우",
    ],
  },
  {
    description: "배포하고 고치기 3수업 · 공개 전 점검부터 문제 재현과 수정 확인까지 익혀요.",
    lessons: [
      "공개 전 점검 · 콘텐츠·개인정보·버튼",
      "localhost와 공개 URL · 접속 주소 구분",
      "호스팅과 배포 · 파일 업로드와 공개의 차이",
      "디버깅 · 문제 재현과 수정 요청",
      "404·배포 실패 · 오류 기록으로 원인 좁히기",
      "수정 후 검증 · 같은 화면과 버튼 다시 확인",
    ],
  },
];

export const workbookCurriculum = topics.map((unit, index) => ({
  ...unit,
  name: workbookCourse[index].title,
}));

// 같은 제작 행동에서 다루는 목차 주제를 하나의 지도 지점으로 묶는다.
export const workbookPointTopics: Record<PracticalStage, number[][]> = {
  agent: [[0], [1, 2], [3], [4, 5], [6]],
  project: [
    [0, 1],
    [2, 3],
    [4, 5],
  ],
  experience: [[0, 1, 2], [3], [4, 5]],
  data: [
    [0, 1],
    [2, 3],
    [4, 5],
  ],
  publish: [[0], [1, 2], [3, 4, 5]],
};
export const workbookCurriculumStages: PracticalStage[] = [
  "agent",
  "project",
  "experience",
  "data",
  "publish",
];

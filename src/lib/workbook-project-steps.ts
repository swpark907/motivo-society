import { workbookCourse, workbookProjectStep } from "./workbook-course";

// 2단원 여섯 수업을 마쳤는지 계산하는 한 곳. 지도 · 전체 여정 · 계정 기록 변환이 같은 답을 쓴다.
// 기획 네 수업은 정리 화면에서 마친 수업의 주소를 남기고(done), 요청 · 결과 수업은 예전처럼 기록에서 계산한다.

export type ProjectStepsInput = {
  title: string;
  audience: string;
  purpose: string;
  intro: string;
  content: string;
  request: string;
  mode: "computer" | "example" | null;
  done: readonly string[];
};

/** 기획 칸(제목 · 읽을 사람 · 목적 · 소개 · 내용)이 다 찼는지. 요청 메모가 이 칸으로 만들어진다. */
export function isPlanReady(plan: ProjectStepsInput) {
  return [plan.title, plan.audience, plan.purpose, plan.intro, plan.content].every((value) =>
    value.trim(),
  );
}

/** 2단원 수업마다 마쳤는지(수업 순서대로). */
export function projectStepsDone(plan: ProjectStepsInput, projectCompleted: boolean): boolean[] {
  const lessons = workbookCourse[1].lessons;
  return lessons.map((lesson, index) => {
    if (index === workbookProjectStep.request)
      return isPlanReady(plan) && !!plan.request.trim() && plan.mode !== null;
    if (index === workbookProjectStep.result) return projectCompleted;
    return plan.done.includes(lesson.slug);
  });
}

/** 수업마다 열 수 있는지: 첫 수업은 늘, 나머지는 앞 수업을 마치면. */
export function projectStepsAvailable(done: readonly boolean[]) {
  return done.map((_, index) => index === 0 || done[index - 1]);
}

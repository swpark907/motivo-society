import { workbookCourse } from "./workbook-course";

// 계정별 진도를 DB로 옮길 때의 경계. 화면은 아직 방문 메모리를 쓰지만, 저장할 모양은 여기 한 곳에서 정한다.
// 수업은 순번이 아니라 수업 이름(slug)으로 가리킨다. 수업이 추가되거나 순서가 바뀌어도 계정 기록이 다른
// 수업에 붙지 않게 하기 위해서다. 펼침·선택 같은 화면 상태(lessonUi)는 저장 대상이 아니다.

export const WORKBOOK_CLASS_SLUG = "vibe-web";

export type WorkbookLessonRow = {
  classSlug: typeof WORKBOOK_CLASS_SLUG;
  lesson: string;
  status: "unstarted" | "in-progress" | "done";
  mode: "computer" | "example" | null;
  /** 학습자가 직접 쓴 내용만. 빈 칸은 넣지 않는다. */
  fields: Record<string, string>;
};

type PracticeLike = {
  mode: "computer" | "example" | null;
  request: string;
  observation: string;
  revision: string;
};
type PlanLike = {
  title: string;
  audience: string;
  purpose: string;
  intro: string;
  content: string;
  later: string;
  request: string;
  mode: "computer" | "example" | null;
  observation: string;
};
export type WorkbookProgressSnapshot = {
  /** 1단원 완료 수업(지금은 순번으로 들고 있다). */
  completed: readonly number[];
  practice: Readonly<Record<number, PracticeLike | undefined>>;
  project: PlanLike;
  /** 2단원 각 수업을 마쳤는지. */
  projectDone: readonly [boolean, boolean, boolean];
};

/** 1단원 순번 → 수업 이름. 범위를 벗어나면 null. */
export function unitOneLessonSlug(index: number): string | null {
  return workbookCourse[0].lessons[index]?.slug ?? null;
}

function filled(entries: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(entries)
      .map(([key, value]) => [key, value.trim()] as const)
      .filter(([, value]) => value),
  );
}

/** 지금의 방문 상태를 수업별 행으로 바꾼다. 1단원 순번을 수업 이름으로 바꾸는 곳은 여기뿐이다. */
export function toWorkbookLessonRows(snapshot: WorkbookProgressSnapshot): WorkbookLessonRow[] {
  const unitOne = workbookCourse[0].lessons.map((lesson, index): WorkbookLessonRow => {
    const practice = snapshot.practice[index];
    const fields = practice
      ? filled({
          request: practice.request,
          observation: practice.observation,
          revision: practice.revision,
        })
      : {};
    const done = snapshot.completed.includes(index);
    return {
      classSlug: WORKBOOK_CLASS_SLUG,
      lesson: lesson.slug,
      status: done ? "done" : Object.keys(fields).length > 0 ? "in-progress" : "unstarted",
      mode: practice?.mode ?? null,
      fields,
    };
  });
  const plan = snapshot.project;
  const projectFields = [
    filled({
      audience: plan.audience,
      purpose: plan.purpose,
      title: plan.title,
      intro: plan.intro,
      content: plan.content,
      later: plan.later,
    }),
    filled({ request: plan.request }),
    filled({ observation: plan.observation }),
  ];
  const unitTwo = workbookCourse[1].lessons.map((lesson, index): WorkbookLessonRow => ({
    classSlug: WORKBOOK_CLASS_SLUG,
    lesson: lesson.slug,
    status: snapshot.projectDone[index]
      ? "done"
      : Object.keys(projectFields[index]).length > 0
        ? "in-progress"
        : "unstarted",
    mode: index === 0 ? null : plan.mode,
    fields: projectFields[index],
  }));
  return [...unitOne, ...unitTwo];
}

/** 1단원 여섯 수업을 모두 마쳤는지. `finishing`은 지금 마치는 중인 수업(아직 completed에 없을 수 있다). */
export function isUnitOneDone(completed: readonly number[], finishing?: number) {
  const done = new Set(completed);
  if (finishing !== undefined) done.add(finishing);
  return workbookCourse[0].lessons.every((_, index) => done.has(index));
}

/** 1단원에서 아직 마치지 않은 수업(정리 화면에서 "이것을 마치면 2단원이 열려요"에 쓴다). */
export function unitOneRemaining(completed: readonly number[], finishing?: number) {
  return workbookCourse[0].lessons.filter(
    (_, index) => index !== finishing && !completed.includes(index),
  );
}

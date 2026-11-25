import { workbookCourse, workbookExperienceStep } from "./workbook-course";

// 이전 추가 기록의 형태는 보존하되 기본 학습 완료 조건에 사용하지 않는다.
export type OwnExperience = {
  screens: boolean[];
  conditions: string;
  observation: string;
  decision: "improve" | "keep" | null;
  reason: string;
  request: string;
  changed: boolean;
  verified: boolean[];
  comparison: string;
  problem: string;
  principle: boolean;
};
export const emptyOwnExperience = (): OwnExperience => ({
  screens: [false, false],
  conditions: "",
  observation: "",
  decision: null,
  reason: "",
  request: "",
  changed: false,
  verified: [false, false, false],
  comparison: "",
  problem: "",
  principle: false,
});
export type ExperienceRecord = {
  mode?: "computer" | "example";
  /** 개념 수업(3-1 등)을 마치면 정리 화면에서 수업 주소를 남긴다. 예전 기록에는 없을 수 있다. */
  done?: string[];
  own?: OwnExperience;
  observation: string;
  request: string;
  comparison: string;
  before: boolean[];
  after: boolean[];
  applied: boolean;
  buttonChecked: boolean;
};
export const emptyExperience = (): ExperienceRecord => ({
  done: [],
  observation: "",
  request: "",
  comparison: "",
  before: [false, false],
  after: [false, false],
  applied: false,
  buttonChecked: false,
});
/** 3단원 수업마다 마쳤는지(수업 순서대로). 개념 수업은 done, 실습 세 수업은 예전처럼 기록에서 계산한다. */
export function experienceStepsDone(record: ExperienceRecord, completed: boolean): boolean[] {
  const progress = baseProgress(record);
  const S = workbookExperienceStep;
  return workbookCourse[2].lessons.map((lesson, index) => {
    if (index === S.observation) return progress.observed;
    if (index === S.improvement) return progress.requested;
    if (index === S.check) return completed;
    return (record.done ?? []).includes(lesson.slug);
  });
}
/**
 * 수업마다 열 수 있는지. 개념 수업(3-1 등)은 늘 열려 있고 실습 수업을 막지 않는다(수업 주소로 바로 들어와도
 * 열려야 하므로). 실습 세 수업은 예전처럼 관찰 → 요청 → 확인 순서로 열린다.
 */
export function experienceStepsAvailable(done: readonly boolean[]) {
  const S = workbookExperienceStep;
  return done.map((_, index) =>
    index === S.improvement ? done[S.observation] : index === S.check ? done[S.improvement] : true,
  );
}

function baseProgress(record: ExperienceRecord) {
  const observed = record.before.every(Boolean) && !!record.observation.trim();
  const requested = observed && !!record.request.trim();
  const verified =
    requested &&
    record.applied &&
    record.after.every(Boolean) &&
    record.buttonChecked &&
    !!record.comparison.trim();
  return { observed, requested, verified };
}
// 지도와 수업은 같은 선행 조건을 사용한다. 요청만 있어도 관찰을 건너뛰지 않는다.
export function experienceProgress(record: ExperienceRecord) {
  const base = baseProgress(record);
  return {
    ...base,
    available: experienceStepsAvailable(experienceStepsDone(record, base.verified)),
  };
}
export function availableExperienceStep(record: ExperienceRecord, step: number) {
  const available = experienceProgress(record).available;
  if (available[step]) return step;
  const last = available.lastIndexOf(true);
  return last < 0 ? 0 : last;
}

// 연습 조건을 실제 파일의 관찰로 단정하지 않는다.
export function makeExperienceRequest(observation: string) {
  return `소개 페이지 비교 연습에서 확인한 문제: ${observation.trim()}

연습 조건은 모바일 폭 280px, PC 폭 560px이며 페이지 내용은 560px 고정 너비야. 페이지 너비만 화면에 맞게 줄어들도록 바꿔줘.

제목·소개·목록의 내용과 ‘내용 보기’ 버튼의 목록 이동은 유지해줘. 다른 파일이나 기능은 바꾸지 마.

바꾼 뒤 두 폭에서 글·목록·버튼이 잘리지 않는지, 내용 보기 버튼이 같은 목록으로 이동하는지 다시 확인하고 달라진 점을 알려줘.`;
}

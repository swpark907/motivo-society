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
  observation: "",
  request: "",
  comparison: "",
  before: [false, false],
  after: [false, false],
  applied: false,
  buttonChecked: false,
});
// 지도와 수업은 같은 선행 조건을 사용한다. 요청만 있어도 관찰을 건너뛰지 않는다.
export function experienceProgress(record: ExperienceRecord) {
  const observed = record.before.every(Boolean) && !!record.observation.trim();
  const requested = observed && !!record.request.trim();
  const verified =
    requested &&
    record.applied &&
    record.after.every(Boolean) &&
    record.buttonChecked &&
    !!record.comparison.trim();
  return { observed, requested, verified, available: [true, observed, requested] };
}
export function availableExperienceStep(record: ExperienceRecord, step: number) {
  const progress = experienceProgress(record);
  return progress.available[step] ? step : progress.observed ? 1 : 0;
}

// 연습 조건을 실제 파일의 관찰로 단정하지 않는다.
export function makeExperienceRequest(observation: string) {
  return `소개 페이지 비교 연습에서 확인한 문제: ${observation.trim()}

연습 조건은 모바일 폭 280px, PC 폭 560px이며 페이지 내용은 560px 고정 너비야. 페이지 너비만 화면에 맞게 줄어들도록 바꿔줘.

제목·소개·목록의 내용과 ‘내용 보기’ 버튼의 목록 이동은 유지해줘. 다른 파일이나 기능은 바꾸지 마.

바꾼 뒤 두 폭에서 글·목록·버튼이 잘리지 않는지, 내용 보기 버튼이 같은 목록으로 이동하는지 다시 확인하고 달라진 점을 알려줘.`;
}

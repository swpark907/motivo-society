import { describe, expect, it } from "vitest";
import { classProjectSummary } from "./workbook-class-summary";
import {
  emptyProjectProgress,
  projectProgressReducer as reduce,
  learningUnits,
  projectStages,
  requiredCheckpoints,
  type ProgressState,
} from "./workbook-project-progress";
function confirm(state: ProgressState) {
  let next = state;
  for (const stage of projectStages)
    for (const key of requiredCheckpoints(next, stage))
      next = reduce(next, {
        type: "record",
        key,
        outcome: "confirmed",
        evidence: `${key}를 직접 확인`,
        projectId: next.projectId,
        revision: next.checkpoints[key].revision,
      });
  return next;
}
function complete() {
  let state = emptyProjectProgress();
  for (const unit of learningUnits)
    state = reduce(state, { type: "learn", unit, status: "confirmed", source: "example" });
  state = reduce(state, {
    type: "decide",
    branch: "experience",
    value: "keep",
    reason: "두 화면 확인",
  });
  for (const branch of ["details", "storage"] as const)
    state = reduce(state, {
      type: "decide",
      branch,
      value: "omit",
      reason: "현재 페이지의 범위 확인",
    });
  state = reduce(state, { type: "address", value: "https://example.org/my-page" });
  state = reduce(state, { type: "change", values: { plan: "원래 기획" } });
  return confirm(state);
}
describe("클래스 정리의 실제 결과 구분", () => {
  it("예시 학습과 이전 확인 문자열만으로 실제 완료를 만들지 않는다", () => {
    const state = reduce(emptyProjectProgress(), {
      type: "legacy",
      learned: learningUnits.map((unit) => ({ unit, source: "example" })),
      notes: {
        "application-publish.confirmed": "true",
        "application-publish.result": "공개했다고 남긴 이전 기록",
      },
    });
    const summary = classProjectSummary(state);
    expect(summary.confirmed).toHaveLength(0);
    expect(summary.remaining).toHaveLength(5);
    expect(summary.complete).toBe(false);
  });
  it("실제 확인 뒤 변경하면 이전 근거를 보존하며 남은 확인으로 옮긴다", () => {
    const original = complete();
    expect(classProjectSummary(original).complete).toBe(true);
    const changed = reduce(original, { type: "change", values: { layout: "새 배치" } });
    const summary = classProjectSummary(changed);
    expect(summary.complete).toBe(false);
    expect(summary.remaining.some((item) => item.status === "recheck")).toBe(true);
    expect(summary.remaining.flatMap((item) => item.evidence).length).toBeGreaterThan(0);
  });
  it("입력 중 기획을 이전 확인과 혼동하지 않고 원본 상태는 바꾸지 않는다", () => {
    const state = complete();
    const before = JSON.stringify(state);
    const summary = classProjectSummary(state, "바뀐 기획");
    expect(summary.confirmed.map((item) => item.stage)).toEqual(["setup"]);
    expect(summary.remaining.find((item) => item.stage === "project")?.status).toBe("recheck");
    expect(summary.complete).toBe(false);
    expect(JSON.stringify(state)).toBe(before);
  });
});

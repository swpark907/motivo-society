import { describe, expect, it } from "vitest";
import { emptyApplications } from "./workbook-application";
import {
  emptyProjectProgress,
  projectProgressReducer as reduce,
  learningUnits,
} from "./workbook-project-progress";
import { classProjectSummary } from "./workbook-class-summary";
import { applicationResultStatus, saveApplicationResult } from "./workbook-application-result";
const plan = "현재 기획";
function fixture() {
  const records = emptyApplications();
  for (const stage of ["experience", "data", "publish"] as const)
    records[stage] = {
      ...records[stage],
      mode: "applied",
      result: `${stage} 내 파일 결과`,
      problem: "확인한 범위에서 문제없음",
      evidence: "같은 파일의 두 화면과 버튼을 직접 확인",
    };
  return records;
}
describe("선택 적용 기록과 최종 정리 연결", () => {
  it("예시 학습·예전 confirmed·미완성 초안은 실제 목표로 세지 않는다", () => {
    let state = emptyProjectProgress();
    for (const unit of learningUnits)
      state = reduce(state, { type: "learn", unit, status: "confirmed", source: "example" });
    const records = fixture();
    records.experience.confirmed = true;
    expect(classProjectSummary(state, plan, records).confirmed).toHaveLength(0);
    records.data.evidence = "";
    records.data = saveApplicationResult(state, "data", plan, records, "confirmed");
    expect(records.data.review).toBeUndefined();
    expect(classProjectSummary(state, plan, records).complete).toBe(false);
  });
  it("3·4단원의 명시적 본인 확인은 결과에 넣고 해당 남은 확인을 해소한다", () => {
    const state = emptyProjectProgress();
    const records = fixture();
    for (const stage of ["experience", "data"] as const)
      records[stage] = saveApplicationResult(state, stage, plan, records, "confirmed");
    const result = classProjectSummary(state, plan, records);
    expect(result.confirmed.map((item) => item.stage)).toEqual(["experience", "data"]);
    expect(result.remaining.map((item) => item.stage)).toEqual(["setup", "project", "publish"]);
    expect(result.confirmed[0].evidence).toContain("experience 내 파일 결과");
    expect(state.checkpoints["experience.verified"].outcome).toBe("unverified");
  });
  it("문제가 남은 기록은 실제 결과와 남은 일에 함께 남긴다", () => {
    const state = emptyProjectProgress();
    const records = fixture();
    records.experience.problem = "긴 링크가 잘려요";
    records.experience = saveApplicationResult(state, "experience", plan, records, "waiting");
    const result = classProjectSummary(state, plan, records);
    expect(result.confirmed).toHaveLength(0);
    expect(result.applications[0].result).toBe("experience 내 파일 결과");
    expect(result.remaining.find((item) => item.stage === "experience")).toMatchObject({
      status: "waiting",
      task: "긴 링크가 잘려요",
    });
  });
  it("공개 단원의 범용 적용 확인과 주소 문자열로 최종 공개·재배포 완료를 만들지 않는다", () => {
    const state = emptyProjectProgress();
    const records = fixture();
    records.publish.location = "https://example.org/my-page";
    records.publish = saveApplicationResult(state, "publish", plan, records, "confirmed");
    const result = classProjectSummary(state, plan, records);
    expect(result.applications[0].status).toBe("confirmed");
    expect(result.remaining.find((item) => item.stage === "publish")).toMatchObject({
      status: "in-progress",
    });
    expect(result.complete).toBe(false);
    expect(state.publicUrl).toBe("");
  });
  it("기록·기획·작업 변경과 다른 프로젝트는 재확인하며 원문은 보존한다", () => {
    const state = emptyProjectProgress();
    const records = fixture();
    records.experience = saveApplicationResult(state, "experience", plan, records, "confirmed");
    const previous = records.experience.review;
    const edited = {
      ...records,
      experience: {
        ...records.experience,
        result: "아직 확인하지 않은 수정 결과",
        confirmed: false,
      },
    };
    expect(applicationResultStatus(state, "experience", plan, edited)).toBe("recheck");
    expect(edited.experience.review).toEqual(previous);
    expect(applicationResultStatus(state, "experience", "새 기획", records)).toBe("recheck");
    expect(
      applicationResultStatus(
        reduce(state, { type: "change", values: { layout: "수정" } }),
        "experience",
        plan,
        records,
      ),
    ).toBe("recheck");
    expect(
      applicationResultStatus(
        reduce(state, { type: "project", projectId: "other" }),
        "experience",
        plan,
        records,
      ),
    ).toBe("recheck");
    edited.experience = saveApplicationResult(state, "experience", plan, edited, "confirmed");
    expect(applicationResultStatus(state, "experience", plan, edited)).toBe("confirmed");
  });
  it("상류 실제 기록 수정은 뒤 결과의 재확인을 요구하고 예시 학습 변경은 영향을 주지 않는다", () => {
    const state = emptyProjectProgress();
    const records = fixture();
    for (const stage of ["experience", "data", "publish"] as const)
      records[stage] = saveApplicationResult(state, stage, plan, records, "confirmed");
    const learned = reduce(state, {
      type: "learn",
      unit: "ai-1",
      status: "confirmed",
      source: "example",
    });
    expect(applicationResultStatus(learned, "data", plan, records)).toBe("confirmed");
    records.experience = { ...records.experience, problem: "다른 문제 발견", confirmed: false };
    expect(applicationResultStatus(state, "data", plan, records)).toBe("recheck");
    expect(applicationResultStatus(state, "publish", plan, records)).toBe("recheck");
  });
});

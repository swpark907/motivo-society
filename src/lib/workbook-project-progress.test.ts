import { describe, expect, it } from "vitest";
import {
  checkpointStatus,
  emptyProjectProgress,
  learningUnits,
  projectProgress,
  projectProgressReducer as reduce,
  projectStages,
  requiredCheckpoints,
  stageProgress,
  type CheckpointKey,
  type ProgressState,
} from "./workbook-project-progress";
function confirm(state: ProgressState, key: CheckpointKey) {
  return reduce(state, {
    type: "record",
    key,
    outcome: "confirmed",
    evidence: `${key} 직접 확인`,
    projectId: state.projectId,
    revision: state.checkpoints[key].revision,
  });
}
function learn(state: ProgressState) {
  for (const unit of learningUnits)
    state = reduce(state, { type: "learn", unit, status: "confirmed", source: "example" });
  return state;
}
function ready(
  experience: "keep" | "improve" = "keep",
  details: "apply" | "omit" = "omit",
  storage: "apply" | "omit" = "omit",
) {
  let state = learn(emptyProjectProgress());
  state = reduce(state, {
    type: "decide",
    branch: "experience",
    value: experience,
    reason: "두 화면의 읽기·행동 확인",
  });
  state = reduce(state, {
    type: "decide",
    branch: "details",
    value: details,
    reason: "방문자에게 필요한 설명 판단",
  });
  state = reduce(state, {
    type: "decide",
    branch: "storage",
    value: storage,
    reason: "재방문에 남길 선택 판단",
  });
  state = reduce(state, { type: "address", value: "https://my-page.vercel.app" });
  for (const stage of projectStages)
    for (const key of requiredCheckpoints(state, stage)) state = confirm(state, key);
  return state;
}
describe("학습과 실제 프로젝트의 독립적인 판정", () => {
  it("예시 전 과정과 기존 본인 기록으로 실제 성공을 만들지 않는다", () => {
    const state = reduce(emptyProjectProgress(), {
      type: "legacy",
      learned: learningUnits.map((unit) => ({ unit, source: "example" })),
      notes: { "application-publish.confirmed": "true", "application-publish.result": "공개함" },
    });
    expect(projectProgress(state).learned).toHaveLength(9);
    expect(projectProgress(state).complete).toBe(false);
    expect(stageProgress(state, "publish").status).toBe("unstarted");
  });
  it("빈 근거·주소 입력·미충족 결과는 실제 확인이 아니다", () => {
    let state = reduce(emptyProjectProgress(), {
      type: "address",
      value: "https://my-page.vercel.app",
    });
    state = reduce(state, {
      type: "record",
      key: "setup.folder",
      outcome: "confirmed",
      evidence: " ",
      projectId: "current",
      revision: 0,
    });
    expect(checkpointStatus(state, "setup.folder")).toBe("unstarted");
    state = reduce(state, {
      type: "record",
      key: "setup.folder",
      outcome: "attempted",
      evidence: "아직 연결 안 됨",
      projectId: "current",
      revision: 0,
    });
    expect(checkpointStatus(state, "setup.folder")).toBe("in-progress");
    expect(projectProgress(state).complete).toBe(false);
  });
  it.each(["keep", "improve"] as const)("3단원 %s 경로를 자기 분기 조건으로 판단한다", (branch) => {
    const state = ready(branch);
    expect(projectProgress(state).complete).toBe(true);
    expect(requiredCheckpoints(state, "experience").includes("experience.request")).toBe(
      branch === "improve",
    );
  });
  it.each([
    ["apply", "apply"],
    ["apply", "omit"],
    ["omit", "apply"],
    ["omit", "omit"],
  ] as const)("상세 %s·저장 %s를 독립적으로 인정한다", (details, storage) => {
    const state = ready("keep", details, storage);
    expect(projectProgress(state).complete).toBe(true);
    expect(requiredCheckpoints(state, "publish").includes("publish.storage")).toBe(
      storage === "apply",
    );
    expect(requiredCheckpoints(state, "data")).toContain(
      details === "apply" ? "data.details" : "data.details-omitted",
    );
  });
  it("생략 이유·분기 선택이 없으면 확인만으로 통과하지 않는다", () => {
    let state = ready();
    state = reduce(state, { type: "decide", branch: "details", value: "omit", reason: " " });
    state = confirm(state, "data.details-omitted");
    expect(stageProgress(state, "data").status).not.toBe("confirmed");
    expect(projectProgress(state).complete).toBe(false);
  });
  it.each([
    "publish.deployed",
    "publish.anonymous",
    "publish.device",
    "publish.shared",
    "publish.redeployed",
    "publish.current",
  ] as const)("%s 미확인이면 최종 완료가 아니다", (key) => {
    const state = ready();
    const pending = reduce(state, { type: "obstacle", key, reason: "환경·공유 확인 대기" });
    expect(projectProgress(pending).complete).toBe(false);
    expect(stageProgress(pending, "publish").status).toBe("waiting");
    expect(pending.checkpoints[key].confirmation).toEqual(state.checkpoints[key].confirmation);
  });
  it("공유 대기 중에도 독립적인 재배포를 기록하고 회신 없이 완료한다", () => {
    let state = reduce(ready(), { type: "obstacle", key: "publish.shared", reason: "공유 대기" });
    state = confirm(state, "publish.redeployed");
    expect(checkpointStatus(state, "publish.redeployed")).toBe("confirmed");
    expect(projectProgress(state).complete).toBe(false);
    state = confirm(state, "publish.shared");
    expect(projectProgress(state).complete).toBe(true);
  });
  it.each([
    "file:///tmp/a.html",
    "http://localhost:3000",
    "https://localhost",
    "https://127.0.0.1",
    "not a url",
    "https://lesson.invalid",
  ])("%s는 공개 대표 주소가 아니다", (value) => {
    let state = reduce(ready(), { type: "address", value });
    for (const key of requiredCheckpoints(state, "publish")) state = confirm(state, key);
    expect(projectProgress(state).complete).toBe(false);
  });
});
describe("기록 보존과 변경 영향", () => {
  it("실제 단원 메모는 진행 중으로 표시하되 성공을 만들지 않는다", () => {
    const state = reduce(emptyProjectProgress(), {
      type: "note",
      key: "request",
      stage: "experience",
      text: "수정 요청 초안",
    });
    expect(stageProgress(state, "experience").status).toBe("in-progress");
    expect(projectProgress(state).complete).toBe(false);
  });
  it("기록·요청 초안·경로 표기 편집은 성공을 취소하지 않는다", () => {
    let state = ready();
    state = reduce(state, { type: "note", key: "request", text: "미적용 수정 요청" });
    state = reduce(state, { type: "location", value: "my-first-web/index.html" });
    expect(projectProgress(state).complete).toBe(true);
  });
  it("내용 변경은 결과 원문과 학습·공유·저장 확인을 보존하고 해당 화면만 재확인한다", () => {
    const before = ready("keep", "apply", "apply");
    const after = reduce(before, { type: "change", values: { content: "소개 수정본" } });
    expect(after.learning).toEqual(before.learning);
    expect(after.checkpoints["experience.kept"].evidence).toBe(
      before.checkpoints["experience.kept"].evidence,
    );
    expect(checkpointStatus(after, "experience.kept")).toBe("recheck");
    expect(checkpointStatus(after, "publish.shared")).toBe("confirmed");
    expect(checkpointStatus(after, "data.storage")).toBe("confirmed");
    expect(projectProgress(after).status).toBe("recheck");
    expect(reduce(after, { type: "change", values: { content: "소개 수정본" } })).toBe(after);
    expect(before.checkpoints["experience.kept"].revision).toBe(1);
  });
  it("영향 범주를 합치되 같은 확인 버전은 한 번만 변경한다", () => {
    const before = ready();
    const after = reduce(before, { type: "change", values: { content: "v1", layout: "v1" } });
    expect(after.checkpoints["experience.kept"].revision).toBe(
      before.checkpoints["experience.kept"].revision + 1,
    );
  });
  it("미확인 선행은 뒤 결과를 삭제하지 않고 앞 확인만 복구하면 다시 유효하다", () => {
    const before = ready();
    let state = reduce(before, {
      type: "obstacle",
      key: "project.content",
      reason: "내용 확인 중",
    });
    expect(stageProgress(state, "publish").status).toBe("recheck");
    expect(state.checkpoints["publish.current"]).toEqual(before.checkpoints["publish.current"]);
    state = confirm(state, "project.content");
    expect(projectProgress(state).complete).toBe(true);
  });
  it("실제 파일 변경 후에는 앞만 확인해도 뒤를 자동 성공으로 바꾸지 않는다", () => {
    let state = reduce(ready(), { type: "change", values: { content: "v2" } });
    state = confirm(confirm(state, "project.content"), "project.actions");
    expect(stageProgress(state, "project").status).toBe("confirmed");
    expect(stageProgress(state, "publish").status).toBe("recheck");
  });
  it("분기를 왕복해도 이전 원문은 남지만 성공이 자동 복원되지 않는다", () => {
    const before = ready();
    let state = reduce(before, {
      type: "decide",
      branch: "experience",
      value: "improve",
      reason: "개선 선택",
    });
    state = reduce(state, {
      type: "decide",
      branch: "experience",
      value: "keep",
      reason: "두 화면의 읽기·행동 확인",
    });
    expect(state.checkpoints["experience.kept"].evidence).toBe(
      before.checkpoints["experience.kept"].evidence,
    );
    expect(stageProgress(state, "experience").status).toBe("recheck");
    expect(checkpointStatus(state, "publish.shared")).toBe("confirmed");
  });
  it("같은 주소의 새 배포는 공유를 유지하고 새 주소는 공유도 재확인한다", () => {
    const state = ready();
    expect(
      checkpointStatus(
        reduce(state, { type: "change", values: { deployment: "deploy-2" } }),
        "publish.shared",
      ),
    ).toBe("confirmed");
    expect(
      checkpointStatus(
        reduce(state, { type: "address", value: "https://new.vercel.app" }),
        "publish.shared",
      ),
    ).toBe("recheck");
    expect(reduce(state, { type: "address", value: state.publicUrl })).toBe(state);
  });
  it("늦은 확인과 다른 프로젝트의 확인이 최신 상태를 덮어쓰지 않는다", () => {
    const before = ready();
    const after = reduce(before, { type: "change", values: { layout: "v2" } });
    expect(
      reduce(after, {
        type: "record",
        key: "experience.kept",
        outcome: "confirmed",
        evidence: "이전 화면",
        projectId: "current",
        revision: before.checkpoints["experience.kept"].revision,
      }),
    ).toBe(after);
    const switched = reduce(after, { type: "project", projectId: "different" });
    expect(switched.checkpoints).not.toEqual(after.checkpoints);
    expect(switched.learning).toEqual(after.learning);
    expect(projectProgress(switched).complete).toBe(false);
    expect(
      reduce(switched, {
        type: "record",
        key: "setup.file",
        outcome: "confirmed",
        evidence: "이전 파일",
        projectId: "current",
        revision: switched.checkpoints["setup.file"].revision,
      }),
    ).toBe(switched);
  });
  it("기존 학습 동기화가 명시적으로 재확인 중인 학습을 다시 완료로 올리지 않는다", () => {
    const imported = reduce(emptyProjectProgress(), {
      type: "legacy",
      learned: [{ unit: "ai-1", source: "example" }],
      notes: {},
    });
    const revised = reduce(imported, { type: "learn", unit: "ai-1", status: "in-progress" });
    const synced = reduce(revised, {
      type: "legacy",
      learned: [{ unit: "ai-1", source: "example" }],
      notes: { title: "기록 수정" },
    });
    expect(synced.learning["ai-1"].status).toBe("in-progress");
  });
  it("학습 순서를 건너뛰지 않고 출처 없는 완료를 만들지 않는다", () => {
    const state = emptyProjectProgress();
    expect(
      reduce(state, { type: "learn", unit: "publish", status: "confirmed", source: "example" }),
    ).toBe(state);
    expect(reduce(state, { type: "learn", unit: "ai-1", status: "confirmed" })).toBe(state);
  });
  it("근거를 지우면 이전 확인 근거는 남고 현재 성공은 해제된다", () => {
    const state = ready();
    const cleared = reduce(state, {
      type: "record",
      key: "project.content",
      outcome: "attempted",
      evidence: "",
      projectId: "current",
      revision: state.checkpoints["project.content"].revision,
    });
    expect(cleared.checkpoints["project.content"].confirmation).toEqual(
      state.checkpoints["project.content"].confirmation,
    );
    expect(stageProgress(cleared, "project").status).not.toBe("confirmed");
  });
  it("기존 화면의 초기화가 보존한 원문과 학습을 삭제하지 않는다", () => {
    const state = reduce(emptyProjectProgress(), {
      type: "legacy",
      learned: [{ unit: "ai-1", source: "example" }],
      notes: { "project.title": "내 초안" },
    });
    const after = reduce(state, { type: "legacy", learned: [], notes: { "project.title": "" } });
    expect(after.notes["legacy:project.title"].text).toBe("내 초안");
    expect(after.learning["ai-1"].status).toBe("confirmed");
  });
  it("학습 정리를 수정해도 열린 뒤 단원을 잠그지 않고 실제 확인은 유지한다", () => {
    const before = ready();
    const after = reduce(before, { type: "learn", unit: "project", status: "in-progress" });
    expect(after.learning.experience.opened).toBe(true);
    expect(stageProgress(after, "publish").status).toBe("confirmed");
    expect(projectProgress(after).complete).toBe(false);
  });
});

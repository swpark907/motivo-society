import {
  applicationResultStatus,
  type ApplicationRecords,
  type ConnectedStage,
} from "./workbook-application-result";
import {
  projectProgress,
  projectStages,
  requiredCheckpoints,
  type ProgressState,
  type ProjectStage,
  type StageStatus,
} from "./workbook-project-progress";

const goals: Record<ProjectStage, [string, string]> = {
  setup: ["첫 파일", "같은 폴더의 파일을 만들고 열어 수정한 결과 확인"],
  project: ["내 기획의 첫 화면", "내 기획의 제목·소개·내용과 버튼 확인"],
  experience: ["두 화면 확인", "PC·모바일에서 읽기와 주요 행동 확인"],
  data: ["동작·저장 범위", "내 페이지에 필요한 동작과 저장 범위 확인"],
  publish: ["공개·재배포", "공개 주소 접속·공유·수정 후 같은 주소의 재배포 확인"],
};
export const actualStatusLabels: Record<StageStatus, string> = {
  unstarted: "실제 확인 기록 없음",
  "in-progress": "실제 확인 진행 중",
  waiting: "남은 확인·문제 있음",
  recheck: "변경 후 재확인 필요",
  confirmed: "본인 확인 기록 있음",
};

// 공통 실제 결과와 명시적으로 확인한 선택 적용 기록을 읽는다. 이전 confirmed·첨부·예시는 승격하지 않는다.
export function classProjectSummary(
  state: ProgressState,
  currentPlan?: string,
  applications?: ApplicationRecords,
) {
  const progress = projectProgress(state);
  const changedPlan = Boolean(
    currentPlan && state.changes.plan && currentPlan !== state.changes.plan,
  );
  const items = projectStages.map((stage) => {
    const original = progress.stages[stage];
    let status: StageStatus =
      changedPlan && stage !== "setup" && original.status === "confirmed"
        ? "recheck"
        : original.status;
    const evidence = [
      ...new Set(
        requiredCheckpoints(state, stage)
          .map(
            (key) =>
              state.checkpoints[key].confirmation?.evidence || state.checkpoints[key].evidence,
          )
          .filter((text) => text.trim()),
      ),
    ];
    const connected = stage === "experience" || stage === "data" || stage === "publish";
    const record = connected && applications ? applications[stage] : null;
    const reviewStatus =
      connected && applications
        ? applicationResultStatus(state, stage, currentPlan ?? "", applications)
        : null;
    // 공개 단원의 범용 적용 기록은 공유·재배포 전체 확인을 대신하지 않는다.
    if (reviewStatus) {
      if (stage !== "publish" || reviewStatus !== "confirmed") status = reviewStatus;
      else if (status !== "confirmed") status = "in-progress";
      if (reviewStatus === "confirmed" && record) evidence.push(record.result, record.evidence);
    }
    return {
      stage,
      title: goals[stage][0],
      status,
      evidence,
      prerequisite: original.prerequisite,
      applicationStatus: reviewStatus,
      application: record?.review
        ? {
            stage: stage as ConnectedStage,
            status: reviewStatus!,
            ...record.review.values,
          }
        : null,
      task:
        stage === "publish" && reviewStatus === "confirmed"
          ? "적용 결과는 기록했어요. 공개 주소 접속·공유·수정 후 같은 주소의 재배포는 별도로 확인해요."
          : reviewStatus === "waiting" && record
            ? record.problem
            : reviewStatus === "recheck"
              ? "기록이나 작업 기준이 바뀌었어요. 현재 파일에서도 같은 결과인지 다시 확인해요."
              : goals[stage][1],
    };
  });
  return {
    items,
    confirmed: items.filter((item) => item.status === "confirmed"),
    remaining: items.filter((item) => item.status !== "confirmed"),
    complete:
      progress.complete && !changedPlan && items.every((item) => item.status === "confirmed"),
    applications: items.flatMap((item) => (item.application ? [item.application] : [])),
    changedPlan,
  };
}

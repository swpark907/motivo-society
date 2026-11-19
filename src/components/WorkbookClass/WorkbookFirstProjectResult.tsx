"use client";

// 1·2단원의 실제 파일 결과만 명시적으로 기록한다. 예시 조작·학습 완료로 승격하지 않는다.
import { useWorkbookProgress } from "./WorkbookProgressContext";
import { requiredCheckpoints, stageProgress } from "@/lib/workbook-project-progress";

const labels = {
  unstarted: "실제 적용 전",
  "in-progress": "실제 적용 진행 중",
  waiting: "실제 확인 대기",
  confirmed: "목표 결과 확인 · 본인 기록",
  recheck: "변경 후 재확인 필요",
};
export function WorkbookFirstProjectStatus({ stage }: { stage: "setup" | "project" }) {
  const { projectWorkflow, project } = useWorkbookProgress();
  const draftChanged =
    stage === "project" &&
    projectWorkflow.changes.plan &&
    projectWorkflow.changes.plan !==
      JSON.stringify([
        project.title,
        project.audience,
        project.purpose,
        project.intro,
        project.content,
      ]);
  return (
    <p aria-live="polite" data-testid={`first-project-${stage}-status`}>
      내 프로젝트 ·{" "}
      {draftChanged
        ? "입력 중 기획 · 이전 작업 기준의 기록 보존"
        : labels[stageProgress(projectWorkflow, stage).status]}
    </p>
  );
}
// 기존 체크와 관찰을 마지막 계속하기에서 함께 저장한다. 예시 결과는 승격하지 않는다.
export function useRecordFirstProjectResult() {
  const p = useWorkbookProgress();
  return (
    stage: "setup" | "project",
    computer: boolean,
    checksReady: boolean,
    evidence: string,
    planReady = true,
  ) => {
    if (!computer || !evidence.trim()) return;
    const prerequisite =
      stage === "setup" || stageProgress(p.projectWorkflow, "setup").status === "confirmed";
    const outcome = checksReady && planReady && prerequisite ? "confirmed" : "attempted";
    const problem =
      outcome === "confirmed"
        ? ""
        : !prerequisite
          ? "같은 폴더의 첫 파일 확인이 남아 있어요."
          : !planReady
            ? "현재 기획과 요청의 확인이 남아 있어요."
            : evidence;
    for (const key of requiredCheckpoints(p.projectWorkflow, stage)) {
      p.dispatchProjectWorkflow({
        type: "record",
        key,
        outcome,
        evidence,
        projectId: p.projectWorkflow.projectId,
        revision: p.projectWorkflow.checkpoints[key].revision,
      });
      p.dispatchProjectWorkflow({ type: "obstacle", key, reason: problem });
    }
    if (stage === "project")
      p.setApplications((previous) => ({
        ...previous,
        project: {
          ...previous.project,
          mode: "applied",
          result: evidence,
          evidence,
          problem: problem || "확인한 범위에서 목표를 충족함",
          request: p.project.request,
          location: p.projectWorkflow.location || "my-first-web/index.html",
          confirmed: outcome === "confirmed",
        },
      }));
  };
}

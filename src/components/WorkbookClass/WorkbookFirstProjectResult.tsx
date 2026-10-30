"use client";

// 1·2단원의 실제 파일 결과만 명시적으로 기록한다. 예시 조작·학습 완료로 승격하지 않는다.
import { useWorkbookProgress } from "./WorkbookProgressContext";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { requiredCheckpoints, stageProgress } from "@/lib/workbook-project-progress";
import styles from "./WorkbookClass.module.scss";

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
export function WorkbookFirstProjectResult({
  stage,
  computer,
  checksReady,
  evidence,
  planReady = true,
  className,
  confirmationMessage,
}: {
  stage: "setup" | "project";
  computer: boolean;
  checksReady: boolean;
  evidence: string;
  planReady?: boolean;
  className?: string;
  confirmationMessage?: string;
}) {
  const p = useWorkbookProgress();
  const [previousProblem] = useWorkbookLessonState(`first-problem-${stage}`, "");
  const hasActualRecord = Object.entries(p.projectWorkflow.checkpoints).some(
    ([key, checkpoint]) =>
      key.startsWith(`${stage}.`) &&
      (checkpoint.outcome !== "unverified" ||
        !!checkpoint.confirmation ||
        !!checkpoint.evidence.trim() ||
        !!checkpoint.obstacle.trim()),
  );
  const prerequisite =
    stage === "setup" || stageProgress(p.projectWorkflow, "setup").status === "confirmed";
  return (
    <section
      className={className ?? styles.purposeConnection}
      aria-label={stage === "setup" ? "첫 파일 실제 적용" : "자기 초안 실제 적용"}
    >
      <WorkbookFirstProjectStatus stage={stage} />
      {previousProblem.trim() && (
        <details>
          <summary>이전에 적은 문제 기록 보기</summary>
          <p>{previousProblem}</p>
        </details>
      )}
      <p>
        {!computer
          ? hasActualRecord
            ? "예시 복습으로 남겨요. 실제 파일 제작 기록은 그대로 보존해요."
            : "예시 복습으로 남겨요. 실제 파일 제작 완료를 뜻하지 않아요."
          : checksReady && planReady && prerequisite
            ? (confirmationMessage ??
              "계속하기를 누르면 위 체크와 관찰을 실제 파일의 본인 확인으로 함께 저장해요.")
            : "미확인 항목은 실제 결과 대기로 남겨요. 확인한 점이나 남은 문제를 위 관찰에 적고 학습을 계속할 수 있어요."}
      </p>
      {computer && !prerequisite && (
        <p>
          첫 파일 확인이 남았어요. 초안 기록은 보존하며 실제 목표는 첫 파일부터 확인해요.{" "}
          <button className={styles.quiet} onClick={() => p.setLesson(4)}>
            첫 파일 확인으로 →
          </button>
        </p>
      )}
      {stageProgress(p.projectWorkflow, stage).status === "recheck" && (
        <details>
          <summary>이전 확인 기록 보기</summary>
          <p>
            {p.projectWorkflow.checkpoints[stage === "setup" ? "setup.opened" : "project.content"]
              .confirmation?.evidence || evidence}
          </p>
        </details>
      )}
    </section>
  );
}

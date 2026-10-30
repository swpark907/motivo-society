import { WorkbookFirstProjectStatus } from "./WorkbookFirstProjectResult";
import { applicationStatus } from "@/lib/workbook-application";
import { stageProgress } from "@/lib/workbook-project-progress";
import { getWorkbookPurpose } from "@/lib/workbook-purpose";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookClass.module.scss";

// 화면 캡처나 파일을 추측하지 않는다. 입력한 기획과 출처를 구분한 본인 기록만 함께 보여준다.
export function WorkbookOutcome({ stage }: { stage: "project" | "experience" }) {
  const { purpose, project, experience, applications, projectWorkflow } = useWorkbookProgress();
  const goal = getWorkbookPurpose(purpose);
  const applied = applications[stage];
  const contentLines = project.content.split("\n").filter((line) => line.trim());
  const actual =
    stage === "project"
      ? stageProgress(projectWorkflow, "project").status === "confirmed"
      : applied.mode === "applied" && applied.confirmed;
  return (
    <section
      id={`workbook-outcome-${stage}`}
      className={styles.outcome}
      aria-label="내 결과물과 바뀐 점"
    >
      <span className="label">
        {stage === "project" ? "MY FIRST PAGE" : "MY PAGE · BEFORE & AFTER"}
      </span>
      <h2>{stage === "project" ? "내 첫 화면과 확인한 점" : "내 결과물과 바뀐 점"}</h2>
      <p>
        <strong>{goal.goal}</strong>
        <br />
        {project.purpose}
      </p>
      <div className={styles.outcomeGrid}>
        <article className={styles.outcomePage}>
          <small>내가 입력한 기획 구성 · 실제 파일의 화면 캡처가 아니에요</small>
          <h3>{project.title}</h3>
          <p>{project.intro}</p>
          <ul>
            {contentLines.slice(0, 3).map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
          {contentLines.length > 3 && (
            <details>
              <summary>나머지 {contentLines.length - 3}개 내용 보기</summary>
              <ul>
                {contentLines.slice(3).map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </details>
          )}
          <small>읽을 사람 · {project.audience}</small>
        </article>
        <div className={styles.outcomeRecords}>
          <article>
            <h3>{stage === "project" ? "첫 화면에서 확인한 점" : "수정 전 · 관찰한 문제"}</h3>
            <p>
              {(stage === "project" ? project.observation : experience.observation) ||
                "아래 활동에서 확인한 내용을 직접 기록해요."}
            </p>
            <small>
              {stage === "project" && project.mode === "computer"
                ? "외부 도구 실습 · 본인 관찰"
                : "학습 예시·기획 미리보기 관찰"}
            </small>
          </article>
          {stage === "experience" && (
            <article>
              <h3>수정 후 · 내가 기록한 변화</h3>
              <p>
                {experience.comparison ||
                  "수정한 예시를 두 화면에서 비교하고 달라진 점을 아래에 적어요."}
              </p>
              <small>페이지 너비 비교 예시 · 실제 파일 수정 결과는 별도</small>
            </article>
          )}
          <article>
            <h3>내 파일에 직접 적용한 결과</h3>
            <p>
              {actual
                ? stage === "project"
                  ? projectWorkflow.checkpoints["project.content"].confirmation?.evidence ||
                    applied.result
                  : applied.result
                : stage === "project" && projectWorkflow.checkpoints["project.content"].confirmation
                  ? `이전 기준의 확인 기록: ${projectWorkflow.checkpoints["project.content"].confirmation.evidence}`
                  : "직접 확인한 결과를 기록하면 여기에 함께 보여요."}
            </p>
            {stage === "project" ? (
              <WorkbookFirstProjectStatus stage="project" />
            ) : (
              <small>{applicationStatus(applied)}</small>
            )}
            {actual && applied.location && <p>확인한 파일명 또는 주소 · {applied.location}</p>}
          </article>
        </div>
      </div>
      <details>
        <summary>제작·수정 요청과 확인 근거 보기</summary>
        {stage === "project" && project.request && (
          <>
            <h3>내 제작 요청</h3>
            <p className={styles.requestExample}>{project.request}</p>
          </>
        )}
        {stage === "experience" && experience.request && (
          <>
            <h3>예시 비교를 위한 수정 요청</h3>
            <p className={styles.requestExample}>{experience.request}</p>
          </>
        )}
        {actual && (
          <>
            <h3>내 파일의 본인 확인 근거</h3>
            <p className={styles.requestExample}>{applied.evidence}</p>
            <h3>남은 문제</h3>
            <p>{applied.problem}</p>
          </>
        )}
      </details>
      <p>
        <strong>이번에 배운 내용</strong>
        <br />
        {stage === "project"
          ? "목적·독자·내용을 제작 요청에 연결하고 첫 화면을 확인하는 흐름을 익혀요."
          : "문제를 관찰하고 한 부분의 수정을 요청한 뒤, 두 화면과 버튼을 다시 확인해요."}
      </p>
      <p>
        <strong>다음에 할 일</strong>
        <br />
        {stage === "project"
          ? "같은 지도에서 반응형 화면 만들기로 이어가 작은 화면의 한 부분을 고쳐봐요."
          : "다음 지도에서 기능과 데이터 저장을 살펴봐요. 내 파일에도 해보고 싶다면 선택 실습 안내를 펼쳐볼 수 있어요."}
      </p>
    </section>
  );
}

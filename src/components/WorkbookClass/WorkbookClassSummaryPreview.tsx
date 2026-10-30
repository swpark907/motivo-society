"use client";

// 격리된 UI 검토 기록이다. 실제 진도·외부 파일·공개 주소를 확인하지 않는다.
import { useState } from "react";
import { WorkbookProgressPreviewProvider, useWorkbookProgress } from "./WorkbookProgressContext";
import { WorkbookReview } from "./WorkbookReview";
import { emptyProject } from "./WorkbookProjectLesson";
import { emptyExperience } from "@/lib/workbook-experience";
import { workbookPlanExample } from "@/lib/workbook-page-plan";
import {
  projectProgressReducer,
  learningUnits,
  projectStages,
  requiredCheckpoints,
  type ProgressAction,
} from "@/lib/workbook-project-progress";
import { emptyApplications } from "@/lib/workbook-application";
import style from "./WorkbookCompletionPreview.module.scss";
import base from "./WorkbookClass.module.scss";

const scenarios = {
  learning: "예시 학습만",
  legacy: "이전 확인 기록",
  partial: "일부 실제 확인",
  recheck: "변경 후 재확인",
  complete: "전체 실제 확인",
};
type Scenario = keyof typeof scenarios;
const records = {
  project: {
    ...emptyProject(),
    ...workbookPlanExample,
    mode: "example" as const,
    observation: "기획 예시의 제목과 목록을 살펴봤어요.",
  },
  experience: { ...emptyExperience(), comparison: "좁은 폭의 예시가 화면 안에 들어왔어요." },
};
export function WorkbookClassSummaryPreview() {
  const [scenario, setScenario] = useState<Scenario>("learning");
  return (
    <main
      className={base.page}
      data-learning="true"
      style={{
        height: "calc(100dvh - 60px)",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <nav
        className={style.controls}
        style={{ margin: 0, padding: 8 }}
        aria-label="클래스 정리 검토 상태"
      >
        {(Object.keys(scenarios) as Scenario[]).map((key) => (
          <button key={key} aria-pressed={scenario === key} onClick={() => setScenario(key)}>
            {scenarios[key]}
          </button>
        ))}
      </nav>
      <WorkbookProgressPreviewProvider key={scenario} records={records}>
        <Preview scenario={scenario} />
      </WorkbookProgressPreviewProvider>
    </main>
  );
}
function Preview({ scenario }: { scenario: Scenario }) {
  const p = useWorkbookProgress();
  const [opened, setOpened] = useState(false);
  function seed() {
    p.setDataCompleted(true);
    p.setPublishCompleted(true);
    let state = p.projectWorkflow;
    function dispatch(action: ProgressAction) {
      state = projectProgressReducer(state, action);
      p.dispatchProjectWorkflow(action);
    }
    for (const unit of learningUnits)
      dispatch({ type: "learn", unit, status: "confirmed", source: "example" });
    if (scenario === "legacy") {
      const apps = emptyApplications();
      for (const stage of Object.keys(apps) as (keyof typeof apps)[])
        apps[stage] = {
          ...apps[stage],
          mode: "applied",
          confirmed: true,
          result: "이전 양식의 본인 기록",
          evidence: "이전 양식에서 직접 확인했다고 남긴 기록",
        };
      for (const app of Object.values(apps)) app.result = "이전 양식에서 직접 적용했다고 남긴 결과";
      p.setApplications(apps);
    }
    if (scenario === "partial" || scenario === "recheck" || scenario === "complete") {
      dispatch({
        type: "change",
        values: {
          plan: JSON.stringify([
            p.project.title,
            p.project.audience,
            p.project.purpose,
            p.project.intro,
            p.project.content,
          ]),
        },
      });
      dispatch({ type: "location", value: "my-first-web/index.html" });
      if (scenario === "complete") {
        dispatch({
          type: "decide",
          branch: "experience",
          value: "keep",
          reason: "두 폭에서 읽기와 동작 확인",
        });
        for (const branch of ["details", "storage"] as const)
          dispatch({
            type: "decide",
            branch,
            value: "omit",
            reason: "현재 소개 범위에서 불필요함을 확인",
          });
        dispatch({ type: "address", value: "https://example.org/my-page" });
      }
      for (const stage of projectStages.filter(
        (stage) => scenario === "complete" || stage === "setup" || stage === "project",
      ))
        for (const key of requiredCheckpoints(state, stage))
          dispatch({
            type: "record",
            key,
            outcome: "confirmed",
            evidence: `${key} · 실제 결과를 확인했다고 남긴 검토용 기록`,
            projectId: state.projectId,
            revision: state.checkpoints[key].revision,
          });
      if (scenario === "recheck") dispatch({ type: "change", values: { content: "새 내용" } });
    }
    setOpened(true);
  }
  if (!opened)
    return (
      <div className={style.controls}>
        <p>격리된 UI 검토 상태 · 실제 프로젝트 결과가 아니에요.</p>
        <button onClick={seed}>정리 화면 열기</button>
      </div>
    );
  return <WorkbookReview view={p.reviewView ?? "summary"} onBack={() => setOpened(false)} />;
}

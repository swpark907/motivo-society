"use client";

// 본편과 같은 지도/수업 컴포넌트의 배치만 검토한다. 실제 수강 기록을 채우지 않는다.
import { useState } from "react";
import { practicalMapStops, type PracticalStage } from "@/lib/workbook-practical-labs";
import { WorkbookProgressProvider, useWorkbookProgress } from "./WorkbookProgressContext";
import { WorkbookMap } from "./WorkbookMap";
import { WorkbookProjectMap } from "./WorkbookProjectMap";
import { WorkbookExperienceMap } from "./WorkbookExperienceMap";
import { WorkbookDataMap } from "./WorkbookDataMap";
import { WorkbookPublishMap } from "./WorkbookPublishMap";
import { WorkbookPracticalLesson } from "./WorkbookPracticalLesson";
import styles from "./WorkbookClass.module.scss";
import review from "./WorkbookMapPointsReview.module.scss";

const names: Record<PracticalStage, string> = {
  agent: "AI 도구 준비하기",
  project: "기획하고 첫 화면 만들기",
  experience: "반응형 화면 만들기",
  data: "기능과 데이터 저장",
  publish: "배포하고 고치기",
};
function PointsReview() {
  const progress = useWorkbookProgress();
  const [stage, setStage] = useState<PracticalStage>("agent");
  const [lesson, setLesson] = useState(false);
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const noop = () => {};
  return lesson ? (
    <main
      className={styles.page}
      data-learning="true"
      style={{ height: "calc(100dvh - var(--gnb-height))" }}
    >
      <WorkbookPracticalLesson stage={stage} onBack={() => setLesson(false)} />
    </main>
  ) : (
    <main className={review.page}>
      <h1>지도 지점 배치 검토</h1>
      <p>
        본편과 같은 컴포넌트예요. 기본 학습 기록은 비어 있고, 이 화면에서는 지도 이동을 실행하지
        않아요.
      </p>
      <nav aria-label="검토할 지도">
        {Object.entries(names).map(([key, name]) => (
          <button
            key={key}
            aria-pressed={stage === key}
            onClick={() => setStage(key as PracticalStage)}
          >
            {name}
          </button>
        ))}
      </nav>
      <p>
        {names[stage]} · 기본 {stage === "agent" ? 5 : 3}곳 + 선택 심화 1곳 ·{" "}
        {practicalMapStops[stage].name}
      </p>
      <button onClick={() => setLesson(true)}>선택 활동 화면 검토</button>
      <div inert className={review.map}>
        {stage === "agent" ? (
          <WorkbookMap
            {...progress}
            onEnter={noop}
            onArrive={progress.setCurrentStop}
            onPractical={noop}
            panelTarget={panel}
          />
        ) : stage === "project" ? (
          <WorkbookProjectMap onEnter={noop} onPractical={noop} panelTarget={panel} />
        ) : stage === "experience" ? (
          <WorkbookExperienceMap onEnter={noop} onPractical={noop} panelTarget={panel} />
        ) : stage === "data" ? (
          <WorkbookDataMap onEnter={noop} onPractical={noop} panelTarget={panel} />
        ) : (
          <WorkbookPublishMap onEnter={noop} onPractical={noop} panelTarget={panel} />
        )}
      </div>
      <div hidden ref={setPanel} />
    </main>
  );
}
export function WorkbookMapPointsReview() {
  return (
    <WorkbookProgressProvider>
      <PointsReview />
    </WorkbookProgressProvider>
  );
}

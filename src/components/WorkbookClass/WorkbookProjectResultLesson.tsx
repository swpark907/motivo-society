"use client";

// 2-3 첫 화면 확인하기(2026-11-19 다시 만듦): 설계도와 화면 대조 → 버튼의 모양과 하는 일 → 한 곳만 고쳐 달라고
// → 새로고침하고 전후 비교(컴퓨터 실습은 확인 도장 셋 + 본 것 한 줄) → 오늘 알게 된 것 + 2단원 정리.
// 기록은 예전 2-3과 같다: 도장 셋은 project.plan · project.content · project.actions, 본 것 한 줄이 근거이고
// 적은 것이 없으면 기록하지 않는다(useRecordFirstProjectResult). 3단원은 이 기록을 읽는다.
import { useEffect, useRef } from "react";
import { workbookCourse, workbookProjectStep } from "@/lib/workbook-course";
import { isPlanReady } from "@/lib/workbook-project-steps";
import { workbookPlanFields } from "@/lib/workbook-page-plan";
import { canOpenWorkbookUnit, workbookTrialAccess } from "@/lib/workbook-access";
import type { PieceId } from "@/lib/workbook-result-check";
import type { ProjectLessonProps, ProjectRecord } from "./WorkbookProjectLesson";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";
import { WorkbookLessonFinish } from "./WorkbookLessonFinish";
import { useRecordFirstProjectResult } from "./WorkbookFirstProjectResult";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import { WorkbookResultCompare, type ResultMarks } from "./WorkbookResultCompare";
import { WorkbookResultButton } from "./WorkbookResultButton";
import { WorkbookResultFix } from "./WorkbookResultFix";
import { WorkbookResultAfter } from "./WorkbookResultAfter";
import { WorkbookUnitTwoRecap } from "./WorkbookUnitTwoRecap";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const LAST = 4;
const checkKeys = ["project.plan", "project.content", "project.actions"] as const;
const nextUnit = workbookCourse[2];
const requestLesson = workbookCourse[1].lessons[workbookProjectStep.request];

export function WorkbookProjectResultLesson({
  record,
  ready,
  onChange,
  onBack,
  onComplete,
  onStep,
  onNextUnit,
}: ProjectLessonProps) {
  const p = useWorkbookProgress();
  const recordResult = useRecordFirstProjectResult();
  const [screen, setScreen] = useWorkbookLessonState("project-result-screen", 0);
  const [marks, setMarks] = useWorkbookLessonState<ResultMarks>("result-marks", {});
  const [picked, setPicked] = useWorkbookLessonState<PieceId | null>("result-picked", null);
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const safeScreen = Math.min(screen, LAST);
  const computer = record.mode === "computer";
  const planReady = isPlanReady(record);
  const planApplied =
    p.projectWorkflow.changes.plan ===
    JSON.stringify(workbookPlanFields.map(([key]) => record[key]));
  const toNextUnit = !!onNextUnit && canOpenWorkbookUnit(workbookTrialAccess, nextUnit.number);

  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [safeScreen]);
  function move(next: number) {
    setScreen(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function update(patch: Partial<ProjectRecord>) {
    onChange({ ...record, ...patch });
  }
  function markCheck(index: number, checked: boolean) {
    update({ checks: record.checks.map((value, i) => (i === index ? checked : value)) });
    // 확인됨으로 남은 뒤 도장을 지우면 그 자리에서 "시도함"으로 낮춘다(1-6과 같은 동작).
    if (!checked && p.projectWorkflow.checkpoints[checkKeys[index]].outcome === "confirmed")
      p.dispatchProjectWorkflow({
        type: "record",
        key: checkKeys[index],
        outcome: "attempted",
        evidence: record.observation,
        projectId: p.projectWorkflow.projectId,
        revision: p.projectWorkflow.checkpoints[checkKeys[index]].revision,
      });
  }
  function finish() {
    recordResult(
      "project",
      computer,
      ready && record.checks.every(Boolean),
      record.observation,
      planApplied && planReady && Boolean(record.request.trim()),
    );
    p.dispatchProjectWorkflow({
      type: "learn",
      unit: "project",
      status: "confirmed",
      source: computer ? "computer" : "example",
    });
    if (!computer)
      p.setApplications((previous) =>
        previous.project.mode === null
          ? { ...previous, project: { ...previous.project, mode: "pending" } }
          : previous,
      );
    onComplete();
  }

  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="project"
        point={workbookProjectStep.result}
        headingRef={heading}
        onBack={onBack}
        current={safeScreen + 1}
        total={LAST + 1}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        {record.mode === null && safeScreen < LAST && (
          <p className={system.planningHint} role="status">
            {requestLesson.number}에서 메모를 보냈는지, 예시로 따라갈지 아직 고르지 않았어요. 지금은
            연습 화면으로 따라가요.{" "}
            <button type="button" onClick={() => onStep(workbookProjectStep.request)}>
              {requestLesson.number}로 가기
            </button>
          </p>
        )}
        {safeScreen === 0 && (
          <WorkbookResultCompare
            record={record}
            marks={marks}
            onMark={(id, value) => setMarks({ ...marks, [id]: value })}
          />
        )}
        {safeScreen === 1 && <WorkbookResultButton record={record} />}
        {safeScreen === 2 && (
          <WorkbookResultFix record={record} marks={marks} picked={picked} onPick={setPicked} />
        )}
        {safeScreen === 3 && (
          <WorkbookResultAfter
            record={record}
            onCheck={markCheck}
            onObserve={(observation) => update({ observation })}
          />
        )}
        {safeScreen === 4 && <WorkbookUnitTwoRecap record={record} />}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>고쳐진 페이지를 설계도와 맞춰 보고, 다른 곳을 하나씩 고치기</h2>
          <p>같은 my-first-web/index.html을 브라우저로 열어 확인해요.</p>
          <small>확인 도장은 내 화면을 직접 본 뒤에 찍어요.</small>
        </div>
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={safeScreen + 1}>
            {safeScreen > 0 && (
              <button data-action-role="lesson-back" onClick={() => move(safeScreen - 1)}>
                이전 설명
              </button>
            )}
          </WorkbookLessonPrevious>
          {safeScreen < LAST ? (
            <button data-action-role="lesson-next" onClick={() => move(safeScreen + 1)}>
              다음으로
            </button>
          ) : toNextUnit ? (
            <WorkbookLessonFinish
              label={`${nextUnit.number}단원 시작하기 →`}
              shortLabel={`${nextUnit.number}단원 시작 →`}
              onNext={() => {
                finish();
                onNextUnit?.();
              }}
              onMap={finish}
            />
          ) : (
            <WorkbookLessonFinish label="학습 마치고 단원 지도로 →" onNext={finish} />
          )}
        </nav>
      </aside>
    </section>
  );
}

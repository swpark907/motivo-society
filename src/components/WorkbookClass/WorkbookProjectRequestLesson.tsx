"use client";

// 2-2 제작 요청 다듬기(2026-11-19 다시 만듦): 기획을 네 칸 메모로 → 새로 만들지 말고 고쳐 달라고 → 보내고
// 질문에는 아는 만큼만 답하기 → 승인 전에 바뀌는 부분(−·+) 읽기 → 오늘 알게 된 것.
// 입력 칸은 없다. 실제 대답과 승인은 Claude 앱에서 하고, 워크북에는 학습자가 찍은 도장만 남긴다.
// 실습 방식은 1-6에서 고른 것을 이어받는다. 메모 글은 기획에서 만든다(workbook-plan-memo.ts).
import { useCallback, useEffect, useRef } from "react";
import { workbookCourse, workbookLessonId } from "@/lib/workbook-course";
import { planMemoText } from "@/lib/workbook-plan-memo";
import { workbookPlanFields } from "@/lib/workbook-page-plan";
import type { ProjectLessonProps, ProjectRecord } from "./WorkbookProjectLesson";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";
import { WorkbookLessonFinish } from "./WorkbookLessonFinish";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import { WorkbookRequestMove } from "./WorkbookRequestMove";
import { WorkbookRequestEdit } from "./WorkbookRequestEdit";
import { WorkbookRequestSend } from "./WorkbookRequestSend";
import { WorkbookRequestDiff } from "./WorkbookRequestDiff";
import { WorkbookPageRequestRecap } from "./WorkbookPageRequestRecap";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const LAST = 4;
const nextLesson = workbookCourse[1].lessons[2];

export function WorkbookProjectRequestLesson({
  record,
  ready,
  onBack,
  onStep,
}: ProjectLessonProps) {
  const p = useWorkbookProgress();
  const [screen, setScreen] = useWorkbookLessonState("project-request-screen", 0);
  const [asked, setAsked] = useWorkbookLessonState("request-asked", false);
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const blanksRef = useRef<HTMLDivElement>(null);
  const safeScreen = Math.min(screen, LAST);
  const planReady = workbookPlanFields.every(([key]) => record[key].trim());
  const { setProject } = p;
  const update = useCallback(
    (patch: Partial<ProjectRecord>) =>
      setProject((current) =>
        Object.entries(patch).every(([key, value]) => current[key as keyof ProjectRecord] === value)
          ? current
          : { ...current, ...patch },
      ),
    [setProject],
  );

  // 실습 방식은 1단원 첫 코드 만들기에서 정한 것을 이어받는다(다시 고르게 하지 않는다). 바꾸는 것은 자유다.
  const firstFileMode = p.practice[workbookLessonId.firstFile]?.mode ?? null;
  const inherited =
    record.mode !== null
      ? null
      : firstFileMode === "computer" && ready
        ? "computer"
        : firstFileMode === "example"
          ? "example"
          : null;
  const [modeCarried, setModeCarried] = useWorkbookLessonState("project-mode-carried", false);
  useEffect(() => {
    if (!inherited) return;
    setModeCarried(true);
    setProject((current) =>
      current.mode === null
        ? { ...current, mode: inherited, request: planMemoText(current) }
        : current,
    );
  }, [inherited, setModeCarried, setProject]);

  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [safeScreen]);
  function move(next: number) {
    setScreen(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function toResult() {
    if (record.mode === null) {
      setAsked(true);
      requestAnimationFrame(() => blanksRef.current?.focus());
      return;
    }
    // 기획이 바뀌었을 수 있으니, 넘어가기 전에 메모를 지금 기획으로 맞춘다.
    update({ request: planMemoText(record) });
    // 2-3의 결과 기록은 "지금 기획으로 요청을 보냈는지"를 이 값으로 확인한다(예전 2-2와 같은 기록).
    const planBasis = JSON.stringify(workbookPlanFields.map(([key]) => record[key]));
    if (p.projectWorkflow.changes.plan !== planBasis)
      p.dispatchProjectWorkflow({ type: "change", values: { plan: planBasis } });
    onStep(2);
  }

  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="project"
        point={1}
        headingRef={heading}
        onBack={onBack}
        current={safeScreen + 1}
        total={LAST + 1}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        {!planReady && safeScreen < LAST && (
          <p className={system.planningHint} role="status">
            지난 수업의 기획에 비어 있는 곳이 있어요. 비어 있는 칸은 메모에 괄호로 남아요.{" "}
            <button type="button" onClick={() => onStep(0)}>
              기획 수업으로 가기
            </button>
          </p>
        )}
        {safeScreen === 0 && <WorkbookRequestMove record={record} />}
        {safeScreen === 1 && <WorkbookRequestEdit record={record} />}
        {safeScreen === 2 && (
          <WorkbookRequestSend
            record={record}
            ready={ready}
            carried={modeCarried}
            update={update}
          />
        )}
        {safeScreen === 3 && <WorkbookRequestDiff record={record} update={update} />}
        {safeScreen === 4 && (
          <WorkbookPageRequestRecap
            record={record}
            missingMode={record.mode === null}
            asked={asked}
            blanksRef={blanksRef}
            onJump={move}
          />
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>기획을 요청으로 옮기고, 같은 파일을 고쳐 달라고 부탁하기</h2>
          <p>1단원에서 쓰던 Claude 앱의 같은 대화에 보내요.</p>
          <small>대답과 승인은 Claude 앱에서 직접 해요.</small>
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
          ) : (
            <WorkbookLessonFinish
              label={`다음: ${nextLesson.number} ${nextLesson.title} →`}
              shortLabel="다음 수업 →"
              ariaLabel={`다음 수업 ${nextLesson.number} ${nextLesson.title} 시작`}
              onNext={toResult}
              onMap={onBack}
            />
          )}
        </nav>
      </aside>
    </section>
  );
}

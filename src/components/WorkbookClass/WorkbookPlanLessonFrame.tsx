"use client";

// 2단원 기획 네 수업(2-1~2-4)이 같이 쓰는 수업 틀: 머리 · 본문 · 하단 이동 바(이전 · 단계 점 · 다음).
// 마지막 화면의 주 버튼은 이 수업을 마친 것으로 기록(done에 주소를 남김)하고 다음 수업으로 간다(수업 넘어가기 통일).
// 다음 버튼은 막지 않는다. 마치기 전에 채워야 할 것이 있으면 수업이 canFinish로 막고 이유를 보여 준다.
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { workbookCourse } from "@/lib/workbook-course";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";
import { WorkbookLessonFinish } from "./WorkbookLessonFinish";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

/** 기획 칸을 고친다. 기획이 바뀌면 첫 화면 확인 표시는 다시 해야 하므로 지운다(예전 2-1과 같은 규칙). */
export function usePlanUpdate() {
  const { setProject } = useWorkbookProgress();
  return useCallback(
    (patch: Partial<ProjectRecord>) =>
      setProject((current) =>
        Object.entries(patch).every(([key, value]) => current[key as keyof ProjectRecord] === value)
          ? current
          : { ...current, ...patch, checks: [false, false, false], previewConfirmed: false },
      ),
    [setProject],
  );
}

export function WorkbookPlanLessonFrame({
  point,
  screens,
  goal,
  onBack,
  onStep,
  beforeFinish,
}: {
  /** 2단원 안에서 이 수업의 순번(workbookProjectStep). */
  point: number;
  screens: readonly (() => ReactNode)[];
  goal: { title: string; text: string; note: string };
  onBack: () => void;
  onStep: (step: number) => void;
  /** 마치기 전에 확인할 것. false를 돌려주면 다음 수업으로 가지 않는다(이유는 수업이 화면에 보여 준다). */
  beforeFinish?: () => boolean;
}) {
  const p = useWorkbookProgress();
  const lesson = workbookCourse[1].lessons[point];
  const next = workbookCourse[1].lessons[point + 1];
  const [screen, setScreen] = useWorkbookLessonState(`plan-${lesson.slug}-screen`, 0);
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const last = screens.length - 1;
  const safeScreen = Math.min(screen, last);
  const { setProject } = p;

  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [safeScreen]);
  function move(to: number) {
    setScreen(to);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function markDone() {
    setProject((current) =>
      current.done.includes(lesson.slug)
        ? current
        : { ...current, done: [...current.done, lesson.slug] },
    );
  }

  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="project"
        point={point}
        headingRef={heading}
        onBack={onBack}
        current={safeScreen + 1}
        total={screens.length}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        {screens[safeScreen]()}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>{goal.title}</h2>
          <p>{goal.text}</p>
          <small>{goal.note}</small>
        </div>
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={safeScreen + 1}>
            {safeScreen > 0 && (
              <button data-action-role="lesson-back" onClick={() => move(safeScreen - 1)}>
                이전 설명
              </button>
            )}
          </WorkbookLessonPrevious>
          {safeScreen < last ? (
            <button data-action-role="lesson-next" onClick={() => move(safeScreen + 1)}>
              다음으로
            </button>
          ) : (
            <WorkbookLessonFinish
              label={`다음: ${next.number} ${next.title} →`}
              shortLabel="다음 수업 →"
              ariaLabel={`다음 수업 ${next.number} ${next.title} 시작`}
              onNext={() => {
                if (beforeFinish && !beforeFinish()) return;
                markDone();
                onStep(point + 1);
              }}
              onMap={() => {
                if (beforeFinish && !beforeFinish()) return;
                markDone();
                onBack();
              }}
            />
          )}
        </nav>
      </aside>
    </section>
  );
}

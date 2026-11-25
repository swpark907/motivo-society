"use client";

// 3단원 개념 수업(3-1 등)이 같이 쓰는 수업 틀. 2단원 기획 수업 틀(WorkbookPlanLessonFrame)과 같은 머리 · 본문 ·
// 하단 이동 바를 쓰고, 마지막 화면의 주 버튼은 이 수업을 마친 것으로 기록(3단원 기록의 done에 주소를 남김)한 뒤
// 다음 수업으로 간다. 화면 위치는 수업별 방문 상태(lessonUi)에 둔다.
import { useEffect, useRef, type ReactNode } from "react";
import { workbookCourse } from "@/lib/workbook-course";
import type { ExperienceRecord } from "@/lib/workbook-experience";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";
import { WorkbookLessonFinish } from "./WorkbookLessonFinish";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

export function WorkbookExperienceLessonFrame({
  point,
  screens,
  goal,
  record,
  onChange,
  onBack,
  onStep,
}: {
  /** 3단원 안에서 이 수업의 순번(workbookExperienceStep). */
  point: number;
  screens: readonly (() => ReactNode)[];
  goal: { title: string; text: string; note: string };
  record: ExperienceRecord;
  onChange: (record: ExperienceRecord) => void;
  onBack: () => void;
  onStep: (step: number) => void;
}) {
  const lessons = workbookCourse[2].lessons;
  const lesson = lessons[point];
  const next = lessons[point + 1];
  const [screen, setScreen] = useWorkbookLessonState(`experience-${lesson.slug}-screen`, 0);
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const last = screens.length - 1;
  const safeScreen = Math.min(screen, last);

  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [safeScreen]);
  function move(to: number) {
    setScreen(to);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function markDone() {
    const done = record.done ?? [];
    if (!done.includes(lesson.slug)) onChange({ ...record, done: [...done, lesson.slug] });
  }

  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="experience"
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
                markDone();
                onStep(point + 1);
              }}
              onMap={() => {
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

"use client";

import { createContext, useEffect, useRef, type ReactNode } from "react";
import type { workbookCourse } from "@/lib/workbook-course";
import { workbookLessonCovers } from "@/lib/workbook-lesson-covers";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { WorkbookLessonStepsProvider } from "./WorkbookLessonSteps";
import styles from "./WorkbookLessonCover.module.scss";

export const WorkbookLessonCoverContext = createContext<(() => void) | null>(null);

// 표지는 방문 중 열람 상태만 소유한다. 시작은 기존 학습·완료 기록을 변경하지 않는다.
export function WorkbookLessonCover({
  unit,
  point,
  onBack,
  onPreviousLesson,
  children,
}: {
  unit: (typeof workbookCourse)[number];
  point: number;
  onBack: () => void;
  onPreviousLesson?: () => void;
  children: ReactNode;
}) {
  const lesson = unit.lessons[point];
  const copy = workbookLessonCovers[lesson.slug];
  const [started, setStarted] = useWorkbookLessonState(`lesson-cover-${lesson.slug}`, false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!started) heading.current?.focus();
  }, [started]);
  if (started)
    return (
      <WorkbookLessonCoverContext.Provider value={() => setStarted(false)}>
        <WorkbookLessonStepsProvider>{children}</WorkbookLessonStepsProvider>
      </WorkbookLessonCoverContext.Provider>
    );
  return (
    <section className={styles.cover} aria-label="강의 시작 표지">
      <header className={styles.top}>
        <span>
          {unit.number}단원 · {unit.title}
        </span>
        <div>
          {onPreviousLesson && (
            <button type="button" onClick={onPreviousLesson}>
              이전 강의로
            </button>
          )}
          <button type="button" onClick={onBack}>
            단원 지도 보기
          </button>
        </div>
      </header>
      <div className={styles.body}>
        <div className={styles.titleBlock}>
          <span className={styles.number}>LESSON {lesson.number}</span>
          <h1 ref={heading} tabIndex={-1}>
            {lesson.title}
          </h1>
          <p className={styles.summary}>{copy.summary}</p>
        </div>
        <section className={styles.goals} aria-label="이번 강의의 목표">
          <h2>이번에는 이렇게 해봐요</h2>
          <ul>
            {copy.goals.map((goal) => (
              <li key={goal}>{goal}</li>
            ))}
          </ul>
        </section>
        <div className={styles.start}>
          <p>그럼, 한번 시작해볼까요?</p>
          <button type="button" onClick={() => setStarted(true)}>
            시작하기 <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

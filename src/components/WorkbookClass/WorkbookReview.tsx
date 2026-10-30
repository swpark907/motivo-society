"use client";

// 홈과 마지막 정리에서 선택한 기록 화면을 연다. 기존 학습·적용 기록을 그대로 사용한다.
import Link from "next/link";
import { useEffect, useRef } from "react";
import { workbookCourse } from "@/lib/workbook-course";
import { applicationStages, type ApplicationStage } from "@/lib/workbook-application";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import { WorkbookApplicationRecord } from "./WorkbookApplicationRecord";
import { WorkbookClassSummary } from "./WorkbookClassSummary";
import system from "./WorkbookLesson.module.scss";

export function WorkbookReview({
  view,
  onBack,
}: {
  view: "summary" | ApplicationStage;
  onBack: () => void;
}) {
  const p = useWorkbookProgress();
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const allLearned =
    p.completed.length === 5 &&
    p.projectCompleted &&
    p.experienceCompleted &&
    p.dataCompleted &&
    p.publishCompleted;
  const allowed =
    view === "summary"
      ? allLearned
      : view === "project"
        ? p.completed.length === 5
        : view === "experience"
          ? p.projectCompleted
          : view === "data"
            ? p.projectCompleted && p.experienceCompleted
            : p.projectCompleted && p.experienceCompleted && p.dataCompleted;
  const learnedUnits = [
    p.completed.length === 5,
    p.projectCompleted,
    p.experienceCompleted,
    p.dataCompleted,
    p.publishCompleted,
  ];
  const requiredUnitCount =
    view === "summary" ? 5 : workbookCourse.findIndex((unit) => unit.stage === view);
  const unfinished = workbookCourse.filter(
    (_, index) => index < requiredUnitCount && !learnedUnits[index],
  );
  const remainingIntro = workbookCourse[0].lessons.filter(
    (_, index) => !p.completed.includes(index),
  );
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
    heading.current?.focus();
  }, [view]);
  function back() {
    onBack();
  }
  return (
    <section className={system.lesson}>
      <header className={system.lessonHeader} data-lesson-header>
        <div className={system.headerIdentity}>
          <span className={system.coursePosition}>
            {view === "summary" ? "클래스 학습 정리" : "선택 실습 · 기본 수업과 별도"}
          </span>
          <h1 ref={heading} tabIndex={-1}>
            {view === "summary"
              ? "배운 것과 내 파일, 다음 할 일"
              : `${applicationStages[view].name} · 내 파일에서 이어하기`}
          </h1>
        </div>
        <div className={system.headerActions}>
          <button onClick={back}>단원 지도 보기</button>
        </div>
      </header>
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        {!allowed ? (
          <section className={system.practiceStage} aria-label="남은 기본 학습">
            <p>
              {view === "summary"
                ? "아직 마치지 않은 기본 수업이 있어요."
                : "이 선택 실습에 앞서 마칠 기본 수업이 있어요."}
            </p>
            <dl className={system.recapPoints}>
              {unfinished.map((unit) => (
                <div key={unit.world}>
                  <dt>
                    {unit.number}단원 {unit.title}
                  </dt>
                  <dd>
                    {unit.world === "ai"
                      ? `남은 수업: ${remainingIntro.map((lesson) => `${lesson.number} ${lesson.title}`).join(" · ")}`
                      : "단원 지도에서 다음 수업을 이어가세요."}
                  </dd>
                </div>
              ))}
            </dl>
            {unfinished[0] && (
              <button
                onClick={() => {
                  p.setMapWorld(unfinished[0].world);
                  back();
                }}
              >
                {unfinished[0].number}단원 {unfinished[0].title} 지도 보기 →
              </button>
            )}
            <small>수업을 마친 뒤 다시 이 화면을 열 수 있어요.</small>
          </section>
        ) : view === "summary" ? (
          <WorkbookClassSummary standalone />
        ) : (
          <WorkbookApplicationRecord stage={view} standalone />
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="이어갈 작업 안내">
        <div className={system.panelNotes}>
          <h2>{view === "summary" ? "지금 할 일 하나부터" : "내 파일에서 확인하고 돌아오기"}</h2>
          <p>
            실제 적용은 선택이에요. 기록을 남겨도 자동 파일 검사나 배포 성공 인증이 되지는 않아요.
          </p>
          <small>새로고침하면 이번 방문의 기록은 초기화돼요.</small>
        </div>
        <Link href="/workbook">워크북 홈으로 →</Link>
        <nav className={system.lessonNavigation} aria-label="기록 화면 이동">
          {view === "summary" && allowed && p.lessonUi["class-summary-tab"] !== "next" && (
            <button
              onClick={() =>
                p.setLessonUi((previous) => ({ ...previous, "class-summary-tab": "next" }))
              }
            >
              남은 일 보기
            </button>
          )}
          {view !== "summary" && allLearned && (
            <button onClick={() => p.setReviewView("summary")}>마지막 정리로</button>
          )}
          <button onClick={back}>학습 지도로 돌아가기</button>
        </nav>
      </aside>
    </section>
  );
}

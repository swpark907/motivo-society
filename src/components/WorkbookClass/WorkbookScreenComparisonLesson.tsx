"use client";

import { useEffect, useId, useRef, useState } from "react";
import { workbookLessonLabel } from "@/lib/workbook-course";
import { experienceProgress } from "@/lib/workbook-experience";
import type { ExperienceLessonProps } from "./WorkbookExperienceLesson";
import { ResponsivePagePreview } from "../WorkbookJourney/ResponsivePagePreview";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";
import { WorkbookActionReturn } from "./WorkbookActionReturn";
import { WorkbookOptionalPractice } from "./WorkbookOptionalPractice";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const titles = [
  "쓴 개선 요청을 다시 확인해요",
  "모바일 폭에서 잘림이 줄었나요?",
  "PC 폭에서도 내용이 유지되나요?",
  "내용 보기 버튼도 다시 눌러봐요",
  "수정 전후 달라진 점을 남겨요",
  "화면과 동작을 함께 확인했어요",
];

export function WorkbookScreenComparisonLesson({
  project,
  record,
  onChange,
  onBack,
  onComplete,
  onStep,
}: ExperienceLessonProps) {
  const p = useWorkbookProgress();
  const [savedPage, setPage] = useWorkbookLessonState("screen-comparison-page", 0);
  const [view, setView] = useWorkbookLessonState<"before" | "after">("experience-view", "before");
  const [size, setSize] = useWorkbookLessonState<"mobile" | "desktop">(
    "experience-screen",
    "mobile",
  );
  const [message, setMessage] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const id = useId();
  const progress = experienceProgress(record);
  const page = record.applied && progress.requested ? savedPage : 0;
  const currentSize = page === 1 ? "mobile" : page === 2 ? "desktop" : size;
  const after = page === 3 || view === "after";
  const blocked =
    !progress.requested ||
    !record.applied ||
    (page === 1 && !record.after[0]) ||
    (page === 2 && !record.after.every(Boolean)) ||
    (page === 3 && !record.buttonChecked) ||
    (page >= 4 && !progress.verified);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [page]);
  function move(next: number) {
    setMessage("");
    setPage(next);
    setView("after");
    requestAnimationFrame(() => heading.current?.focus());
  }
  function check() {
    if (!after) return;
    if (preview.current && preview.current.scrollWidth > preview.current.clientWidth + 1) {
      setMessage("화면 밖으로 나가는 내용이 있어요. 긴 내용도 살펴보세요.");
      return;
    }
    const index = currentSize === "mobile" ? 0 : 1;
    onChange({ ...record, after: record.after.map((value, i) => value || i === index) });
    setMessage(`${currentSize === "mobile" ? "모바일" : "PC"} 폭의 수정 후 확인을 남겼어요.`);
  }
  function finish() {
    p.dispatchProjectWorkflow({
      type: "learn",
      unit: "experience",
      status: "confirmed",
      source: "example",
    });
    onComplete();
  }
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="experience"
        point={2}
        headingRef={heading}
        onBack={onBack}
        current={page + 1}
        total={6}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        <h2 className={system.screenTitle}>{titles[page]}</h2>
        {!progress.requested ? (
          <section className={system.practiceStage}>
            <p>먼저 3-2에서 관찰을 담은 개선 요청을 준비해주세요. 이전 기록은 유지돼요.</p>
            <div className={system.practiceActions}>
              <button onClick={() => onStep(1)}>3-2 요청으로 돌아가기</button>
            </div>
          </section>
        ) : (
          <>
            {page === 0 && (
              <section className={system.practiceStage}>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>앞에서 본 문제</dt>
                    <dd>{record.observation}</dd>
                  </div>
                  <div>
                    <dt>이번 비교</dt>
                    <dd>페이지 너비가 화면에 맞게 바뀐 예시</dd>
                  </div>
                </dl>
                <details className={system.preparationMore}>
                  <summary>3-2에서 쓴 개선 요청 보기</summary>
                  <p style={{ whiteSpace: "pre-wrap" }}>{record.request}</p>
                </details>
                <p className={system.aiKeyTakeaway}>
                  제목·소개·목록은 그대로 두고 <strong>너비만 바꾼 예시</strong>를 준비해요. 입력한
                  요청을 AI가 실행하거나 실제 파일을 수정하는 것은 아니에요.
                </p>
                <div className={system.practiceActions}>
                  <button
                    disabled={record.applied}
                    onClick={() => {
                      setPage(0);
                      setView("after");
                      onChange({ ...record, applied: true });
                    }}
                  >
                    {record.applied ? "너비 수정 예시 준비됨" : "너비 수정 예시 준비하기"}
                  </button>
                </div>
                <small>내 요청이 다른 변화를 포함해도 이 연습은 너비 변화만 보여줘요.</small>
              </section>
            )}
            {(page === 1 || page === 2) && (
              <section className={system.practiceStage}>
                <div className={system.resultTabs} role="group" aria-label="전후 비교">
                  {(["before", "after"] as const).map((value) => (
                    <button
                      key={value}
                      aria-pressed={view === value}
                      onClick={() => {
                        setView(value);
                        setMessage("");
                      }}
                    >
                      {value === "before" ? "수정 전 보기" : "수정 후 보기"}
                    </button>
                  ))}
                </div>
                <ResponsivePagePreview
                  appearance="lesson"
                  screen={currentSize}
                  fluid={after}
                  stack
                  page={project}
                  previewRef={preview}
                  label="수정 전후 비교 예시"
                  onButton={() => {
                    if (after) onChange({ ...record, buttonChecked: true });
                    setMessage(
                      after
                        ? "같은 목록으로 이동했어요. 글과 목록의 잘림도 살펴보세요."
                        : "수정 전 버튼 이동이에요. 수정 후의 동작도 확인해주세요.",
                    );
                  }}
                />
                <p className={system.planningHint}>
                  {page === 1
                    ? "모바일 280px · 전후를 바꿔 글과 목록이 폭 안에 들어오는지 비교하세요."
                    : "PC 560px · 같은 제목·소개·목록이 유지되고 새로 잘린 곳은 없는지 보세요."}
                </p>
                <div className={system.practiceActions}>
                  <button disabled={!after} onClick={check}>
                    {record.after[page === 1 ? 0 : 1]
                      ? "수정 후 다시 확인하기"
                      : "이 폭의 수정 후 확인했어요"}
                  </button>
                </div>
                {message && (
                  <p className={system.planningHint} role="status">
                    {message}
                  </p>
                )}
              </section>
            )}
            {page === 3 && (
              <section className={system.practiceStage}>
                <div className={system.resultTabs} role="group" aria-label="버튼 확인 화면 크기">
                  {(["mobile", "desktop"] as const).map((value) => (
                    <button
                      key={value}
                      aria-pressed={size === value}
                      onClick={() => {
                        setSize(value);
                        setMessage("");
                      }}
                    >
                      {value === "mobile" ? "모바일 280px" : "PC 560px"}
                    </button>
                  ))}
                </div>
                <ResponsivePagePreview
                  appearance="lesson"
                  screen={size}
                  fluid
                  stack
                  page={project}
                  label="수정 후 버튼 확인 예시"
                  onButton={() => {
                    onChange({ ...record, buttonChecked: true });
                    setMessage("내용 보기 버튼으로 같은 목록에 도착했어요.");
                  }}
                />
                <p className={system.planningHint}>
                  수정 후 예시의 <strong>내용 보기</strong>를 눌러 같은 목록으로 이동하는지
                  확인하세요.
                </p>
                {record.buttonChecked && (
                  <p className={system.planningHint} role="status">
                    {message || "수정 후 버튼 이동 확인을 남겼어요."}
                  </p>
                )}
              </section>
            )}
            {page === 4 && (
              <section className={system.practiceStage}>
                <p data-current-action tabIndex={-1}>
                  <strong>달라진 점과 유지된 점</strong>을 함께 적어주세요. ‘좋아졌어요’보다 무엇을
                  확인했는지 남겨요.
                </p>
                <p>
                  ‘더 예뻐졌어요’에서 한 걸음 더 나아가 ‘옆으로 밀지 않고 읽어요’, ‘장소 제목이 먼저
                  보여요’처럼 <strong>무엇이 쉬워졌는지</strong> 말해보세요. 간격을 넓히면 구분은
                  편해져도 한 화면에 보이는 양은 줄 수 있어요. 독자와 목적에 맞는 이유로 판단합니다.
                </p>
                <label className={system.practiceField} htmlFor={`${id}-comparison`}>
                  예시 수정 전후 달라진 점
                  <textarea
                    id={`${id}-comparison`}
                    rows={4}
                    value={record.comparison}
                    onChange={(event) => onChange({ ...record, comparison: event.target.value })}
                    placeholder="예: 모바일에서 목록 잘림이 줄었고, PC에서도 내용은 그대로예요. 버튼도 같은 목록으로 이동해요."
                  />
                </label>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>남긴 확인</dt>
                    <dd>모바일·PC 폭과 수정 후 버튼 이동</dd>
                  </div>
                  <div>
                    <dt>기록의 범위</dt>
                    <dd>예시 비교 복습 · 실제 파일 수정은 별도</dd>
                  </div>
                </dl>
              </section>
            )}
            {page === 5 && (
              <>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>처음 관찰</dt>
                    <dd>{record.observation}</dd>
                  </div>
                  <div>
                    <dt>비교한 결과</dt>
                    <dd>{record.comparison}</dd>
                  </div>
                </dl>
                <p className={system.aiKeyTakeaway}>
                  한 부분을 고친 뒤에도 <strong>다른 폭의 내용과 기존 동작</strong>을 다시 확인해요.
                </p>
                <section className={system.nextLesson}>
                  <small>다음 단원 · 기능과 데이터 저장</small>
                  <h3>{workbookLessonLabel("data", 0)}</h3>
                  <p>입력과 선택에 따라 화면이 바뀌는 동작을 살펴봐요.</p>
                </section>
                <WorkbookOptionalPractice stage="experience" className={system.preparationMore} />
              </>
            )}
          </>
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>바뀐 화면과 남은 동작을 함께</h2>
          <p>같은 폭에서 전후를 비교하고, 두 폭과 버튼을 다시 확인해요.</p>
          <small>예시 비교 학습 · 실제 파일 확인 별도</small>
        </div>
        <WorkbookActionReturn body={body} enabled={page === 4} />
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={page + 1}>
            <button onClick={() => (page > 0 ? move(page - 1) : onStep(1))}>
              {page > 0 ? "이전 설명" : "3-2 개선 요청으로"}
            </button>
          </WorkbookLessonPrevious>
          {page < 5 ? (
            <button disabled={blocked} onClick={() => move(page + 1)}>
              다음으로
            </button>
          ) : (
            <button disabled={!progress.verified} onClick={finish}>
              단원 마치고 다음 학습 보기 →
            </button>
          )}
        </nav>
      </aside>
    </section>
  );
}

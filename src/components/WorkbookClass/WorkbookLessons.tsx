"use client";

import { workbookLessonId } from "@/lib/workbook-course";
import { WorkbookChatGrowth } from "./WorkbookChatGrowth";
import { WorkbookCodeIsText } from "./WorkbookCodeIsText";
import { WorkbookLessonRecap } from "./WorkbookLessonRecap";
import { WorkbookLlmCollage } from "./WorkbookLlmCollage";
import { WorkbookLlmNested } from "./WorkbookLlmNested";
import { WorkbookAiEraCollage } from "./WorkbookAiEraCollage";
import { WorkbookAiKinds } from "./WorkbookAiKinds";
import { WorkbookAgentComic } from "./WorkbookAgentComic";
import { WorkbookAgentTryout } from "./WorkbookAgentTryout";
import { WorkbookWhyAgent } from "./WorkbookWhyAgent";
import { WorkbookAgentNames } from "./WorkbookAgentNames";
import { WorkbookToolsRecap } from "./WorkbookToolsRecap";
import { WorkbookTokenScissors } from "./WorkbookTokenScissors";
import { WorkbookContextDesk } from "./WorkbookContextDesk";
import { WorkbookUsageCups } from "./WorkbookUsageCups";
import { WorkbookPlanMenu } from "./WorkbookPlanMenu";
import { WorkbookSavingHabits } from "./WorkbookSavingHabits";
import { WorkbookUsageRecap } from "./WorkbookUsageRecap";
import { WorkbookSetupStart } from "./WorkbookSetupStart";
import { WorkbookSetupInstall } from "./WorkbookSetupInstall";
import { WorkbookSetupTour } from "./WorkbookSetupTour";
import { WorkbookSetupFolder } from "./WorkbookSetupFolder";
import { WorkbookSetupCheck } from "./WorkbookSetupCheck";
import { WorkbookSetupRecap } from "./WorkbookSetupRecap";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";

// 설명 화면의 위치를 방문 중 유지한다(지도에 다녀와도 보던 화면에서 이어간다).
import { WorkbookActionReturn } from "./WorkbookActionReturn";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { useEffect, useRef } from "react";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

// 1-1~1-4는 같은 틀이다: 다섯 장을 차례로 펼치는 첫 단계 + 정리 화면.
// 퀴즈·정답 판정은 두지 않는다(docs/product/workbook-unit-1-plan.md).
const LAST_STEP = 1;
const LAST_PART = 4;
const TOTAL_SCREENS = 6;

export function WorkbookLessons({
  initialLesson,
  onBack,
  onComplete,
}: {
  initialLesson: number;
  onBack: () => void;
  onComplete: (lesson: number) => void;
}) {
  const p = useWorkbookProgress();
  const learningUnit = `ai-${initialLesson + 1}` as "ai-1" | "ai-2" | "ai-3" | "ai-4";
  const lesson = initialLesson;
  const ui = system;
  const [step, setStep] = useWorkbookLessonState(`ai-${lesson}-step`, 0);
  const [revealed, setRevealed] = useWorkbookLessonState<Record<number, number>>(
    `ai-${lesson}-revealed`,
    {},
  );
  // 이전 구성(1-2가 11화면이던 때)의 방문 상태가 남아 있어도 범위를 넘지 않게 한다.
  const safeStep = Math.min(step, LAST_STEP);
  const part = Math.min(revealed[safeStep] ?? 0, LAST_PART);
  const gradual = safeStep === 0;
  // 숫자는 수업 전체의 화면 위치다. 화면 안의 조작은 세지 않는다.
  const currentScreen = gradual ? part + 1 : TOTAL_SCREENS;
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
    // 진행 버튼 수가 바뀌어도 현재 키보드 조작을 화면 안에 둔다.
    const focused = document.activeElement;
    if (
      focused instanceof HTMLButtonElement &&
      body.current?.parentElement?.contains(focused) &&
      focused.closest("nav")?.getAttribute("aria-label") === "수업 진행"
    )
      focused.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [safeStep, part]);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  function move(next: number) {
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="agent"
        point={lesson}
        headingRef={heading}
        onBack={onBack}
        current={currentScreen}
        total={TOTAL_SCREENS}
      />
      <div ref={body} className={ui.lessonBody} tabIndex={0} aria-label="수업 내용">
        {/* 1-1 AI란 무엇인가 */}
        {lesson === 0 && !gradual && <WorkbookLessonRecap />}
        {lesson === 0 && gradual && part === 0 && <WorkbookAiEraCollage />}
        {lesson === 0 && gradual && part === 4 && <WorkbookLlmCollage />}
        {lesson === 0 && gradual && part !== 0 && part !== 4 && (
          <>
            <h2 id="lesson-screen-title" className={system.screenTitle}>
              {part === 1
                ? "코드도 결국 글자예요"
                : part === 2
                  ? "다만, 한 번에 완성되지 않아요"
                  : "그럼 LLM은 뭘까요"}
            </h2>
            {part === 1 && <WorkbookCodeIsText />}
            {part === 2 && <WorkbookChatGrowth />}
            {part === 3 && <WorkbookLlmNested />}
          </>
        )}

        {/* 1-2 어떤 AI를 쓸까: 종류 → 4컷 만화 → 연습 창 → 비교표 → 이름표와 흐름 → 정리 */}
        {lesson === 1 && gradual && part === 0 && <WorkbookAiKinds />}
        {lesson === 1 && gradual && part === 1 && <WorkbookAgentComic />}
        {lesson === 1 && gradual && part === 2 && <WorkbookAgentTryout />}
        {lesson === 1 && gradual && part === 3 && <WorkbookWhyAgent />}
        {lesson === 1 && gradual && part === 4 && <WorkbookAgentNames />}
        {lesson === 1 && !gradual && <WorkbookToolsRecap />}

        {/* 1-3 AI를 쓰는 만큼: 토큰 가위질 → 책상(컨텍스트) → 계량컵 → 요금표 → 습관 스위치 → 영수증 */}
        {lesson === workbookLessonId.usage && gradual && part === 0 && <WorkbookTokenScissors />}
        {lesson === workbookLessonId.usage && gradual && part === 1 && <WorkbookContextDesk />}
        {lesson === workbookLessonId.usage && gradual && part === 2 && <WorkbookUsageCups />}
        {lesson === workbookLessonId.usage && gradual && part === 3 && <WorkbookPlanMenu />}
        {lesson === workbookLessonId.usage && gradual && part === 4 && <WorkbookSavingHabits />}
        {lesson === workbookLessonId.usage && !gradual && <WorkbookUsageRecap />}

        {/* 1-4 도구와 작업 공간 준비: 도장 카드 → 설치 설명서 → 화면 둘러보기 → 폴더(두 장소) → 확인 → 출입증 */}
        {lesson === workbookLessonId.setup && gradual && part === 0 && <WorkbookSetupStart />}
        {lesson === workbookLessonId.setup && gradual && part === 1 && <WorkbookSetupInstall />}
        {lesson === workbookLessonId.setup && gradual && part === 2 && <WorkbookSetupTour />}
        {lesson === workbookLessonId.setup && gradual && part === 3 && <WorkbookSetupFolder />}
        {lesson === workbookLessonId.setup && gradual && part === 4 && <WorkbookSetupCheck />}
        {lesson === workbookLessonId.setup && !gradual && <WorkbookSetupRecap />}
      </div>
      <aside className={ui.lessonPanel} aria-label="학습 안내">
        <div className={ui.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>
            {
              [
                "AI의 도움과 확인할 일 구분하기",
                "챗봇과 코드 에이전트 구분하기",
                "AI가 읽고 쓰는 양 알아보기",
                "Claude Code와 작업 폴더 준비하기",
              ][lesson]
            }
          </h2>
          <p>
            {lesson === 0
              ? "초안은 함께 만들고, 내 작업에 맞는지는 직접 확인해요."
              : "챗봇은 답을 글로 주고, 코드 에이전트는 내 폴더의 파일을 직접 만들고 고쳐요."}
          </p>
          <small>개인 컴퓨터에서 실습 · 모바일에서는 복습해요.</small>
        </div>
        <WorkbookActionReturn body={body} enabled={!gradual} />
        <nav className={ui.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={currentScreen}>
            {(safeStep > 0 || part > 0) && (
              <button
                data-action-role="lesson-back"
                className={styles.quiet}
                onClick={() => {
                  if (gradual && part > 0) {
                    setRevealed((previous) => ({ ...previous, 0: part - 1 }));
                    if (part === 1) requestAnimationFrame(() => heading.current?.focus());
                  } else move(safeStep - 1);
                }}
              >
                이전 설명
              </button>
            )}
          </WorkbookLessonPrevious>
          {safeStep < LAST_STEP ? (
            <button
              data-action-role="lesson-next"
              onClick={() => {
                if (part < LAST_PART) setRevealed((previous) => ({ ...previous, 0: part + 1 }));
                else move(safeStep + 1);
              }}
            >
              다음으로
            </button>
          ) : (
            <button
              data-action-role="lesson-next"
              onClick={() => {
                p.dispatchProjectWorkflow({
                  type: "learn",
                  unit: learningUnit,
                  status: "confirmed",
                  source: "example",
                });
                onComplete(lesson);
                onBack();
              }}
            >
              학습 마치고 단원 지도로 →
            </button>
          )}
        </nav>
      </aside>
    </section>
  );
}

"use client";

// 선택과 피드백을 방문 중 보관하는 선택형 실전 연습이다.
import { practicalLabs, type PracticalStage } from "@/lib/workbook-practical-labs";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import system from "./WorkbookLesson.module.scss";

export function WorkbookPracticalLab({
  stage,
  expanded = false,
  standalone = false,
}: {
  stage: PracticalStage;
  expanded?: boolean;
  standalone?: boolean;
}) {
  const lab = practicalLabs[stage];
  const [state, setState] = useWorkbookLessonState<{
    current: number;
    answers: Record<number, number>;
  }>(`practical-${stage}`, { current: 0, answers: {} });
  const situation = lab.situations[state.current];
  const answer = state.answers[state.current];
  const content = (
    <>
      <p>{lab.intro}</p>
      <small>
        선택 연습이에요. 수업 완료 조건에는 포함되지 않으며 실제 AI 작업을 실행하지 않아요.
      </small>
      <div className={system.resultTabs} role="group" aria-label="연습 상황">
        {lab.situations.map((item, index) => (
          <button
            key={item.name}
            aria-pressed={state.current === index}
            onClick={() => setState((previous) => ({ ...previous, current: index }))}
          >
            {index + 1}. {item.name}
          </button>
        ))}
      </div>
      {standalone ? (
        <h2 className={system.screenTitle}>{situation.problem}</h2>
      ) : (
        <h3>{situation.problem}</h3>
      )}
      <div className={system.choices} role="group" aria-label="먼저 해볼 행동">
        {situation.options.map((option, index) => (
          <button
            key={option}
            className={system.choice}
            aria-label={option}
            data-answer={
              answer === index ? (index === situation.best ? "correct" : "incorrect") : undefined
            }
            aria-pressed={answer === index}
            data-result={
              answer === index ? (index === situation.best ? "correct" : "retry") : undefined
            }
            onClick={() =>
              setState((previous) => ({
                ...previous,
                answers: { ...previous.answers, [state.current]: index },
              }))
            }
          >
            <span>{option}</span>
            {answer === index && (
              <span className={system.answerMark} aria-hidden="true">
                {index === situation.best ? "✓ 정답" : "↻ 다시 살펴보기"}
              </span>
            )}
          </button>
        ))}
      </div>
      <p className={system.quizFeedback} aria-live="polite">
        {answer === undefined ? "먼저 해볼 행동을 골라봐요." : situation.reasons[answer]}
      </p>
      {answer !== undefined && (
        <div className={system.practiceStage}>
          {[
            ["내 파일에서 해볼 일", situation.task],
            ["내 상황에 맞춰 바꿔 쓸 요청", situation.request],
            ["직접 확인할 것", situation.check],
          ].map(
            ([heading, text]) =>
              text && (
                <section key={heading}>
                  <h3>{heading}</h3>
                  <p>{text}</p>
                </section>
              ),
          )}
          {situation.retry && (
            <details className={system.preparationMore}>
              <summary>경로가 같은데도 화면이 그대로라면</summary>
              <p>{situation.retry}</p>
            </details>
          )}
        </div>
      )}
      {stage === "data" && (
        <small>
          Supabase의 데이터 저장과 로그인·열람 권한은 별도로 확인해야 해요. 공개용 키와 서버 비밀
          키도 구분해요.{" "}
          <a
            href="https://supabase.com/docs/guides/database/postgres/row-level-security"
            target="_blank"
            rel="noreferrer"
          >
            행 접근 권한(RLS)
          </a>{" "}
          ·{" "}
          <a href="https://supabase.com/docs/guides/api/api-keys" target="_blank" rel="noreferrer">
            키 안내
          </a>{" "}
          (공식 자료 확인: 2026-10-16)
        </small>
      )}
      {stage === "publish" && (
        <small>
          Vercel Drop의 새 프로젝트 공개와 기존 프로젝트 갱신은 구분해요. 실제 업로드는 별도
          실습이에요.{" "}
          <a href="https://vercel.com/docs/drop" target="_blank" rel="noreferrer">
            공식 안내
          </a>{" "}
          (확인: 2026-10-16)
        </small>
      )}
    </>
  );
  return standalone ? (
    <section className={system.practiceStage} aria-label="선택 심화 연습">
      {content}
    </section>
  ) : (
    <details className={system.preparationMore} open={expanded}>
      <summary>선택 심화 · {lab.title}</summary>
      <div className={system.practiceStage}>{content}</div>
    </details>
  );
}

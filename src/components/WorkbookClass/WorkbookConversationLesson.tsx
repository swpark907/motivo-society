"use client";

import { workbookLearningExample } from "@/lib/workbook-learning-example";
import { WorkbookPromptBuilder } from "./WorkbookLessonInteractions";
import { workbookLessonLabel } from "@/lib/workbook-course";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";

// 첫 대화는 한 화면에 한 행동으로 나눈다. 외부 실습·예시와 기존 기록은 구분한다.
import { useEffect, useRef, useState } from "react";
import type { PracticeLessonProps, PracticeRecord } from "./WorkbookPracticeLesson";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import { WorkbookActionReturn } from "./WorkbookActionReturn";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const requestExample = workbookLearningExample.request;
const revisionExample = workbookLearningExample.revision;
const firstResult = workbookLearningExample.firstResult;
const screens = [
  ["요청의 기본", "첫 요청은 작은 일 하나로"],
  ["실습 방식", "어떻게 따라갈까요?"],
  ["첫 요청", "무엇을 만들지 구체적으로 말해요"],
  ["답변 확인", "잘 쓴 답변인지 직접 확인해요"],
  ["수정 요청", "바꿀 것과 유지할 것을 함께 말해요"],
  ["수정 결과", "수정 뒤에도 다시 확인해요"],
  ["학습 확인", "비교할 수 있게 요청해봐요"],
  ["학습 정리", "요청하고, 확인하고, 고쳐요"],
];

export function WorkbookConversationLesson({
  record,
  ready,
  onChange,
  onBack,
  onComplete,
}: PracticeLessonProps) {
  const p = useWorkbookProgress();
  const [screen, setScreen] = useWorkbookLessonState("conversation-screen", 0);
  const [answer, setAnswer] = useWorkbookLessonState<number | null>("practice-3-answer", null);
  const [exampleStage, setExampleStage] = useWorkbookLessonState("practice-3-exampleStage", 0);
  const [copyStatus, setCopyStatus] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const initialResult = useRef<HTMLElement>(null);
  const comparison = useRef<HTMLDivElement>(null);
  const computer = record.mode === "computer";
  const written = [record.request, record.observation, record.revision].every((value) =>
    value.trim(),
  );
  const complete =
    written &&
    answer === 1 &&
    (computer
      ? ready && record.checks.every(Boolean)
      : record.mode === "example" && exampleStage === 2);
  const blocked = [
    false,
    record.mode === null,
    !record.request.trim(),
    !record.observation.trim() || (!computer && exampleStage < 1),
    !record.revision.trim(),
    !computer && exampleStage !== 2,
    !complete,
    !complete,
  ][screen];
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [screen]);
  function move(next: number) {
    setCopyStatus("");
    setScreen(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function update(patch: Partial<PracticeRecord>) {
    setCopyStatus("");
    onChange({ ...record, ...patch });
    p.dispatchProjectWorkflow({ type: "learn", unit: "ai-4", status: "in-progress" });
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus("요청을 복사했어요. AI 앱의 같은 대화에 붙여넣고 보내주세요.");
    } catch {
      setCopyStatus("복사하지 못했어요. 요청문을 선택해 직접 복사해주세요.");
    }
  }
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="agent"
        point={3}
        headingRef={heading}
        onBack={onBack}
        current={screen + 1}
        total={8}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        <h2 className={system.screenTitle}>{screens[screen][1]}</h2>
        {screen === 0 && <WorkbookPromptBuilder />}
        {screen === 1 && (
          <section className={system.exampleQuestion} aria-label="실습 방식 선택">
            <p data-current-action tabIndex={-1}>
              지금 사용할 방식을 하나 골라주세요.
            </p>
            <div className={system.choices}>
              <button
                className={system.choice}
                disabled={!ready}
                aria-pressed={computer}
                onClick={() => {
                  update({ mode: "computer", checks: [false, false, false] });
                  setExampleStage(0);
                }}
              >
                내 컴퓨터에서 실습하기
              </button>
              <button
                className={system.choice}
                aria-pressed={record.mode === "example"}
                onClick={() => {
                  update({ mode: "example", checks: [false, false, false] });
                  setExampleStage(0);
                }}
              >
                예시로 복습하기
              </button>
            </div>
            <p>
              {ready
                ? "컴퓨터에서는 준비한 AI 앱을 열어요. 예시 복습은 미리 만든 결과를 비교하며, 입력한 요청에 따라 답변이 생성되지는 않아요."
                : "컴퓨터 실습은 1-3 준비 확인 후 이용해요. 예시 복습은 미리 만든 결과를 비교하며, 입력한 요청에 따라 답변이 생성되지는 않아요."}
            </p>
            <small>
              방식을 바꿔도 작성한 내용은 남아요. 확인 체크와 예시 조작만 다시 시작해요.
            </small>
          </section>
        )}
        {screen === 2 && (
          <section className={system.practiceStage} aria-label="첫 요청 작성">
            <section className={system.learningGroup}>
              <p data-current-action tabIndex={-1}>
                {computer
                  ? "요청을 작성하고 복사한 뒤, 준비한 앱에 보내주세요."
                  : "예시 요청을 가져오거나 직접 적어보세요. 다음 화면에서 준비된 답변을 살펴봐요."}
              </p>
              <p>
                ‘두 문장’은 길이를, ‘처음 방문한 사람’은 독자를, ‘알려준 작업만’은 사용할 정보의
                범위를 정해줘요. 아래 요청을 읽으며 각 문장이 어떤 추측을 줄이는지 살펴보세요.
              </p>
              <label className={system.practiceField}>
                첫 요청
                <textarea
                  value={record.request}
                  onChange={(e) =>
                    update({ request: e.target.value, checks: [false, false, false] })
                  }
                  placeholder={requestExample}
                />
              </label>
              <div className={system.practiceActions}>
                <button
                  onClick={() => update({ request: requestExample, checks: [false, false, false] })}
                >
                  예시 요청 가져오기
                </button>
                {computer && (
                  <button
                    disabled={!record.request.trim()}
                    onClick={() => void copy(record.request)}
                  >
                    요청 복사하기
                  </button>
                )}
              </div>
              {copyStatus && <p role="status">{copyStatus}</p>}
            </section>
            {computer && (
              <ol className={system.decisionSteps}>
                <li>
                  <strong>같은 작업 열기</strong>
                  <span>
                    AI 앱에서 1-3 수업의 <code>my-first-web</code> 작업을 열어요.
                  </span>
                </li>
                <li>
                  <strong>붙여넣고 보내기</strong>
                  <span>
                    Windows는 Ctrl+V, Mac은 Command+V로 붙여넣어요. 복사만으로 전송되지는 않아요.
                  </span>
                </li>
              </ol>
            )}
          </section>
        )}
        {screen === 3 && (
          <section className={system.practiceStage} aria-label="답변 확인과 관찰">
            <p data-current-action tabIndex={-1}>
              {computer
                ? "AI 앱에서 답변을 읽고 워크북으로 돌아와 확인한 점을 적어주세요."
                : "준비된 답변을 열고, 조건과 맞는지 읽어보세요."}
            </p>
            {!computer && (
              <>
                {exampleStage === 0 && (
                  <button
                    className={system.practiceReveal}
                    onClick={() => {
                      setExampleStage(1);
                      requestAnimationFrame(() => initialResult.current?.focus());
                    }}
                  >
                    미리 만든 결과 살펴보기
                  </button>
                )}
                {exampleStage > 0 && (
                  <section
                    ref={initialResult}
                    tabIndex={-1}
                    className={system.preview}
                    aria-label="첫 답변 예시"
                  >
                    <small>장소 소개 · 사전 제작 예시</small>
                    <p>{firstResult}</p>
                  </section>
                )}
              </>
            )}
            <section className={system.learningGroup} aria-label="답변 확인 기준과 관찰">
              <dl className={system.checkCriteria}>
                <div>
                  <dt>내용</dt>
                  <dd>창가 자리·독서·주말 혼잡 정보를 담았나요?</dd>
                </div>
                <div>
                  <dt>길이</dt>
                  <dd>두 문장인가요? 읽기에는 어떤가요?</dd>
                </div>
                <div>
                  <dt>사실</dt>
                  <dd>알려주지 않은 실적이나 숫자는 없나요?</dd>
                </div>
              </dl>
              <label className={system.practiceField}>
                확인한 점 하나
                <textarea
                  value={record.observation}
                  onChange={(e) => update({ observation: e.target.value })}
                  placeholder="예: 두 문장이고 장소의 특징이 들어 있어요. 첫 문장은 조금 길어요."
                />
              </label>
            </section>
          </section>
        )}
        {screen === 4 && (
          <section className={system.practiceStage} aria-label="수정 요청 작성">
            <p data-current-action tabIndex={-1}>
              {computer
                ? "바꿀 부분과 유지할 부분을 적고, 같은 AI 대화에 보내주세요."
                : "예시에서는 첫 문장을 줄여볼게요. 바꿀 것과 유지할 것을 함께 적어보세요."}
            </p>
            <table
              className={`${system.aiResultTable} ${system.aiCheckTable}`}
              aria-label="수정 요청의 두 기준"
            >
              <thead>
                <tr>
                  <th scope="col">구분</th>
                  <th scope="col">이번 수정 예시</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">바꿀 것</th>
                  <td>첫 문장을 더 짧게</td>
                </tr>
                <tr>
                  <th scope="row">유지할 것</th>
                  <td>창가 자리·독서·주말 혼잡 정보</td>
                </tr>
              </tbody>
            </table>
            <section className={system.learningGroup}>
              <label className={system.practiceField}>
                수정 요청
                <textarea
                  value={record.revision}
                  onChange={(e) =>
                    update({ revision: e.target.value, checks: [false, false, false] })
                  }
                  placeholder={revisionExample}
                />
              </label>
              <div className={system.practiceActions}>
                <button
                  onClick={() =>
                    update({ revision: revisionExample, checks: [false, false, false] })
                  }
                >
                  수정 예시 가져오기
                </button>
                {computer && (
                  <button
                    disabled={!record.revision.trim()}
                    onClick={() => void copy(record.revision)}
                  >
                    수정 요청 복사하기
                  </button>
                )}
              </div>
              {copyStatus && <p role="status">{copyStatus}</p>}
            </section>
          </section>
        )}
        {screen === 5 && (
          <section className={system.practiceStage} aria-label="수정 전후 비교">
            <p data-current-action tabIndex={-1}>
              {computer
                ? "AI 앱의 이전 답변과 새 답변을 비교해주세요."
                : "준비된 수정 결과를 열고 이전 답변과 비교해보세요."}
            </p>
            {computer ? (
              <dl className={system.recapPoints}>
                <div>
                  <dt>바꾼 부분</dt>
                  <dd>바꿔달라고 요청한 부분이 반영됐는지 확인해요.</dd>
                </div>
                <div>
                  <dt>유지한 부분</dt>
                  <dd>유지해달라고 한 내용이 그대로 남아 있는지 확인해요.</dd>
                </div>
              </dl>
            ) : (
              <>
                {exampleStage !== 2 && (
                  <button
                    className={system.practiceReveal}
                    onClick={() => {
                      setExampleStage(2);
                      requestAnimationFrame(() => comparison.current?.focus());
                    }}
                  >
                    미리 만든 수정 결과 보기
                  </button>
                )}
                {exampleStage === 2 && (
                  <>
                    <div
                      ref={comparison}
                      tabIndex={-1}
                      className={system.textComparison}
                      aria-live="polite"
                    >
                      <section>
                        <h3>수정 전</h3>
                        <p>
                          <mark>창가 자리가 있어 혼자 책을 읽으며 쉬어가기 좋은 공간입니다.</mark>{" "}
                          주말에는 사람이 많으니 방문 시간을 참고해주세요.
                        </p>
                      </section>
                      <section>
                        <h3>수정 후</h3>
                        <p>
                          <mark>창가에서 혼자 책 읽기 좋은 공간입니다.</mark> 주말에는 사람이 많으니
                          방문 시간을 참고해주세요.
                        </p>
                      </section>
                    </div>
                    <small>밑줄 친 첫 문장이 짧아졌어요. 주말 혼잡 안내는 그대로예요.</small>
                  </>
                )}
              </>
            )}
            <p className={system.aiKeyTakeaway}>
              짧아진 것만 보지 말고, <strong>유지해달라고 한 내용</strong>도 다시 확인해요.
            </p>
            {computer && (
              <details className={system.preparationMore}>
                <summary>다음 수업의 첫 화면에 쓸 소개 남기기 (선택)</summary>
                <label className={system.practiceField}>
                  첫 화면에 이어 쓸 소개
                  <textarea
                    value={p.projectWorkflow.notes["first-intro"]?.text ?? ""}
                    onChange={(e) =>
                      p.dispatchProjectWorkflow({
                        type: "note",
                        key: "first-intro",
                        text: e.target.value,
                      })
                    }
                    placeholder="직접 확인한 소개 문장을 남겨두면 다음 수업에서 이어 쓸 수 있어요."
                  />
                </label>
              </details>
            )}
          </section>
        )}
        {screen === 6 && (
          <section className={system.exampleQuestion} aria-label="수정 요청 확인 문제">
            <p data-current-action tabIndex={-1}>
              소개문을 더 짧게 만들고 싶어요. 비교하기 좋은 요청을 하나 골라주세요.
            </p>
            <div className={system.choices}>
              {[
                "마음에 안 들어. 알아서 다시 해줘",
                "첫 문장은 짧게 바꾸고 장소의 특징은 유지해줘",
              ].map((value, index) => (
                <button
                  key={value}
                  className={system.choice}
                  aria-label={value}
                  aria-pressed={answer === index}
                  data-answer={
                    answer === index ? (index === 1 ? "correct" : "incorrect") : undefined
                  }
                  onClick={() => {
                    setAnswer(index);
                    p.dispatchProjectWorkflow({
                      type: "learn",
                      unit: "ai-4",
                      status: "in-progress",
                    });
                  }}
                >
                  {value}
                  {answer === index && (
                    <span className={system.answerMark}>{index === 1 ? "✓ 정답" : "× 오답"}</span>
                  )}
                </button>
              ))}
            </div>
            <p role="status" className={system.quizFeedback}>
              {answer === null
                ? ""
                : answer === 1
                  ? "맞아요. 바꿀 부분과 유지할 부분을 함께 말하면 수정 전후를 비교할 수 있어요."
                  : "무엇을 바꿀지 알기 어려워요. 바꿀 것과 유지할 것을 짚어볼까요?"}
            </p>
            {computer && (
              <section className={system.learningGroup}>
                <h3>직접 실습한 항목만 표시해주세요</h3>
                <div className={system.setupChecks}>
                  {[
                    "준비한 앱에 첫 요청을 직접 보냈어요",
                    "답변을 읽고 확인한 점을 기록했어요",
                    "수정 요청을 보내고 새 답변을 비교했어요",
                  ].map((value, index) => (
                    <label key={value}>
                      <input
                        type="checkbox"
                        checked={record.checks[index]}
                        onChange={(e) =>
                          update({
                            checks: record.checks.map((checked, i) =>
                              i === index ? e.target.checked : checked,
                            ),
                          })
                        }
                      />
                      {value}
                    </label>
                  ))}
                </div>
              </section>
            )}
            <small>
              {computer
                ? "실제 실습은 본인 확인으로 기록해요. 외부 앱을 자동 검사하지 않아요."
                : "미리 만든 예시를 비교한 복습으로 기록돼요. 실제 AI 앱 실습과는 구분해요."}
            </small>
          </section>
        )}
        {screen === 7 && (
          <>
            <section aria-labelledby="conversation-recap">
              <h3 id="conversation-recap">배운 핵심</h3>
              <dl className={system.recapPoints}>
                <div>
                  <dt>요청</dt>
                  <dd>무엇을·누구에게·어떤 조건으로 만들지 알려줘요.</dd>
                </div>
                <div>
                  <dt>확인</dt>
                  <dd>답변의 내용·길이·사실이 요청과 맞는지 봐요.</dd>
                </div>
                <div>
                  <dt>수정</dt>
                  <dd>바꿀 것과 유지할 것을 말하고 결과를 다시 비교해요.</dd>
                </div>
              </dl>
            </section>
            <details className={system.preparationMore}>
              <summary>내 대화 기록 보기</summary>
              <dl className={system.recapPoints}>
                <div>
                  <dt>첫 요청</dt>
                  <dd>{record.request}</dd>
                </div>
                <div>
                  <dt>확인한 점</dt>
                  <dd>{record.observation}</dd>
                </div>
                <div>
                  <dt>수정 요청</dt>
                  <dd>{record.revision}</dd>
                </div>
              </dl>
            </details>
            <section className={system.nextLesson}>
              <small>다음 수업</small>
              <h3>{workbookLessonLabel("agent", 4)}</h3>
              <p>문장으로 받은 답변에서 실제 파일과 화면을 만드는 작업으로 이어가요.</p>
            </section>
            <p className={system.recapScope}>
              {computer ? "외부 도구 실습 · 본인 확인" : "사전 제작 예시 복습"}으로 남겨요. 이번
              수업에서는 파일을 만들거나 바꾸지 않았어요.
            </p>
          </>
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>요청·확인·수정의 첫 경험</h2>
          <p>작게 부탁하고, 나온 결과를 보고, 한 부분을 고쳐봐요.</p>
          <small>
            {screen > 1
              ? computer
                ? "외부 앱에서 직접 실습"
                : "미리 만든 예시로 복습"
              : "실제 실습과 예시 복습을 구분해요."}
          </small>
        </div>
        <WorkbookActionReturn body={body} enabled={screen >= 2 && screen <= 6} />
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={screen + 1}>
            {screen > 0 && (
              <button data-action-role="lesson-back" onClick={() => move(screen - 1)}>
                이전 설명
              </button>
            )}
          </WorkbookLessonPrevious>
          {screen < 7 ? (
            <button
              data-action-role={"lesson-next"}
              disabled={blocked}
              onClick={() => move(screen + 1)}
            >
              {screen === 6 ? "학습 정리 보기" : "다음으로"}
            </button>
          ) : (
            <button
              data-action-role={"lesson-next"}
              disabled={!complete}
              onClick={() => {
                p.dispatchProjectWorkflow({
                  type: "learn",
                  unit: "ai-4",
                  status: "confirmed",
                  source: computer ? "computer" : "example",
                });
                onComplete();
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

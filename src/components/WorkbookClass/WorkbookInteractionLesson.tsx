"use client";

import { useEffect, useId, useRef, useState } from "react";
import { workbookLessonLabel } from "@/lib/workbook-course";
import { workbookPlanExample } from "@/lib/workbook-page-plan";
import { dataProgress } from "@/lib/workbook-data";
import type { DataLessonProps } from "./WorkbookDataLesson";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";
import { WorkbookActionReturn } from "./WorkbookActionReturn";
import { WorkbookDetailExample } from "./WorkbookDetailExample";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const titles = [
  "입력 → 버튼 누르기 → 화면 변화",
  "적기만 하면 페이지에도 나타날까요?",
  "입력창과 페이지의 글을 비교해봐요",
  "무엇이 화면을 바꿨나요?",
  "보이는 것과 저장되는 것은 달라요",
];
const choices = ["입력하는 즉시 페이지에 나타나요", "화면에 표시하기 버튼을 눌러야 나타나요"];

export function WorkbookInteractionLesson({
  project,
  record,
  onChange,
  onBack,
  onStep,
}: DataLessonProps) {
  const [screen, setScreen] = useWorkbookLessonState("data-interaction-screen", 0);
  const [message, setMessage] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const id = useId();
  const displayed = dataProgress(record).displayed;
  const predicted = record.predictions[0] !== null;
  const blocked = screen === 1 ? !predicted : screen >= 2 ? !displayed : false;
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [screen]);
  function move(next: number) {
    setScreen(next);
    setMessage("");
    requestAnimationFrame(() => heading.current?.focus());
  }
  function display() {
    const text = record.draft.trim();
    if (!text || !predicted) return;
    const changed = text !== record.source;
    onChange({
      ...record,
      mode: "example",
      shown: text,
      source: text,
      displayed: true,
      ...(changed ? { withoutSave: false, withSave: false, otherChecked: false } : {}),
    });
    setMessage("버튼이 입력창의 글을 받아 페이지의 메모를 바꿨어요.");
  }
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="data"
        point={0}
        headingRef={heading}
        onBack={onBack}
        current={screen + 1}
        total={5}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        <h2 className={system.screenTitle}>{titles[screen]}</h2>
        {screen === 0 && (
          <section className={system.practiceStage}>
            <p>
              앞에서는 페이지가 어떻게 보이는지 살펴봤어요. 이제는{" "}
              <strong>내 행동에 따라 화면이 달라지는 과정</strong>을 알아봐요.
            </p>
            <p>
              장소를 누르면 설명이 펼쳐지고, 마음에 드는 곳에 관심 표시를 하고, 방문자 메시지를
              읽는다고 생각해보세요. 비슷한 버튼처럼 보여도 필요한 동작과 데이터는 달라요. 이번에는
              그 원리를 <strong>한 줄 메모를 표시하는 작은 실험</strong>으로 살펴봅니다. 내 소개
              페이지에 메모 기능을 꼭 넣어야 한다는 뜻은 아니에요.
            </p>
            <table
              className={`${system.aiResultTable} ${system.aiCheckTable}`}
              aria-label="입력에서 화면 변화까지"
            >
              <thead>
                <tr>
                  <th scope="col">과정</th>
                  <th scope="col">이번 메모 예시에서</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">입력</th>
                  <td>한 줄 메모를 적어요. 입력한 글도 데이터예요.</td>
                </tr>
                <tr>
                  <th scope="row">동작</th>
                  <td>화면에 표시하기 버튼을 눌러요.</td>
                </tr>
                <tr>
                  <th scope="row">화면 변화</th>
                  <td>입력한 글이 페이지의 메모로 나타나요.</td>
                </tr>
              </tbody>
            </table>
            <p className={system.aiKeyTakeaway}>
              어떤 행동이 화면을 바꾸는지는 <strong>만들어 둔 동작 규칙</strong>에 달려 있어요.
            </p>
            <p className={system.recapScope}>
              워크북 안의 학습 예시예요. 내 index.html이나 실제 저장소는 바꾸지 않아요. 실제
              새로고침 시 이번 방문의 예시와 학습 상태는 초기화돼요.
            </p>
          </section>
        )}
        {screen === 1 && (
          <section className={system.practiceStage}>
            <p>
              이 예시는 <strong>입력창의 글과 페이지에 표시할 글</strong>을 나눠 두었어요. 언제
              페이지의 메모가 바뀔지 하나를 골라보세요.
            </p>
            <div className={system.choices} role="group" aria-label="결과 예측">
              {choices.map((label, index) => (
                <button
                  key={label}
                  className={system.choice}
                  aria-pressed={record.predictions[0] === index}
                  data-answer={
                    displayed && record.predictions[0] === index
                      ? index === 1
                        ? "correct"
                        : "incorrect"
                      : undefined
                  }
                  onClick={() =>
                    onChange({
                      ...record,
                      predictions: record.predictions.map((value, i) => (i === 0 ? index : value)),
                    })
                  }
                >
                  <span>{label}</span>
                  {displayed && record.predictions[0] === index && (
                    <span className={system.answerMark}>
                      {index === 1 ? "✓ 확인" : "× 다시 생각"}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className={system.planningHint}>
              선택하면 다음 버튼이 열려요. 정답을 맞히기보다 다음 실험에서 차이를 확인해보세요.
            </p>
          </section>
        )}
        {screen === 2 && (
          <section className={system.practiceStage}>
            <section className={system.learningGroup}>
              <label className={system.practiceField} htmlFor={`${id}-draft`}>
                예시에 표시할 한 줄
                <textarea
                  id={`${id}-draft`}
                  rows={2}
                  value={record.draft}
                  onChange={(event) => {
                    onChange({ ...record, draft: event.target.value });
                    setMessage("");
                  }}
                  placeholder="예: 다음에는 버튼 이름을 더 쉽게 바꿔보기"
                />
              </label>
              <div className={system.practiceActions}>
                <button disabled={!record.draft.trim() || !predicted} onClick={display}>
                  화면에 표시하기
                </button>
              </div>
            </section>
            <section className={system.preview} aria-label="홈페이지 메모 예시" aria-live="polite">
              <small>{project.title.trim() || workbookPlanExample.title} · 학습 예시</small>
              <h3>페이지에 표시한 메모</h3>
              <p>{record.shown || "아직 표시한 메모가 없어요"}</p>
            </section>
            <p className={system.planningHint}>
              입력만 바꾸면 아래 메모는 그대로예요. 버튼을 누르면 새 글로 바뀌는지 비교해보세요.
            </p>
            {message && (
              <p className={system.quizFeedback} role="status">
                {message}
              </p>
            )}
          </section>
        )}
        {screen === 3 && (
          <section className={system.practiceStage}>
            <dl className={system.recapPoints}>
              <div>
                <dt>마지막 표시</dt>
                <dd>{record.source}</dd>
              </div>
              <div>
                <dt>화면을 바꾼 행동</dt>
                <dd>화면에 표시하기 버튼 누르기</dd>
              </div>
            </dl>
            <p className={system.quizFeedback}>
              {record.predictions[0] === 1 ? "예측대로, " : "처음 예측과 달리, "}
              <strong>버튼을 눌렀을 때</strong> 페이지의 메모가 바뀌었어요. 입력하는 즉시 바뀌는
              화면도 만들 수 있지만, 이번 예시는 버튼 동작으로 연결했어요.
            </p>
            <p>
              입력창과 표시 영역이 <strong>서로 다른 값을 기억</strong>하기 때문이에요. 입력창의
              글을 고쳐도 표시 영역의 값은 그대로이고, 버튼을 누를 때 새 글을 받아 바뀝니다. 무엇을
              기억하고 어떤 행동으로 바꿀지 정하면 다른 화면 동작도 이해하기 쉬워요.
            </p>
            <details className={system.preparationMore}>
              <summary>선택 · 항목을 고르면 화면은 어떻게 바뀔까요?</summary>
              <WorkbookDetailExample appearance="lesson" />
            </details>
            <details className={system.preparationMore}>
              <summary>이 동작을 부르는 이름</summary>
              <p>
                버튼을 누른 일이 <strong>이벤트</strong>예요. 입력 중인 글과 페이지에 표시한 글처럼
                화면이 지금 기억하는 값은 <strong>상태</strong>라고 해요. 두 값을 따로 두었기 때문에
                입력만 바꾸어도 표시한 메모는 그대로일 수 있어요. JavaScript는 이런 행동과 화면
                변화를 연결하는 데 사용하는 프로그래밍 언어예요.
              </p>
            </details>
          </section>
        )}
        {screen === 4 && (
          <>
            <dl className={system.recapPoints}>
              <div>
                <dt>입력한 데이터</dt>
                <dd>한 줄 메모</dd>
              </div>
              <div>
                <dt>확인한 동작</dt>
                <dd>버튼을 누르면 입력한 글을 페이지에 표시</dd>
              </div>
            </dl>
            <p className={system.aiKeyTakeaway}>
              화면에 보인다고 <strong>다음에 열어도 남는 것은 아니에요.</strong> 표시와 저장은 나눠
              확인해요.
            </p>
            <section className={system.nextLesson}>
              <small>다음 수업</small>
              <h3>{workbookLessonLabel("data", 1)}</h3>
              <p>방금 표시한 글을 저장하지 않았을 때와 저장했을 때를 비교해요.</p>
            </section>
          </>
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>내 행동과 화면의 변화 연결하기</h2>
          <p>입력만 했을 때와 버튼을 눌렀을 때를 직접 비교해요.</p>
          <small>표시 실험 · 실제 파일과 저장은 별도</small>
        </div>
        <WorkbookActionReturn body={body} enabled={screen === 2} />
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={screen + 1}>
            {screen > 0 && <button onClick={() => move(screen - 1)}>이전 설명</button>}
          </WorkbookLessonPrevious>
          {screen < 4 ? (
            <button disabled={blocked} onClick={() => move(screen + 1)}>
              다음으로
            </button>
          ) : (
            <button disabled={!displayed} onClick={() => onStep(1)}>
              새로고침과 저장으로 →
            </button>
          )}
        </nav>
      </aside>
    </section>
  );
}

"use client";

import { useEffect, useId, useRef } from "react";
import { workbookLessonLabel } from "@/lib/workbook-course";
import { dataProgress } from "@/lib/workbook-data";
import type { DataLessonProps } from "./WorkbookDataLesson";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";
import { WorkbookActionReturn } from "./WorkbookActionReturn";
import { WorkbookOptionalPractice } from "./WorkbookOptionalPractice";
import { WorkbookPracticalLab } from "./WorkbookPracticalLab";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const titles = [
  "저장한 메모, 다른 기기에도 보일까요?",
  "기기가 달라지면 저장 칸도 달라요",
  "함께 읽을 데이터를 서버에 요청해요",
  "서버와 함께 쓸 저장소가 필요한 경우는?",
  "표시·저장·공유를 내 말로 정리해요",
  "어디에 보관하고 누가 읽는지 확인해요",
];
const predictions = [
  "다른 기기에도 같은 메모가 보여요",
  "그 브라우저에만 있어서 다른 기기에는 없어요",
];
const cases = [
  "혼자 이 브라우저에서만 다시 읽는 메모",
  "친구가 다른 컴퓨터에서 쓴 답장을 함께 읽기",
];

export function WorkbookSharedDataLesson({
  record,
  onChange,
  onBack,
  onStep,
  onComplete,
}: DataLessonProps) {
  const p = useWorkbookProgress();
  const [savedScreen, setScreen] = useWorkbookLessonState("data-shared-screen", 0);
  const [basis, setBasis] = useWorkbookLessonState("data-shared-source", record.source);
  const [other, setOther] = useWorkbookLessonState("data-other", false);
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const id = useId();
  const progress = dataProgress(record);
  const screen = progress.stored && basis === record.source ? savedScreen : 0;
  const blocked =
    !progress.stored ||
    (screen === 0 && record.predictions[2] === null) ||
    (screen === 1 && !record.otherChecked) ||
    (screen === 3 && record.serverChoice !== 1) ||
    (screen >= 4 && !progress.verified);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [screen]);
  function move(next: number) {
    setBasis(record.source);
    setScreen(next);
    if (next === 1) setOther(false);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function finish() {
    p.dispatchProjectWorkflow({
      type: "learn",
      unit: "data",
      status: "confirmed",
      source: "example",
    });
    onComplete();
  }
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="data"
        point={2}
        headingRef={heading}
        onBack={onBack}
        current={screen + 1}
        total={6}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        <h2 className={system.screenTitle}>{titles[screen]}</h2>
        {!progress.stored ? (
          <section className={system.practiceStage}>
            <p>먼저 4-2에서 메모를 저장하고 다시 읽어보세요. 이전 메모와 설명 기록은 유지돼요.</p>
            <div className={system.practiceActions}>
              <button onClick={() => onStep(1)}>4-2 저장 실험으로 돌아가기</button>
            </div>
          </section>
        ) : (
          <>
            {screen === 0 && (
              <section className={system.practiceStage}>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>4-2에서 저장한 글</dt>
                    <dd>{record.saved}</dd>
                  </div>
                </dl>
                <p>
                  같은 페이지를 다른 기기에서 열면 이 메모도 보일까요?{" "}
                  <strong>이 브라우저에만 저장한 경우</strong>를 생각해보세요.
                </p>
                <div className={system.choices} role="group" aria-label="기기 결과 예측">
                  {predictions.map((text, index) => (
                    <button
                      key={text}
                      className={system.choice}
                      aria-pressed={record.predictions[2] === index}
                      data-answer={
                        record.otherChecked && record.predictions[2] === index
                          ? index === 1
                            ? "correct"
                            : "incorrect"
                          : undefined
                      }
                      onClick={() =>
                        onChange({
                          ...record,
                          predictions: record.predictions.map((value, i) =>
                            i === 2 ? index : value,
                          ),
                        })
                      }
                    >
                      <span>{text}</span>
                      {record.otherChecked && record.predictions[2] === index && (
                        <span className={system.answerMark}>
                          {index === 1 ? "✓ 확인" : "× 다시 생각"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className={system.recapScope}>
                  기기 연결이나 동기화 없이 결과를 비교하는 학습 예시예요. 실제 데이터는 전송하지
                  않아요.
                </p>
              </section>
            )}
            {screen === 1 && (
              <section className={system.practiceStage}>
                <div className={system.resultTabs} role="group" aria-label="기기 예시">
                  <button aria-pressed={!other} onClick={() => setOther(false)}>
                    이 브라우저 예시 보기
                  </button>
                  <button
                    aria-pressed={other}
                    onClick={() => {
                      setOther(true);
                      onChange({ ...record, otherChecked: true });
                    }}
                  >
                    다른 기기 예시 보기
                  </button>
                </div>
                <section
                  className={system.preview}
                  role="region"
                  aria-label="기기별 메모 예시"
                  aria-live="polite"
                >
                  <h3>{other ? "다른 기기의 브라우저" : "메모를 저장한 브라우저"}</h3>
                  <dl className={system.recapPoints}>
                    <div>
                      <dt>저장 칸</dt>
                      <dd>{other ? "비어 있어요" : record.saved}</dd>
                    </div>
                    <div>
                      <dt>화면의 메모</dt>
                      <dd>{other ? "표시할 메모가 없어요" : record.saved}</dd>
                    </div>
                  </dl>
                </section>
                {record.otherChecked && (
                  <p className={system.quizFeedback} role="status">
                    {record.predictions[2] === 1 ? "예측대로, " : "처음 예측과 달리, "}
                    <strong>이 브라우저에만 저장한 메모</strong>는 다른 기기에 자동으로 옮겨지지
                    않았어요. 페이지를 여는 것과 메모를 공유하는 것은 달라요.
                  </p>
                )}
                <p className={system.planningHint}>
                  이 예시는 브라우저 저장만 사용한 경우예요. 계정으로 데이터를 동기화하는 서비스와는
                  구분해요.
                </p>
              </section>
            )}
            {screen === 2 && (
              <section className={system.practiceStage}>
                <p>
                  친구가 남긴 답장을 내 기기에서도 읽으려면, 각 브라우저의 저장 칸 대신{" "}
                  <strong>함께 읽고 쓸 곳</strong>이 필요해요.
                </p>
                <p>
                  장소 소개에 친구가 “두 번째 장소가 궁금해요”라는 답장을 남겼다고 생각해보세요. 내
                  컴퓨터에서도 읽으려면 아래처럼 메시지가 오가는 길이 필요합니다.
                </p>
                <ol>
                  <li>친구의 브라우저가 서버에 답장을 보내요.</li>
                  <li>서버가 요청을 처리하고 데이터베이스에 답장을 보관해요.</li>
                  <li>내 브라우저가 서버에 메시지 목록을 요청해요.</li>
                  <li>서버가 보낸 답장을 내 화면에서 읽어요.</li>
                </ol>
                <table
                  className={`${system.aiResultTable} ${system.aiCheckTable}`}
                  aria-label="서버와 저장소의 역할"
                >
                  <thead>
                    <tr>
                      <th scope="col">이름</th>
                      <th scope="col">하는 일</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">서버</th>
                      <td>
                        여러 기기의 요청을 받고 필요한 데이터나 처리 결과를 보내주는 컴퓨터예요.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">데이터베이스</th>
                      <td>답장 같은 데이터를 정리해 보관하고 찾는 데 쓰는 저장소예요.</td>
                    </tr>
                  </tbody>
                </table>
                <p className={system.aiKeyTakeaway}>
                  <strong>서버와 저장소의 역할은 달라요.</strong> 함께 쓸 때 여러 기기가 같은
                  데이터를 읽고 바꿀 수 있어요.
                </p>
              </section>
            )}
            {screen === 3 && (
              <section className={system.practiceStage}>
                <p>누가 어느 기기에서 읽는지 생각하고 골라보세요.</p>
                <div className={system.choices} role="group" aria-label="서버가 필요한 경우">
                  {cases.map((text, index) => (
                    <button
                      key={text}
                      className={system.choice}
                      aria-pressed={record.serverChoice === index}
                      data-answer={
                        record.serverChoice === index
                          ? index === 1
                            ? "correct"
                            : "incorrect"
                          : undefined
                      }
                      onClick={() => onChange({ ...record, serverChoice: index })}
                    >
                      <span>{text}</span>
                      {record.serverChoice === index && (
                        <span className={system.answerMark}>
                          {index === 1 ? "✓ 확인" : "× 다시 생각"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className={system.quizFeedback}>
                  {record.serverChoice === null
                    ? "같은 브라우저에서만 읽는 경우와, 다른 사람의 기기에서 쓴 데이터를 읽는 경우를 비교해보세요."
                    : record.serverChoice === 1
                      ? "친구의 답장을 내 기기에서도 읽으려면 함께 쓰는 서버와 저장소가 필요해요. 누가 읽고 쓸 수 있는지도 정해야 해요."
                      : "혼자 같은 브라우저에서만 다시 읽는 메모는 브라우저 저장으로 만들 수 있어요. 다른 사람·다른 기기와 함께 읽는 경우를 다시 골라보세요."}
                </p>
                <p className={system.aiKeyTakeaway}>
                  <strong>모든 버튼에 서버가 필요한 것은 아니에요.</strong> 목록 열기나 이번 메모
                  표시처럼 브라우저 안에서 처리할 수 있는 동작도 있어요.
                </p>
              </section>
            )}
            {screen === 4 && (
              <section className={system.practiceStage}>
                <p>
                  모두에게 같은 장소 소개를 보여주는 것과 사람마다 자기 메모를 남기는 것은 달라요.
                  개인 메모라면 ‘누가 로그인했는가’에 더해{" "}
                  <strong>누가 어떤 메모를 읽고 고칠 수 있는가</strong>도 정해야 합니다. 이 차이는
                  나중에 저장·로그인을 붙일 때 중요해요.
                </p>
                <p data-current-action tabIndex={-1}>
                  같은 메모가 다른 기기에 보이지 않았던 이유를 한 문장으로 남겨주세요.
                </p>
                <table
                  className={`${system.aiResultTable} ${system.aiCheckTable}`}
                  aria-label="표시 저장 공유 요약"
                >
                  <tbody>
                    <tr>
                      <th scope="row">표시</th>
                      <td>지금 열린 화면에 보여줘요.</td>
                    </tr>
                    <tr>
                      <th scope="row">브라우저 저장</th>
                      <td>같은 브라우저에서 다시 읽을 값을 보관해요.</td>
                    </tr>
                    <tr>
                      <th scope="row">함께 읽기</th>
                      <td>여러 기기가 같은 데이터를 읽을 저장소와 규칙을 마련해요.</td>
                    </tr>
                  </tbody>
                </table>
                <label className={system.practiceField} htmlFor={`${id}-reason`}>
                  표시·저장·공유가 다른 이유
                  <textarea
                    id={`${id}-reason`}
                    rows={4}
                    value={record.reason}
                    onChange={(event) => onChange({ ...record, reason: event.target.value })}
                    placeholder="어디에 저장했으며, 다른 기기는 어디에서 읽으려고 했나요?"
                  />
                </label>
              </section>
            )}
            {screen === 5 && (
              <>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>비교한 메모</dt>
                    <dd>{record.saved}</dd>
                  </div>
                  <div>
                    <dt>내가 정리한 이유</dt>
                    <dd>{record.reason}</dd>
                  </div>
                </dl>
                <p className={system.aiKeyTakeaway}>
                  데이터를 <strong>어디에 보관하고, 누가 어디에서 읽는지</strong>에 따라 필요한
                  동작이 달라져요.
                </p>
                <section className={system.nextLesson}>
                  <small>다음 단원 · 배포하고 고치기</small>
                  <h3>{workbookLessonLabel("publish", 0)}</h3>
                  <p>다른 사람이 열어볼 페이지의 내용과 동작을 공개 전에 점검해요.</p>
                </section>
                <WorkbookOptionalPractice stage="data" className={system.preparationMore} />
                <WorkbookPracticalLab stage="data" />
                <p className={system.recapScope}>
                  학습용 시뮬레이션 기록이에요. 실제 서버·데이터베이스·로그인 연결이나 회원 진도
                  저장은 만들지 않았어요.
                </p>
              </>
            )}
          </>
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>같은 데이터를 함께 읽으려면</h2>
          <p>브라우저의 저장 범위와 서버·저장소의 역할을 구분해요.</p>
          <small>예시 비교 · 실제 기기 연결 별도</small>
        </div>
        <WorkbookActionReturn body={body} enabled={screen === 4} />
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={screen + 1}>
            <button onClick={() => (screen > 0 ? move(screen - 1) : onStep(1))}>
              {screen > 0 ? "이전 설명" : "4-2 새로고침과 저장으로"}
            </button>
          </WorkbookLessonPrevious>
          {screen < 5 ? (
            <button disabled={blocked} onClick={() => move(screen + 1)}>
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

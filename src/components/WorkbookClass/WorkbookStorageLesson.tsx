"use client";

import { useEffect, useRef, useState } from "react";
import { workbookLessonLabel } from "@/lib/workbook-course";
import { dataProgress } from "@/lib/workbook-data";
import type { DataLessonProps } from "./WorkbookDataLesson";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const titles = [
  "방금 표시한 같은 메모로 비교해요",
  "저장 없이 다시 열면 어떻게 될까요?",
  "저장하지 않은 경우를 다시 열어봐요",
  "이번에는 저장한 뒤 다시 열어봐요",
  "같은 문장, 다른 결과가 나온 이유",
  "표시와 저장을 나눠 확인했어요",
];
const options = ["화면에 보였으니 새로고침해도 남아요", "저장하지 않았으니 새로고침하면 사라져요"];

export function WorkbookStorageLesson({ record, onChange, onBack, onStep }: DataLessonProps) {
  const [savedScreen, setScreen] = useWorkbookLessonState("data-storage-screen", 0);
  const [basis, setBasis] = useWorkbookLessonState("data-storage-source", record.source);
  const [message, setMessage] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const progress = dataProgress(record);
  const screen = basis === record.source ? savedScreen : 0;
  const predicted = record.predictions[1] !== null;
  const saved = Boolean(record.saved) && record.saved === record.source;
  const blocked =
    !progress.displayed ||
    (screen === 1 && !predicted) ||
    (screen === 2 && !record.withoutSave) ||
    (screen >= 3 && !progress.stored);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [screen]);
  function move(next: number) {
    setBasis(record.source);
    setScreen(next);
    setMessage("");
    requestAnimationFrame(() => heading.current?.focus());
  }
  function withoutSave() {
    onChange({ ...record, shown: "", draft: "", saved: "", withoutSave: true, withSave: false });
    setMessage("저장하지 않은 예시에서는 다시 읽어올 메모가 없어 화면에서 사라졌어요.");
  }
  function save() {
    onChange({ ...record, saved: record.source, shown: record.source, withSave: false });
    setMessage("같은 문장을 예시 저장 칸에 넣었어요. 이제 다시 열어보세요.");
  }
  function reopen() {
    onChange({ ...record, shown: record.saved, draft: "", withSave: true });
    setMessage("입력창이 비어도 저장 칸에서 같은 메모를 읽어 다시 표시했어요.");
  }
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="data"
        point={1}
        headingRef={heading}
        onBack={onBack}
        current={screen + 1}
        total={6}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        <h2 className={system.screenTitle}>{titles[screen]}</h2>
        {!progress.displayed ? (
          <section className={system.practiceStage}>
            <p>먼저 4-1에서 메모를 화면에 표시해주세요. 이전 기록은 유지돼요.</p>
            <div className={system.practiceActions}>
              <button onClick={() => onStep(0)}>4-1 표시 실험으로 돌아가기</button>
            </div>
          </section>
        ) : (
          <>
            {screen === 0 && (
              <section className={system.practiceStage}>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>4-1에서 표시한 글</dt>
                    <dd>{record.source}</dd>
                  </div>
                </dl>
                <p>
                  같은 문장을 <strong>저장하지 않은 경우와 저장한 경우</strong>로 나눠 다시 열어볼
                  거예요.
                </p>
                <table
                  className={`${system.aiResultTable} ${system.aiCheckTable}`}
                  aria-label="표시와 저장 구분"
                >
                  <thead>
                    <tr>
                      <th scope="col">구분</th>
                      <th scope="col">무엇을 하나요?</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">표시</th>
                      <td>지금 열린 화면에 글을 보여줘요.</td>
                    </tr>
                    <tr>
                      <th scope="row">저장</th>
                      <td>나중에 다시 읽을 수 있도록 값을 보관해요.</td>
                    </tr>
                  </tbody>
                </table>
                <p className={system.aiKeyTakeaway}>
                  화면에 보이는 것만으로는 <strong>저장됐는지 알 수 없어요.</strong>
                </p>
                <p>
                  입력창은 작성 중인 값, 현재 화면은 보여주는 값, 저장소는 나중에 읽을 값을 맡아요.
                  게시판에 메모를 붙였다고 별도 보관함에도 사본이 생기는 것은 아니듯,{" "}
                  <strong>표시와 보관은 서로 다른 일</strong>입니다.
                </p>
                <p className={system.recapScope}>
                  버튼은 새로고침과 브라우저 저장을 흉내 내는 학습 예시예요. 실제 저장소에는 쓰지
                  않아요. 브라우저의 실제 새로고침을 누르면 이번 방문의 예시와 학습 상태가
                  초기화돼요.
                </p>
              </section>
            )}
            {screen === 1 && (
              <section className={system.practiceStage}>
                <p>
                  지금은 메모를 화면에만 표시했다고 생각해보세요. 다시 열면 어떤 결과가 나올지
                  하나를 골라주세요.
                </p>
                <div className={system.choices} role="group" aria-label="결과 예측">
                  {options.map((option, index) => (
                    <button
                      key={option}
                      className={system.choice}
                      aria-pressed={record.predictions[1] === index}
                      data-answer={
                        record.withoutSave && record.predictions[1] === index
                          ? index === 1
                            ? "correct"
                            : "incorrect"
                          : undefined
                      }
                      onClick={() =>
                        onChange({
                          ...record,
                          predictions: record.predictions.map((value, i) =>
                            i === 1 ? index : value,
                          ),
                        })
                      }
                    >
                      <span>{option}</span>
                      {record.withoutSave && record.predictions[1] === index && (
                        <span className={system.answerMark}>
                          {index === 1 ? "✓ 확인" : "× 다시 생각"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className={system.planningHint}>
                  선택 후 다음 실험에서 확인해요. 예측이 달라도 결과를 보며 계속할 수 있어요.
                </p>
              </section>
            )}
            {screen === 2 && (
              <section className={system.practiceStage}>
                <p>
                  <strong>저장하지 않은 상황</strong>만 따로 살펴보는 예시예요.
                </p>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>다시 열기 전</dt>
                    <dd>{record.source}</dd>
                  </div>
                  <div>
                    <dt>예시 저장 칸</dt>
                    <dd>비어 있어요 · 저장하지 않은 경우</dd>
                  </div>
                </dl>
                <div className={system.practiceActions}>
                  <button disabled={!predicted} onClick={withoutSave}>
                    {record.withoutSave ? "저장 없는 경우 다시 보기" : "저장 없이 다시 열기 (예시)"}
                  </button>
                </div>
                <section
                  className={system.preview}
                  role="region"
                  aria-label="저장 없는 경우의 화면"
                  aria-live="polite"
                >
                  <h3>{record.withoutSave ? "다시 연 화면" : "현재 보이는 메모"}</h3>
                  <p>{record.withoutSave ? "표시할 메모가 없어요" : record.source}</p>
                </section>
                {record.withoutSave && (
                  <p className={system.quizFeedback} role="status">
                    {message || "다시 읽어올 저장 값이 없어 메모가 사라졌어요."}
                  </p>
                )}
                <small>실제 새로고침이 이미 저장한 값을 지운다는 뜻은 아니에요.</small>
              </section>
            )}
            {screen === 3 && (
              <section className={system.practiceStage}>
                <p>
                  앞의 문장을 다시 가져와 <strong>저장 → 다시 읽기</strong>를 해봐요. 이번에는 같은
                  브라우저의 저장 칸을 흉내 내요.
                </p>
                <div className={system.practiceActions}>
                  <button disabled={!record.withoutSave} onClick={save}>
                    {saved ? "같은 메모 다시 저장하기 (예시)" : "방금 메모 저장하기 (예시)"}
                  </button>
                  <button disabled={!saved} onClick={reopen}>
                    저장 후 다시 열기 (예시)
                  </button>
                </div>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>예시 저장 칸</dt>
                    <dd>{saved ? record.saved : "아직 저장하지 않았어요"}</dd>
                  </div>
                  <div>
                    <dt>다시 연 화면</dt>
                    <dd>{record.withSave ? record.shown : "저장 후 다시 열기를 눌러 확인해요"}</dd>
                  </div>
                </dl>
                {(message || record.withSave) && (
                  <p className={system.quizFeedback} role="status">
                    {message || "저장 칸에서 같은 문장을 읽어 다시 표시했어요."}
                  </p>
                )}
                <p>
                  장소의 관심 표시를 다음 방문에도 보고 싶다면 저장이 필요해요. 브라우저 저장은 같은
                  브라우저에서 다시 읽는 데 쓸 수 있지만, 브라우저 데이터를 지우면 기록도 없어질 수
                  있어요. <strong>얼마나 오래, 어디에서 다시 볼지</strong>가 저장 방법을 고르는
                  출발점입니다.
                </p>
                <details className={system.preparationMore}>
                  <summary>브라우저 저장은 무엇인가요?</summary>
                  <p>
                    같은 브라우저에서 다시 읽을 값을 보관하는 방식이에요. 다른 기기에 자동으로
                    나눠주는 저장 방식은 아니에요. 이번 활동은 실제 브라우저 저장소를 사용하지 않는
                    예시예요.
                  </p>
                </details>
              </section>
            )}
            {screen === 4 && (
              <section className={system.practiceStage}>
                <table
                  className={`${system.aiResultTable} ${system.aiCheckTable}`}
                  aria-label="저장 여부에 따른 결과"
                >
                  <thead>
                    <tr>
                      <th scope="col">같은 메모를</th>
                      <th scope="col">다시 열었을 때</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">표시만 한 경우</th>
                      <td>저장 값이 없어 메모가 사라졌어요.</td>
                    </tr>
                    <tr>
                      <th scope="row">저장한 경우</th>
                      <td>저장한 ‘{record.saved}’을 읽어 다시 보여줬어요.</td>
                    </tr>
                  </tbody>
                </table>
                <p className={system.quizFeedback}>
                  {record.predictions[1] === 1 ? "예측대로, " : "처음 예측과 달리, "}화면에 표시한
                  것만으로는 메모가 남지 않았어요. <strong>저장하고 다시 읽는 동작</strong>이
                  필요했어요.
                </p>
                <p className={system.planningHint}>
                  실제 서비스마다 저장 방식은 달라요. 모든 입력창의 글이 새로고침하면 사라진다는
                  규칙은 아니에요.
                </p>
              </section>
            )}
            {screen === 5 && (
              <>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>확인한 차이</dt>
                    <dd>표시만 하기와 저장 후 다시 읽기</dd>
                  </div>
                  <div>
                    <dt>예시에 저장한 글</dt>
                    <dd>{record.saved}</dd>
                  </div>
                </dl>
                <p className={system.aiKeyTakeaway}>
                  같은 브라우저에서 다시 읽는 것과 <strong>다른 기기에서 읽는 것</strong>도
                  다를까요?
                </p>
                <section className={system.nextLesson}>
                  <small>다음 수업</small>
                  <h3>{workbookLessonLabel("data", 2)}</h3>
                  <p>같은 메모가 다른 기기 예시에도 보이는지 살펴봐요.</p>
                </section>
                <p className={system.recapScope}>
                  이번 확인은 학습용 시뮬레이션이에요. 내 파일에 실제 저장 기능을 추가한 결과는
                  아니에요.
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
          <h2>다시 읽을 값은 어디에 있나요?</h2>
          <p>같은 메모를 저장하지 않은 경우와 저장한 경우로 비교해요.</p>
          <small>실제 새로고침 대신 예시 버튼으로</small>
        </div>
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={screen + 1}>
            <button onClick={() => (screen > 0 ? move(screen - 1) : onStep(0))}>
              {screen > 0 ? "이전 설명" : "4-1 입력과 표시로"}
            </button>
          </WorkbookLessonPrevious>
          {screen < 5 ? (
            <button disabled={blocked} onClick={() => move(screen + 1)}>
              다음으로
            </button>
          ) : (
            <button disabled={!progress.stored} onClick={() => onStep(2)}>
              다른 기기와 서버로 →
            </button>
          )}
        </nav>
      </aside>
    </section>
  );
}

"use client";

import { useId, useRef } from "react";
import { workbookLearningExample as example } from "@/lib/workbook-learning-example";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookLessonInteractions.module.scss";

// 설명 전용 상태다. 퀴즈 정답·작성 기록·수업 완료 판정과 연결하지 않는다.
export function WorkbookAiOpening() {
  const [stage, setStage] = useWorkbookLessonState("ai-opening-reveal", 0);
  const [selected, setSelected] = useWorkbookLessonState("ai-opening-note", 0);
  const id = useId();
  const nextAction = useRef<HTMLButtonElement>(null);
  const selectedNote = useRef<HTMLButtonElement>(null);
  function reveal(next: number) {
    setStage(next);
    requestAnimationFrame(() => (next === 2 ? selectedNote : nextAction).current?.focus());
  }
  const facts = [
    ["창가 자리", "창가 자리가 있어", "메모의 자리 정보가 문장에 들어갔어요."],
    [
      "혼자 책 읽기",
      "혼자 책을 읽으며 쉬어가기 좋은 공간입니다.",
      "누구에게 좋은 곳인지 설명했어요.",
    ],
    [
      "주말 혼잡",
      "주말에는 사람이 많으니 방문 시간을 참고해주세요.",
      "방문할 때 참고할 정보도 남겼어요.",
    ],
  ];
  return (
    <section className={styles.interaction} aria-label="메모에서 소개 문장으로">
      <p>장소 메모 세 개가 있어요. 소개 문장으로 바꾸면 어떻게 될까요?</p>
      <div className={`${styles.scene} ${styles.noteFlow}`}>
        <section className={styles.panel}>
          <h3>내가 준 메모</h3>
          <ul>
            {example.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
        <span className={styles.flowArrow} aria-hidden="true">
          →
        </span>
        <section className={styles.panel} id={`${id}-result`} aria-label="메모로 만든 소개문">
          <h3>소개문 예시</h3>
          {stage === 0 ? (
            <p>메모를 문장으로 정리해볼까요?</p>
          ) : (
            <p>
              {facts.map((fact, index) => (
                <span key={fact[0]}>
                  {index > 0 && " "}
                  {stage === 2 && selected === index ? <mark>{fact[1]}</mark> : fact[1]}
                </span>
              ))}
            </p>
          )}
        </section>
      </div>
      {stage < 2 && (
        <div className={styles.forwardActions}>
          <button
            ref={nextAction}
            className={styles.primaryAction}
            type="button"
            aria-controls={`${id}-result`}
            onClick={() => reveal(stage + 1)}
          >
            {stage === 0 ? "소개 문장으로 정리해보기" : "메모와 문장 연결하기"}
          </button>
        </div>
      )}
      {stage === 2 && (
        <>
          <div className={styles.selectionGroup} role="group" aria-label="메모와 표현 연결">
            <span className={styles.groupLabel}>메모를 골라 연결을 확인해요</span>
            <div className={styles.selections}>
              {facts.map((fact, index) => (
                <button
                  type="button"
                  key={fact[0]}
                  ref={selected === index ? selectedNote : undefined}
                  className={styles.selection}
                  aria-label={fact[0]}
                  aria-pressed={selected === index}
                  onClick={() => setSelected(index)}
                >
                  {selected === index && <span aria-hidden="true">✓ </span>}
                  {fact[0]}
                </button>
              ))}
            </div>
          </div>
          <p className={styles.feedback} role="status">
            {facts[selected][2]}
          </p>
          <p>
            AI는 많은 자료에서 익힌 규칙성을 활용하는 기술과 시스템이에요. 이처럼 글·이미지·코드
            같은 새 결과를 만드는 AI를 <strong>생성형 AI</strong>라고 불러요.
          </p>
        </>
      )}
      <div className={styles.supportActions}>
        {stage < 2 ? (
          <button className={styles.secondaryAction} type="button" onClick={() => reveal(2)}>
            전체 설명 보기
          </button>
        ) : (
          <button className={styles.secondaryAction} type="button" onClick={() => reveal(1)}>
            문장만 다시 보기
          </button>
        )}
      </div>
      <small>미리 만든 학습 예시예요. 실제 AI를 호출하지 않아요.</small>
    </section>
  );
}

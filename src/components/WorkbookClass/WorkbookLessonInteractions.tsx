"use client";

import { useId, useRef } from "react";
import {
  workbookLearningExample as example,
  findWorkbookRequestExcerpt,
} from "@/lib/workbook-learning-example";
import type { WorkbookPagePlan } from "@/lib/workbook-page-plan";
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

export function WorkbookPromptBuilder() {
  const [stage, setStage] = useWorkbookLessonState("conversation-prompt-reveal", 0);
  const id = useId();
  const nextAction = useRef<HTMLButtonElement>(null);
  const feedback = useRef<HTMLParagraphElement>(null);
  function reveal(next: number) {
    setStage(next);
    requestAnimationFrame(() => (next === 3 ? feedback : nextAction).current?.focus());
  }
  const additions = [
    ["읽을 사람 알려주기", "혼자 책 읽을 곳을 찾는 사람에게 보여줄 글이야."],
    ["장소 정보 알려주기", "창가 자리가 있고 혼자 책 읽기 좋아. 주말에는 사람이 많아."],
    ["길이와 범위 정하기", "두 문장으로 써줘. 알려준 정보만 사용해줘."],
  ];
  const results = [
    "이 공간에서 나만의 시간을 만나보세요.",
    "혼자 책 읽을 장소를 찾는 분께 이 공간을 소개합니다.",
    "창가 자리가 있어 혼자 책을 읽으며 쉬어가기 좋은 공간입니다. 주말에는 사람이 많으니 방문 시간을 참고해주세요. 머무를 장소를 고를 때 참고해보세요.",
    example.firstResult,
  ];
  const explanations = [
    "어떤 장소인지 몰라 구체적인 특징을 담기 어려워요.",
    "읽을 사람을 알려주니 누구에게 소개하는 글인지 드러나요. 장소 정보는 아직 부족해요.",
    "알려준 특징이 들어갔어요. 이번에는 길이까지 정해볼까요?",
    "독자·정보·길이가 모두 들어갔어요. 어떤 추측을 줄였는지 요청과 결과를 비교해보세요.",
  ];
  return (
    <section className={styles.interaction} aria-label="요청에 조건 더하기">
      <p>
        AI에게 보내는 요청을 <strong>프롬프트</strong>라고 해요. 짧은 요청에 정보를 하나씩 더해봐요.
      </p>
      <div className={styles.scene}>
        <section className={styles.panel} aria-label="쌓이는 요청문">
          <h3>내 요청</h3>
          <p>장소 소개문을 써줘.</p>
          {additions.slice(0, stage).map(([label, text], index) => (
            <p key={label}>
              <small>{label}</small>
              {index === stage - 1 ? <mark>{text}</mark> : text}
            </p>
          ))}
        </section>
        <section className={styles.panel} id={`${id}-answer`} aria-label="조건별 답변 예시">
          <h3>이 조건으로 만든 답변 예시</h3>
          <p>{results[stage]}</p>
        </section>
      </div>
      {stage < 3 && (
        <div className={styles.forwardActions}>
          <button
            ref={nextAction}
            className={styles.primaryAction}
            type="button"
            aria-controls={`${id}-answer`}
            onClick={() => reveal(stage + 1)}
          >
            {additions[stage][0]}
          </button>
        </div>
      )}
      <p ref={feedback} tabIndex={-1} className={styles.feedback} role="status">
        {explanations[stage]}
      </p>
      <div className={styles.supportActions}>
        {stage < 3 ? (
          <button className={styles.secondaryAction} type="button" onClick={() => reveal(3)}>
            전체 예시 보기
          </button>
        ) : (
          <button className={styles.secondaryAction} type="button" onClick={() => reveal(0)}>
            처음부터 비교하기
          </button>
        )}
        {stage > 0 && (
          <button
            className={styles.secondaryAction}
            type="button"
            onClick={() => reveal(stage - 1)}
          >
            조건 하나 빼보기
          </button>
        )}
      </div>
      <small>
        조건별로 미리 만든 비교예요. 실제 AI 응답이 아니며, 뒤에서 작성할 내 요청은 바뀌지 않아요.
      </small>
    </section>
  );
}

export function WorkbookPlanRequestBridge({
  plan,
  request,
}: {
  plan: WorkbookPagePlan;
  request: string;
}) {
  const [selected, setSelected] = useWorkbookLessonState("plan-request-highlight", 0);
  const [all, setAll] = useWorkbookLessonState("plan-request-show-all", false);
  const id = useId();
  const parts = [
    {
      label: "읽을 사람",
      value: plan.audience,
      prefix: "읽을 사람: ",
      why: "누구에게 필요한 정보를 먼저 보여줄지 알려줘요.",
    },
    {
      label: "바라는 행동",
      value: plan.purpose,
      prefix: "페이지의 목적: ",
      why: "읽은 뒤 할 일을 정하면 화면을 구성할 기준이 생겨요.",
    },
    {
      label: "담을 내용",
      value: plan.content,
      prefix: "소개할 내용:\n",
      why: "AI가 추측하지 않도록 실제로 넣을 재료를 전달해요.",
    },
    {
      label: "작업 대상",
      value: "my-first-web",
      prefix: "",
      why: "같은 폴더의 파일에서 작업을 이어가도록 해요.",
    },
  ];
  return (
    <section className={`${styles.interaction} ${styles.bridge}`} aria-label="기획과 요청 연결">
      <div className={styles.selectionGroup} role="group" aria-label="기획 항목 선택">
        <span className={styles.groupLabel}>비교할 기획 항목</span>
        <div className={styles.selections}>
          {parts.map((part, index) => (
            <button
              type="button"
              key={part.label}
              className={styles.selection}
              aria-label={part.label}
              aria-pressed={!all && selected === index}
              aria-controls={`${id}-excerpt`}
              onClick={() => {
                setSelected(index);
                setAll(false);
              }}
            >
              {!all && selected === index && <span aria-hidden="true">✓ </span>}
              {part.label}
            </button>
          ))}
        </div>
      </div>
      <div className={`${styles.scene} ${all ? styles.allConnections : ""}`} id={`${id}-excerpt`}>
        <section className={styles.panel}>
          <h3>{parts[selected].label}</h3>
          <p className={styles.preserveLines}>
            {parts[selected].value || "아직 적은 내용이 없어요."}
          </p>
        </section>
        <section className={styles.panel} aria-label="현재 요청에서 찾은 문장">
          <h3>현재 요청에서 찾은 문장</h3>
          {(all ? parts : [parts[selected]]).map((part) => {
            const excerpt = findWorkbookRequestExcerpt(request, part.value, part.prefix);
            return (
              <div key={part.label}>
                {all && <h4>{part.label}</h4>}
                {excerpt ? (
                  <p className={styles.preserveLines}>
                    {excerpt.before}
                    <mark>{excerpt.match}</mark>
                    {excerpt.after}
                  </p>
                ) : (
                  <p>
                    기획의 ‘{part.label}’: {part.value || "아직 적은 내용이 없어요."}
                    <br />
                    현재 요청에서 연결된 항목을 찾지 못했어요. 직접 편집한 원문은 그대로예요. 다른
                    표현으로 바꿨다면 그대로 진행해도 괜찮아요.
                  </p>
                )}
              </div>
            );
          })}
        </section>
      </div>
      <p className={styles.feedback} role="status">
        {all
          ? "네 항목의 연결을 함께 보고 있어요. 항목을 고르면 한 부분씩 다시 볼 수 있어요."
          : parts[selected].why}
      </p>
      <div className={styles.supportActions} aria-label="연결 보기 방식">
        <button
          className={styles.secondaryAction}
          type="button"
          onClick={() => {
            setSelected((selected + 1) % parts.length);
            setAll(false);
          }}
        >
          다음 연결 살펴보기
        </button>
        <button
          className={styles.secondaryAction}
          type="button"
          aria-expanded={all}
          onClick={() => setAll(!all)}
        >
          {all ? "한 부분씩 보기" : "전체 연결 보기"}
        </button>
      </div>
    </section>
  );
}

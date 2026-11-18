"use client";

// Client component: everything picked in this lesson lands on the page as paper pieces, one after
// another — title sticker, the intro from 1-6 (or a dashed slot the AI will ask about), the "지금"
// cards, and the bottom button. That page is the plan. Missing pieces are named with a jump back
// to their screen. One optional disclosure lets the learner rewrite the title and the intro.
import type { Ref } from "react";
import { workbookCourse } from "@/lib/workbook-course";
import {
  ASK_INTRO,
  planLines,
  type PlanButton,
  type PlanReader,
} from "@/lib/workbook-plan-readers";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import styles from "./WorkbookPlanRecap.module.scss";

/** 2-1에서 배운 것. 화면 순서대로. */
const LEARNED = [
  "홈페이지를 볼 사람을 먼저 정하면, 어떤 내용을 넣을지 정하기 쉬워져요.",
  "제목은 무엇을 소개하는지, 맨 아래 버튼은 다 읽은 뒤 할 일을 알려 줘요.",
  "지금 소개할 수 있는 내용만 넣고, 준비 안 된 내용은 나중에 채워요.",
  "가장 중요한 내용은 휴대폰 첫 화면 안에 들어오도록 위쪽에 둬요.",
  "내가 놓친 부분은 AI에게 질문해 달라고 해서 찾을 수 있어요.",
] as const;

export type PlanBlank = { label: string; screen: number };

/** 2-1 screen 5: the page assembles itself. The button to 2-2 is never disabled. */
export function WorkbookPlanRecap({
  record,
  reader,
  button,
  blanks,
  blanksRef,
  asked,
  onJump,
  update,
}: {
  record: ProjectRecord;
  reader: PlanReader | null;
  button: PlanButton | null;
  blanks: readonly PlanBlank[];
  blanksRef: Ref<HTMLDivElement>;
  /** 비어 있는 곳이 남은 채로 다음 수업을 누른 적이 있으면 그 안내를 앞세운다. */
  asked: boolean;
  onJump: (screen: number) => void;
  update: (patch: Partial<ProjectRecord>) => void;
}) {
  const next = workbookCourse[1].lessons[1];
  const now = planLines(record.content);
  const later = planLines(record.later);
  const intro = record.intro.trim();
  const askIntro = !intro || intro === ASK_INTRO;
  return (
    <div data-lesson-wide className={styles.recap}>
      <h2 id="lesson-screen-title" className={styles.title}>
        오늘 알게 된 것
      </h2>

      <div className={styles.layout}>
        <article className={styles.page} aria-label="내 페이지 설계도">
          {reader && <span className={styles.for}>{reader.tag}에게 보여줄 페이지</span>}
          <div className={styles.piece} data-part="title" style={{ animationDelay: "0ms" }}>
            {record.title.trim() || <span className={styles.missing}>제목 자리</span>}
          </div>
          <div className={styles.piece} data-part="intro" style={{ animationDelay: "120ms" }}>
            {askIntro ? (
              <span className={styles.missing}>
                소개 글 · 다음 수업에서 AI가 물어보고 함께 채워요
              </span>
            ) : (
              intro
            )}
          </div>
          <ul className={styles.cards}>
            {now.length === 0 ? (
              <li className={styles.piece} style={{ animationDelay: "240ms" }}>
                <span className={styles.missing}>넣을 내용 자리</span>
              </li>
            ) : (
              now.map((card, index) => (
                <li
                  key={card}
                  className={styles.piece}
                  data-part="card"
                  style={{ animationDelay: `${240 + index * 60}ms` }}
                >
                  {card}
                </li>
              ))
            )}
          </ul>
          <div className={styles.piece} data-part="button" style={{ animationDelay: "480ms" }}>
            {button ? (
              <span className={styles.cta}>{button.label}</span>
            ) : (
              <span className={styles.missing}>버튼 자리</span>
            )}
          </div>
          {later.length > 0 && <p className={styles.later}>나중에 채울 것 · {later.join(" · ")}</p>}
        </article>

        <div className={styles.aside}>
          {blanks.length > 0 && (
            <div
              ref={blanksRef}
              tabIndex={-1}
              className={styles.blanks}
              data-asked={asked}
              role={asked ? "alert" : undefined}
            >
              <p>
                {asked
                  ? "다음 수업에서는 이 설계도로 요청을 만들어요. 아직 비어 있는 곳을 먼저 골라 주세요."
                  : "아직 비어 있는 곳이 있어요. 눌러서 골라 볼까요?"}
              </p>
              <ul>
                {blanks.map((blank) => (
                  <li key={blank.label}>
                    <button type="button" onClick={() => onJump(blank.screen)}>
                      {blank.label} 고르러 가기
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ol className={styles.learned} aria-label="오늘 알게 된 것">
            {LEARNED.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          <details className={styles.rewrite}>
            <summary>제목이나 소개 글을 직접 고쳐 쓰고 싶다면</summary>
            <label>
              <span>제목</span>
              <input
                type="text"
                value={record.title}
                autoComplete="off"
                onChange={(event) => update({ title: event.target.value })}
              />
            </label>
            <label>
              <span>소개 글</span>
              <textarea
                rows={2}
                value={askIntro ? "" : record.intro}
                placeholder="비워 두면 AI가 물어보고 채워요"
                onChange={(event) => update({ intro: event.target.value || ASK_INTRO })}
              />
            </label>
          </details>
          <aside className={styles.ticket} aria-labelledby="plan-next-title">
            <span>다음 수업</span>
            <h3 id="plan-next-title">
              {next.number} {next.title}
            </h3>
            <p>
              이 설계도대로 같은 index.html을 고쳐 달라고 AI에게 부탁해요. 페이지에 들어갈 내용은
              AI가 나에게 질문하면서 함께 채워요.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

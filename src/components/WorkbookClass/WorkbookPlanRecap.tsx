"use client";

// Client component: 2-4 recap, the plan on one page. Everything picked in the four planning lessons
// lands on the page as paper pieces — title sticker, the intro from 1-6 (or a dashed slot the AI will
// ask about), the "지금" cards, the bottom button — with the situation, criteria, layout and mood noted
// under it. Missing pieces are named with a jump back to the lesson that fills them. One optional
// disclosure lets the learner rewrite the title and the intro.
import type { Ref } from "react";
import { workbookCourse, workbookProjectStep } from "@/lib/workbook-course";
import {
  ASK_INTRO,
  planLines,
  type PlanButton,
  type PlanReader,
} from "@/lib/workbook-plan-readers";
import { layoutLabel, moodLabel, situationLabel } from "@/lib/workbook-plan-options";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import styles from "./WorkbookPlanRecap.module.scss";

/** 기획서 한 장 만들기에서 배운 것. 화면 순서대로. */
const LEARNED = [
  "제목은 무엇을 소개하는지, 버튼 문구는 누르면 무엇이 되는지 알려 줘요.",
  "분위기를 정해 두면 “예쁘게 해 줘” 대신 분명하게 부탁할 수 있어요.",
  "내가 놓친 부분은 AI에게 질문해 달라고 해서 찾을 수 있어요.",
  "기획 네 수업에서 정한 것을 한 장으로 모으면, 그대로 요청이 돼요.",
] as const;

/** 비어 있는 기획 칸과, 그 칸을 채우는 수업(2단원 순번) · 화면. */
export type PlanBlank = { label: string; step: number; screen: number };

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
  onJump: (blank: PlanBlank) => void;
  update: (patch: Partial<ProjectRecord>) => void;
}) {
  const next = workbookCourse[1].lessons[workbookProjectStep.request];
  const situation = [
    situationLabel("entry", record.entry),
    situationLabel("device", record.device),
    situationLabel("pace", record.pace),
  ].filter(Boolean);
  const criteria = planLines(record.criteria);
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
              <span className={styles.cta}>{record.buttonLabel.trim() || button.label}</span>
            ) : (
              <span className={styles.missing}>버튼 자리</span>
            )}
          </div>
          {later.length > 0 && <p className={styles.later}>나중에 채울 것 · {later.join(" · ")}</p>}
          <dl className={styles.notes}>
            <div>
              <dt>상황</dt>
              <dd>{situation.length ? situation.join(" · ") : "고르지 않았어요"}</dd>
            </div>
            <div>
              <dt>잘 됐다는 기준</dt>
              <dd>{criteria.length ? `${criteria.length}가지` : "고르지 않았어요"}</dd>
            </div>
            <div>
              <dt>배치 · 분위기</dt>
              <dd>
                {layoutLabel(record.layout) ?? "배치 미정"} ·{" "}
                {moodLabel(record.mood) ?? "분위기 미정"}
              </dd>
            </div>
          </dl>
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
                    <button type="button" onClick={() => onJump(blank)}>
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

"use client";

// Client component: 2-5 recap as an envelope (2-1 visitor card, 2-2 scrapbook, 2-3 drawing — the
// form changes each lesson). The four-part memo sticks out of an envelope addressed to the AI, and
// the postmark says how it went (sent · following the example · not yet). What was learned sits
// beside it; if the learner hasn't said whether they sent it, the recap names that and jumps back.
import Image from "next/image";
import type { CSSProperties, Ref } from "react";
import { workbookCourse, workbookProjectStep } from "@/lib/workbook-course";
import { planMemo } from "@/lib/workbook-plan-memo";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import type { RecapLine } from "./WorkbookPlanRecaps";
import styles from "./WorkbookPageRequestRecap.module.scss";

const LEARNED: readonly RecapLine[] = [
  {
    term: "기획을 네 칸 메모에 옮기면 요청이 돼요",
    text: "무엇을 · 어디에 쓸지 · 조건 · 하지 말 것 칸에 기획에서 정한 것을 그대로 옮겨요.",
  },
  {
    term: "있는 파일은 고쳐 달라고 분명히 말해요",
    text: "“새로 만들지 말고 index.html을 고쳐 줘”라고 써야 새 폴더나 새 파일이 생기지 않아요.",
  },
  {
    term: "물으면 아는 만큼만 답해요",
    text: "없는 건 없다고, 아직 못 정했으면 비워 두라고 말해요.",
  },
  {
    term: "승인하기 전에 바뀌는 부분을 봐요",
    text: "고치는 파일 이름과, 빠지는 줄(−)과 더해지는 줄(+)을 확인해요.",
  },
];

/** 2-5 recap: the memo goes into an envelope addressed to the AI, with a postmark for how it went. */
export function WorkbookPageRequestRecap({
  record,
  missingMode,
  asked,
  blanksRef,
  onJump,
}: {
  record: ProjectRecord;
  missingMode: boolean;
  asked: boolean;
  blanksRef: Ref<HTMLDivElement>;
  onJump: (screen: number) => void;
}) {
  const next = workbookCourse[1].lessons[workbookProjectStep.result];
  const rows = planMemo(record);
  const mark = record.mode === "computer" ? "보냄" : record.mode === "example" ? "예시" : "아직";
  const status =
    record.mode === "computer"
      ? record.approved
        ? "메모를 보내고, 바뀌는 부분을 확인한 뒤 승인했어요."
        : "메모를 보냈어요. AI가 파일을 고치기 전에 승인을 물으면, 바뀌는 부분을 보고 승인해요."
      : record.mode === "example"
        ? "예시로 따라왔어요. 컴퓨터가 준비되면 이 메모를 그대로 보내면 돼요."
        : "";
  return (
    <div data-lesson-wide className={styles.recap}>
      <h2 id="lesson-screen-title" className={styles.title}>
        오늘 알게 된 것
      </h2>
      <div className={styles.layout}>
        <figure className={styles.envelope} aria-label="네 칸 메모를 담은 봉투">
          <div className={styles.sheet} aria-hidden="true">
            {rows.map((row) => (
              <p key={row.label}>
                <b>{row.label}</b>
                <span>{row.line}</span>
              </p>
            ))}
          </div>
          <div className={styles.front}>
            <svg
              className={styles.flap}
              viewBox="0 0 100 30"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polyline points="0,0 50,28 100,0" />
            </svg>
            <span className={styles.stampBox} aria-hidden="true">
              <Image
                src="/images/workbook/lesson-1-2/capy-thumb.png"
                alt=""
                width={295}
                height={480}
              />
            </span>
            <span className={styles.postmark} data-mark={mark}>
              {mark}
            </span>
            <dl className={styles.address}>
              <div>
                <dt>받는 사람</dt>
                <dd>AI · Claude 앱의 같은 대화</dd>
              </div>
              <div>
                <dt>내용물</dt>
                <dd>네 칸 메모 · {rows.map((row) => row.label).join(" / ")}</dd>
              </div>
            </dl>
          </div>
        </figure>

        <div className={styles.right}>
          <ol className={styles.learned} aria-label="오늘 알게 된 것">
            {LEARNED.map((line, index) => (
              <li key={line.term} style={{ "--i": index } as CSSProperties}>
                <strong>{line.term}</strong>
                <span>{line.text}</span>
              </li>
            ))}
          </ol>
          {missingMode ? (
            <div
              ref={blanksRef}
              tabIndex={-1}
              className={styles.blank}
              data-asked={asked}
              role={asked ? "alert" : undefined}
            >
              <p>실습 방식을 아직 안 골랐어요 · 보냈는지, 예시로 갈지</p>
              <button type="button" onClick={() => onJump(2)}>
                보내기 화면으로 가기
              </button>
            </div>
          ) : (
            <p className={styles.status}>{status}</p>
          )}
          <p className={styles.next}>
            다음 수업 · <b>{`${next.number} ${next.title}`}</b> — 고쳐진 페이지를 브라우저로 열어서,
            기획한 대로 바뀌었는지 확인해요.
          </p>
        </div>
      </div>
    </div>
  );
}

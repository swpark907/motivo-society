"use client";

// Client component: 2-2 recap. What was learned, the memo that was (or will be) sent, and what is
// still open: if the learner hasn't said whether they sent it or are following the example, the
// recap names that and jumps back. The ticket points to 2-3 (number and title from workbook-course).
import type { Ref } from "react";
import { workbookCourse } from "@/lib/workbook-course";
import { planMemo } from "@/lib/workbook-plan-memo";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { WorkbookPlanMemoCard } from "./WorkbookPlanMemoCard";
import styles from "./WorkbookPageRequestRecap.module.scss";

const LEARNED = [
  "기획에서 정한 것을 네 칸 메모에 옮기면 그대로 요청이 돼요.",
  "이미 있는 파일은 ‘새로 만들지 말고 고쳐 줘’라고 분명히 말해요.",
  "AI가 물으면 아는 만큼만 답하고, 없는 건 없다고 말해요.",
  "승인하기 전에 고치는 파일과 바뀌는 줄(−·+)을 확인해요.",
] as const;

/** 2-2 recap. */
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
  const next = workbookCourse[1].lessons[2];
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
        <div className={styles.left}>
          <ol className={styles.learned} aria-label="오늘 알게 된 것">
            {LEARNED.map((line) => (
              <li key={line}>{line}</li>
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
              <p>
                {asked
                  ? "다음 수업으로 가기 전에, 메모를 보냈는지 예시로 따라갈지 골라 주세요."
                  : "메모를 보냈는지, 예시로 따라갈지 아직 고르지 않았어요."}
              </p>
              <button type="button" onClick={() => onJump(2)}>
                보내기 화면으로 가기
              </button>
            </div>
          ) : (
            <p className={styles.status}>{status}</p>
          )}
          <aside className={styles.ticket} aria-labelledby="request-next-title">
            <span>다음 수업</span>
            <h3 id="request-next-title">
              {next.number} {next.title}
            </h3>
            <p>고쳐진 페이지를 브라우저로 열어서, 기획한 대로 바뀌었는지 확인해요.</p>
          </aside>
        </div>
        <WorkbookPlanMemoCard rows={planMemo(record)} label="보낸 메모" compact />
      </div>
    </div>
  );
}

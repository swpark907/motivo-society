"use client";

// Client component: 2-2 screen 3. The memo is copied and sent in the same Claude conversation, and
// the AI's likely questions are shown with honest example answers (say what you know, say "not yet"
// when it isn't there, leave it empty when undecided). Sending is stamped by the learner; following
// along with the example is the other choice. The memo text and the way of practicing go to the
// plan record (request · mode); "copied" is momentary.
import { useState } from "react";
import { workbookCourse, workbookLessonId } from "@/lib/workbook-course";
import { planMemo, planMemoText, planQuestions } from "@/lib/workbook-plan-memo";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { WorkbookPlanMemoCard } from "./WorkbookPlanMemoCard";
import { WorkbookCopyFallback } from "./WorkbookCopyFallback";
import styles from "./WorkbookRequestSend.module.scss";

const fileLesson = workbookCourse[0].lessons[workbookLessonId.firstFile];

/** 2-2 screen 3: send the memo, then answer only with what is true. */
export function WorkbookRequestSend({
  record,
  ready,
  carried,
  update,
}: {
  record: ProjectRecord;
  /** 1-4의 준비 도장을 다 찍었는지. */
  ready: boolean;
  /** 실습 방식을 1-6에서 이어받아 골라 뒀는지. */
  carried: boolean;
  update: (patch: Partial<ProjectRecord>) => void;
}) {
  const [copied, setCopied] = useState<"done" | "failed" | null>(null);
  const memo = planMemoText(record);
  const questions = planQuestions(record);
  const sent = record.mode === "computer";

  async function copy() {
    update({ request: memo });
    try {
      await navigator.clipboard.writeText(memo);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
  }

  return (
    <div data-lesson-wide className={styles.send}>
      <h2 id="lesson-screen-title" className={styles.title}>
        메모를 보내고, 질문에는 아는 만큼만 답해요
      </h2>
      <div className={styles.lead}>
        <p>
          메모를 복사해서 {fileLesson.number} {fileLesson.title}에서 쓰던 Claude 앱의{" "}
          <strong>같은 대화</strong>에 붙여 넣고 보내요. 메모에 “하나씩 물어봐줘”를 넣었으니 AI가
          질문을 할 거예요. 이때 <strong>없는 내용을 지어서 답하지 않는 것</strong>이 중요합니다.
        </p>
      </div>

      <div className={styles.desk}>
        <div className={styles.left}>
          <WorkbookPlanMemoCard rows={planMemo(record)} label="보낼 메모" compact />
          <div className={styles.actions}>
            <button type="button" className={styles.copy} onClick={copy}>
              메모 복사하기
            </button>
            <button
              type="button"
              className={styles.stamp}
              aria-pressed={sent}
              onClick={() => update({ request: memo, mode: sent ? null : "computer" })}
            >
              <span className={styles.mark} aria-hidden="true">
                {sent ? "보냄" : ""}
              </span>
              <span>{sent ? "보냈어요" : "보냈으면 도장을 찍어요"}</span>
            </button>
            {!sent && (
              <button
                type="button"
                className={styles.later}
                aria-pressed={record.mode === "example"}
                onClick={() => update({ request: memo, mode: "example" })}
              >
                {ready ? "지금은 보내지 않고" : "아직 도구 준비 전이라"} 예시로 따라갈게요
              </button>
            )}
          </div>
          {copied === "failed" && <WorkbookCopyFallback text={memo} />}
          <p className={styles.next} aria-live="polite">
            {copied === "done" && "복사했어요. 같은 대화의 입력 칸에 붙여 넣고 Enter를 눌러요. "}
            {carried &&
              record.mode !== null &&
              `${fileLesson.number}에서 고른 방식대로 골라 뒀어요. `}
            {record.mode === "example" && "다음 화면에서 예시로 바뀌는 부분을 함께 봐요."}
            {sent &&
              "Claude 앱은 띄워 둔 채 다음 화면으로 가요. 승인하기 전에 볼 것을 알려 드려요."}
          </p>
        </div>

        <div className={styles.right}>
          <section className={styles.chat} aria-label="AI가 물어볼 수 있는 질문과 대답 예시">
            <h3>AI가 이렇게 물어볼 수 있어요</h3>
            <ol>
              {questions.map((item) => (
                <li key={item.question}>
                  <p className={styles.ai}>{item.question}</p>
                  <p className={styles.me}>{item.answer}</p>
                </li>
              ))}
            </ol>
            <p className={styles.rule}>
              아는 것만 답하고, 없으면 없다고, 못 정했으면 비워 두라고 말해요.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

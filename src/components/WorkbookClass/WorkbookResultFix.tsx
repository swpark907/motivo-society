"use client";

// Client component: 2-3 screen 3. From the pieces marked "달라요" on screen 1, the learner picks one;
// a fix request with "바꿀 것" and "그대로 둘 것" is put together from the plan (no typing) and can be
// copied into the same Claude conversation. If nothing was marked, any piece can be picked as practice.
// The picked piece is the visit's lesson state; "copied" is momentary.
import { useState } from "react";
import { fixRequest, resultPieces, type PieceId } from "@/lib/workbook-result-check";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import type { ResultMarks } from "./WorkbookResultCompare";
import { WorkbookCopyFallback } from "./WorkbookCopyFallback";
import styles from "./WorkbookResultFix.module.scss";

/** 2-3 screen 3: fix one thing at a time. */
export function WorkbookResultFix({
  record,
  marks,
  picked,
  onPick,
}: {
  record: ProjectRecord;
  marks: ResultMarks;
  picked: PieceId | null;
  onPick: (id: PieceId) => void;
}) {
  const [copied, setCopied] = useState<"done" | "failed" | null>(null);
  const pieces = resultPieces(record);
  const marked = pieces.filter((piece) => marks[piece.id] === "diff");
  const choices = marked.length ? marked : pieces;
  const slip = picked ? fixRequest(record, picked) : null;
  const text = slip ? `${slip.change}\n${slip.keep}` : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
  }

  return (
    <div data-lesson-wide className={styles.fix}>
      <h2 id="lesson-screen-title" className={styles.title}>
        다른 곳은 하나씩 고쳐 달라고 해요
      </h2>
      <div className={styles.lead}>
        <p>
          다른 곳이 여러 개여도 한 번에 하나씩 부탁해요. 한꺼번에 고쳐 달라고 하면 잘된 부분까지
          바뀔 수 있거든요. 1단원에서 했던 것처럼 <strong>바꿀 것</strong>과{" "}
          <strong>그대로 둘 것</strong>을 같이 말합니다.
        </p>
      </div>

      <div className={styles.desk}>
        <section className={styles.pick} aria-label="고칠 곳 고르기">
          <h3>
            {marked.length ? "‘달라요’로 표시한 곳" : "다른 곳이 없었다면, 연습으로 하나 골라 봐요"}
          </h3>
          <ul>
            {choices.map((piece) => (
              <li key={piece.id}>
                <button
                  type="button"
                  aria-pressed={picked === piece.id}
                  onClick={() => {
                    setCopied(null);
                    onPick(piece.id);
                  }}
                >
                  {piece.label}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.slip} aria-label="고쳐 달라는 요청" aria-live="polite">
          {slip ? (
            <>
              <p className={styles.row} data-kind="change">
                <strong>바꿀 것</strong>
                <span>{slip.change}</span>
              </p>
              <p className={styles.row} data-kind="keep">
                <strong>그대로 둘 것</strong>
                <span>{slip.keep}</span>
              </p>
              <div className={styles.copyRow}>
                <button type="button" className={styles.copy} onClick={copy}>
                  요청 복사하기
                </button>
                <span role="status">
                  {copied === "done" && "복사했어요. 같은 대화에 붙여 넣고 보내요."}
                </span>
              </div>
              {copied === "failed" && <WorkbookCopyFallback text={text} />}
            </>
          ) : (
            <p className={styles.empty}>왼쪽에서 고칠 곳을 고르면 요청이 만들어져요.</p>
          )}
        </section>
      </div>
    </div>
  );
}

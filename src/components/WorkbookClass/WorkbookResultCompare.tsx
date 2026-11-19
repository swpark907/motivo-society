"use client";

// Client component: 2-3 screen 1. The blueprint pieces sit on the left; the learner marks each one
// "있어요" or "달라요" after looking at the page. With computer practice the page is the learner's own
// browser, so the right side says how to put it next to the workbook; following the example, the
// right side is a practice page drawn from the plan with one piece made different on purpose.
// Marks are the visit's lesson state and feed screen 3.
import { resultPieces, practiceDifference, type PieceId } from "@/lib/workbook-result-check";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { WorkbookPracticePage } from "./WorkbookPracticePage";
import styles from "./WorkbookResultCompare.module.scss";

export type ResultMarks = Partial<Record<PieceId, "same" | "diff">>;

/** 2-3 screen 1: check the page piece by piece against the blueprint. */
export function WorkbookResultCompare({
  record,
  marks,
  onMark,
}: {
  record: ProjectRecord;
  marks: ResultMarks;
  onMark: (id: PieceId, value: "same" | "diff") => void;
}) {
  const computer = record.mode === "computer";
  const pieces = resultPieces(record);
  const diff = practiceDifference(record);
  const allMarked = pieces.every((piece) => marks[piece.id]);
  const missed = !computer && allMarked && marks[diff] !== "diff";
  return (
    <div data-lesson-wide className={styles.compare}>
      <h2 id="lesson-screen-title" className={styles.title}>
        설계도와 화면을 나란히 놓고 봐요
      </h2>
      <div className={styles.lead}>
        <p>
          AI가 고친 페이지가 기획한 대로 나왔는지 확인할 차례예요. 느낌으로 보지 않고,{" "}
          <strong>설계도의 조각을 하나씩</strong> 화면과 맞춰 봅니다. 조각마다 화면에 있으면
          ‘있어요’, 다르면 ‘달라요’를 눌러 주세요.
        </p>
      </div>

      <div className={styles.desk}>
        <div className={styles.left}>
          <ol className={styles.pieces} aria-label="내 설계도">
            {pieces.map((piece) => (
              <li key={piece.id} data-mark={marks[piece.id] ?? "none"}>
                <span className={styles.name}>{piece.label}</span>
                <span className={styles.plan}>{piece.plan}</span>
                <span className={styles.choices}>
                  <button
                    type="button"
                    aria-pressed={marks[piece.id] === "same"}
                    aria-label={`${piece.label} 있어요`}
                    onClick={() => onMark(piece.id, "same")}
                  >
                    ✓ 있어요
                  </button>
                  <button
                    type="button"
                    aria-pressed={marks[piece.id] === "diff"}
                    aria-label={`${piece.label} 달라요`}
                    onClick={() => onMark(piece.id, "diff")}
                  >
                    ✗ 달라요
                  </button>
                </span>
              </li>
            ))}
          </ol>
          {!computer && (
            <p className={styles.note} aria-live="polite">
              {missed
                ? "다시 보세요. 연습 화면에는 설계도와 다른 곳이 하나 있어요."
                : marks[diff] === "diff"
                  ? "찾았어요. 다른 곳은 잠시 뒤에 고쳐 달라고 해요."
                  : "연습 화면에는 설계도와 다른 곳이 하나 있어요."}
            </p>
          )}
        </div>

        {computer ? (
          <section className={styles.how} aria-label="내 화면 띄우는 방법">
            <h3>내 화면은 이렇게 옆에 띄워요</h3>
            <ol>
              <li>
                my-first-web 폴더의 index.html을 브라우저로 열어요. 이미 열려 있으면 새로고침해요.
              </li>
              <li>브라우저 창과 이 워크북을 나란히 놓아요.</li>
              <li>왼쪽 설계도 조각을 위에서부터 하나씩 화면과 맞춰 봐요.</li>
            </ol>
          </section>
        ) : (
          <div className={styles.practice}>
            <WorkbookPracticePage
              record={record}
              variant="before"
              label="설계도로 그린 연습 화면"
            />
          </div>
        )}
      </div>
    </div>
  );
}

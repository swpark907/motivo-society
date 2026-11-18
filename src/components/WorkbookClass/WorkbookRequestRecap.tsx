"use client";

// Client component: reads the learner's own request and follow-up from the practice record so the
// recap board can pin what they actually wrote next to what the lesson covered.
import { Nanum_Pen_Script } from "next/font/google";
import { workbookCourse, workbookLessonId } from "@/lib/workbook-course";
import { MEMO_PARTS } from "./WorkbookMemoParts";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookRequestRecap.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/**
 * 1-5 screen 6: the recap as a memo board with three pinned notes (1-1 cards, 1-2 notebook page,
 * 1-3 receipt, 1-4 pass — the form changes again). What the learner wrote is shown only when
 * they wrote it. The next lesson is 1-6 from src/lib/workbook-course.ts.
 */
export function WorkbookRequestRecap() {
  const { practice } = useWorkbookProgress();
  const record = practice[workbookLessonId.firstRequest];
  const next = workbookCourse[0].lessons[workbookLessonId.firstFile];
  const request = record?.request.trim();
  const observation = record?.observation.trim();
  const revision = record?.revision.trim();

  return (
    <div data-lesson-wide className={styles.recap}>
      <h2 id="lesson-screen-title" className={styles.title}>
        오늘 알게 된 것
      </h2>

      <div className={styles.layout}>
        <ol className={styles.board}>
          <li className={styles.note} data-kind="bag">
            <h3 className={hand.className}>적지 않은 건 AI가 짐작해요</h3>
            <p>
              “점심 사다 줘” 한 줄에 봉투가 매번 달랐죠. 요청을 잘한다는 건 짐작할 틈을 줄이는
              일이에요.
            </p>
          </li>
          <li className={styles.note} data-kind="memo">
            <h3 className={hand.className}>메모에 네 가지를 적어요</h3>
            <ul className={styles.tags}>
              {MEMO_PARTS.map((part) => (
                <li key={part.label}>{part.label}</li>
              ))}
            </ul>
            {request && (
              <div className={styles.mine}>
                <span>내가 쓴 메모</span>
                <p>{request}</p>
              </div>
            )}
          </li>
          <li className={styles.note} data-kind="paper">
            <h3 className={hand.className}>메모와 맞춰 보고, 고칠 곳만 다시 부탁해요</h3>
            <p>바꿀 것과 그대로 둘 것을 함께 말합니다.</p>
            {observation && (
              <div className={styles.mine}>
                <span>내가 확인한 것</span>
                <p>{observation}</p>
              </div>
            )}
            {revision && (
              <div className={styles.mine}>
                <span>적어 둔 수정 요청</span>
                <p>{revision}</p>
              </div>
            )}
          </li>
        </ol>

        <aside className={styles.ticket} aria-labelledby="request-next-title">
          <span className={styles.ticketLabel}>다음 수업</span>
          <h3 id="request-next-title">
            <span>{next.number}</span> {next.title}
          </h3>
          <p>오늘 쓴 메모처럼 부탁해서, 내 폴더에 첫 파일을 만들어요.</p>
        </aside>
      </div>
    </div>
  );
}

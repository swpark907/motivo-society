"use client";

// Client component: reads the stamps the learner pressed to say where they stand.
import Image from "next/image";
import { SETUP_STAMPS, useSetupStamps, WorkbookSetupStamps } from "./WorkbookSetupStamps";
import styles from "./WorkbookSetupCheck.module.scss";

/**
 * 1-4 screen 5: the finished (or not yet finished) stamp card. Nothing here checks the learner's
 * computer; the stamps are their own word. Leaving some for later is fine and the lesson can
 * still be finished — 1-5 and 1-6 then offer the read-along way.
 */
export function WorkbookSetupCheck() {
  const { stamps } = useSetupStamps();
  const left = SETUP_STAMPS.filter((_, index) => !stamps[index]);
  const ready = left.length === 0;
  return (
    <div data-lesson-wide className={styles.check}>
      <h2 id="lesson-screen-title" className={styles.title}>
        준비됐는지 확인해요
      </h2>
      <p className={styles.lead}>도장 카드를 볼까요? 아직 안 찍은 칸은 여기서 눌러도 됩니다.</p>

      <div className={styles.layout}>
        <WorkbookSetupStamps />
        <div className={styles.result} aria-live="polite" data-ready={ready || undefined}>
          {ready ? (
            <>
              <Image
                className={styles.capy}
                src="/images/workbook/lesson-1-2/capy-thumb.png"
                alt=""
                width={295}
                height={480}
              />
              <strong>준비가 끝났어요</strong>
              <p>다음 수업부터 내 컴퓨터에서 Claude Code와 함께 만들어요.</p>
            </>
          ) : (
            <>
              <strong>남은 것 {left.length}가지</strong>
              <ul>
                {left.map((stamp) => (
                  <li key={stamp.short}>{stamp.short}</li>
                ))}
              </ul>
              <p>
                지금 다 못 해도 괜찮아요. 다음 수업은 읽으면서 따라갈 수 있고, 준비되면 이 수업으로
                돌아와 도장을 찍으면 됩니다.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

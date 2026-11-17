"use client";

// Client component: the learner stamps what they actually did on their own computer. The stamps
// live in the visit's lesson state and set the setup status that 1-5 and 1-6 read.
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookSetupStamps.module.scss";

/** The four things 1-4 gets done outside the workbook, in order. */
export const SETUP_STAMPS = [
  { short: "설치", title: "Claude 앱을 설치했어요" },
  { short: "로그인", title: "로그인했어요" },
  { short: "Code 탭", title: "Code 탭을 열었어요" },
  { short: "작업 폴더", title: "작업 폴더를 정했어요" },
] as const;

/**
 * Stamps are the learner's own word that a step is done; nothing checks their computer.
 * All four stamped means "ready"; anything less is "pending" (they can come back later).
 */
export function useSetupStamps() {
  const { setSetupStatus } = useWorkbookProgress();
  const [stamps, setStamps] = useWorkbookLessonState<boolean[]>("setup-stamps", [
    false,
    false,
    false,
    false,
  ]);
  // 가장 최근에 찍은 도장 하나만 강조색으로 보여준다(한 화면에 주황은 한 곳).
  const [latest, setLatest] = useWorkbookLessonState<number | null>("setup-stamp-latest", null);
  function toggle(index: number) {
    const next = stamps.map((value, i) => (i === index ? !value : value));
    setStamps(next);
    setLatest(next[index] ? index : null);
    setSetupStatus(next.every(Boolean) ? "ready" : "pending");
  }
  return { stamps, toggle, latest };
}

/**
 * The stamp card. `only` limits which stamps can be pressed on this screen (the others are shown
 * as they are); with `only` omitted every stamp can be pressed.
 */
export function WorkbookSetupStamps({
  only,
  compact = false,
}: {
  only?: readonly number[];
  compact?: boolean;
}) {
  const { stamps, toggle, latest } = useSetupStamps();
  const done = stamps.filter(Boolean).length;
  return (
    <section
      className={styles.card}
      data-compact={compact || undefined}
      aria-label="준비 도장 카드"
    >
      <p className={styles.head}>
        <strong>준비 도장</strong>
        <span>
          {done} / {SETUP_STAMPS.length}
        </span>
      </p>
      <ul className={styles.stamps}>
        {SETUP_STAMPS.map((stamp, index) => {
          const pressable = !only || only.includes(index);
          return (
            <li key={stamp.short}>
              <button
                type="button"
                className={styles.stamp}
                aria-pressed={stamps[index]}
                data-latest={latest === index || undefined}
                aria-label={stamp.title}
                disabled={!pressable}
                onClick={() => toggle(index)}
              >
                <span className={styles.mark} aria-hidden="true">
                  {stamps[index] ? "완료" : index + 1}
                </span>
                <span className={styles.name}>{stamp.short}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className={styles.note}>
        {compact ? "마쳤으면 눌러서 도장을 찍어요." : "내 컴퓨터에서 직접 한 것만 눌러서 찍어요."}
      </p>
    </section>
  );
}

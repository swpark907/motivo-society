import type { ReactNode, Ref } from "react";
import styles from "./WorkbookMapPanel.module.scss";

export function WorkbookMapLessonCard({
  title,
  description,
  meta = "선택한 수업",
  hidden,
  disabled,
  completed = false,
  startRef,
  onStart,
  children,
  label = "선택한 학습 장소",
  startLabel = "수업 시작",
}: {
  title: string;
  description?: string;
  meta?: string;
  hidden?: boolean;
  disabled?: boolean;
  completed?: boolean;
  startRef?: Ref<HTMLButtonElement>;
  onStart: () => void;
  children?: ReactNode;
  label?: string;
  /** Button wording when the place is not a lesson (e.g. the class intro). */
  startLabel?: string;
}) {
  return (
    <section
      className={styles.lessonCard}
      data-completed={completed}
      aria-label={label}
      hidden={hidden}
    >
      <div className={styles.cardHeader}>
        <small>{meta}</small>
      </div>
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
      {children}
      <button
        ref={startRef}
        className={styles.start}
        disabled={disabled}
        onClick={onStart}
        aria-label={`${title} ${completed ? "다시 보기" : startLabel}`}
      >
        {completed ? "다시 보기 →" : `${startLabel} →`}
      </button>
    </section>
  );
}

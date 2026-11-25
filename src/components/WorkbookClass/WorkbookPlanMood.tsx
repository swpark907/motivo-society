"use client";

// Client component: 2-4 screen 2. Three moods (calm · bold · warm), each shown as color swatches and a
// font note; the chosen one repaints the learner's own page (WorkbookMyPage) beside them. Picking one goes to the plan record (mood);
// the request memo asks for it and unit 3 uses it when polishing the screen. The mood colors are sample
// data shown inside the preview, not workbook theme colors.
import { moodOptions } from "@/lib/workbook-plan-options";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { WorkbookMyPage, myPageFromRecord } from "./WorkbookMyPage";
import styles from "./WorkbookPlanMood.module.scss";

/** 2-4 screen 2: pick a mood and watch my page change. */
export function WorkbookPlanMood({
  record,
  update,
}: {
  record: ProjectRecord;
  update: (patch: Partial<ProjectRecord>) => void;
}) {
  const page = myPageFromRecord(record, 3);
  return (
    <div data-lesson-wide className={styles.mood}>
      <h2 id="lesson-screen-title" className={styles.title}>
        페이지의 분위기를 정해요
      </h2>
      <div className={styles.lead}>
        <p>
          같은 내용이라도 <strong>색과 글꼴</strong>에 따라 느낌이 달라져요. 읽을 사람에게 어울리는
          분위기를 하나 골라 두면, AI에게 부탁할 때 “예쁘게 해 줘” 대신 분명하게 말할 수 있어요.
        </p>
      </div>
      <div className={styles.desk}>
        <ul className={styles.options} aria-label="분위기">
          {moodOptions.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                aria-pressed={record.mood === option.id}
                aria-label={`${option.label} · ${option.note}`}
                onClick={() => update({ mood: option.id })}
              >
                <span className={styles.swatches} aria-hidden="true">
                  {Object.values(option.colors).map((color) => (
                    <i key={color} style={{ background: color }} />
                  ))}
                </span>
                <span className={styles.text}>
                  <strong>{option.label}</strong>
                  <small>{option.note}</small>
                  <small className={styles.font}>{option.font}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <WorkbookMyPage
          {...page}
          caption={
            record.mood
              ? "고른 분위기로 그린 내 페이지예요. 다른 분위기를 눌러 비교해 보세요."
              : "분위기를 고르면 내 페이지의 색과 글꼴이 바뀌어요."
          }
        />
      </div>
    </div>
  );
}

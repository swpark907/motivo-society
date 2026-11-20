"use client";

// Client component: 2-4 screen 2. Three moods (calm · bold · warm), each shown as color swatches, a font
// note and the learner's own page title drawn in that mood. Picking one goes to the plan record (mood);
// the request memo asks for it and unit 3 uses it when polishing the screen. The mood colors are sample
// data shown inside the preview, not workbook theme colors.
import { moodOptions } from "@/lib/workbook-plan-options";
import { findPlanButton } from "@/lib/workbook-plan-readers";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import styles from "./WorkbookPlanMood.module.scss";

/** 2-4 screen 2: the same page in three moods. */
export function WorkbookPlanMood({
  record,
  update,
}: {
  record: ProjectRecord;
  update: (patch: Partial<ProjectRecord>) => void;
}) {
  const title = record.title.trim() || "내 페이지 제목";
  const button = record.buttonLabel.trim() || findPlanButton(record.purpose)?.label || "버튼";
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
      <ul className={styles.options} aria-label="분위기">
        {moodOptions.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              aria-pressed={record.mood === option.id}
              onClick={() => update({ mood: option.id })}
            >
              <span
                className={styles.preview}
                data-font={option.id === "warm" ? "serif" : "sans"}
                style={{
                  background: option.colors.paper,
                  color: option.colors.ink,
                }}
                aria-hidden="true"
              >
                <b>{title}</b>
                <i style={{ background: option.colors.ink }} />
                <i style={{ background: option.colors.ink }} />
                <span className={styles.cta} style={{ background: option.colors.accent }}>
                  {button}
                </span>
              </span>
              <span className={styles.swatches} aria-hidden="true">
                {Object.values(option.colors).map((color) => (
                  <i key={color} style={{ background: color }} />
                ))}
              </span>
              <strong>{option.label}</strong>
              <small>{option.note}</small>
              <small className={styles.font}>{option.font}</small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

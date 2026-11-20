"use client";

// Client component: 2-3 screen 3. Three layout frames (stack · two columns · big photo on top) drawn as
// wireframes with the learner's own title, cards and button in them. Picking one shows it large. The
// pick goes to the plan record (layout); the request memo in 2-5 asks for this layout.
import { layoutOptions } from "@/lib/workbook-plan-options";
import { findPlanButton, planLines } from "@/lib/workbook-plan-readers";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import styles from "./WorkbookPlanSketch.module.scss";

function Wire({ layout, record, big }: { layout: string; record: ProjectRecord; big?: boolean }) {
  const cards = planLines(record.content).slice(0, big ? 4 : 3);
  const button = findPlanButton(record.purpose)?.label ?? "버튼";
  const title = record.title.trim() || "제목";
  return (
    <div className={styles.wire} data-layout={layout} data-big={big}>
      {layout === "hero" && <span className={styles.photo}>큰 사진</span>}
      <strong className={styles.title}>{title}</strong>
      <i className={styles.intro} />
      <div className={styles.cards}>
        {cards.length ? cards.map((card) => <span key={card}>{card}</span>) : <span>내용</span>}
      </div>
      <span className={styles.cta}>{button}</span>
    </div>
  );
}

/** 2-3 screen 3: draw boxes before asking for a page. */
export function WorkbookPlanSketch({
  record,
  update,
}: {
  record: ProjectRecord;
  update: (patch: Partial<ProjectRecord>) => void;
}) {
  const chosen = layoutOptions.find((option) => option.id === record.layout) ?? null;
  return (
    <div data-lesson-wide className={styles.sketch}>
      <h2 id="lesson-screen-title" className={styles.title}>
        종이에 칸을 그려 봐요
      </h2>
      <div className={styles.lead}>
        <p>
          만들기 전에 칸만 그려서 배치를 정해 보는 그림을 <strong>와이어프레임</strong>이라고 해요.
          색도 사진도 없이 상자만 그리니, 빠르게 여러 번 바꿔 볼 수 있어요. 내 내용으로 그린 틀 세
          가지 가운데 하나를 골라 볼까요?
        </p>
      </div>

      <div className={styles.desk}>
        <ul className={styles.options} aria-label="배치 틀">
          {layoutOptions.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                aria-pressed={record.layout === option.id}
                onClick={() => update({ layout: option.id })}
              >
                <Wire layout={option.id} record={record} />
                <strong>{option.label}</strong>
                <small>{option.note}</small>
              </button>
            </li>
          ))}
        </ul>
        <figure className={styles.paper} aria-live="polite">
          {chosen ? (
            <>
              <Wire layout={chosen.id} record={record} big />
              <figcaption>
                {chosen.label} · 실제 종이와 펜으로 한 번 더 그려 보면 더 좋아요.
              </figcaption>
            </>
          ) : (
            <p className={styles.empty}>틀을 고르면 여기에 크게 그려져요.</p>
          )}
        </figure>
      </div>
    </div>
  );
}

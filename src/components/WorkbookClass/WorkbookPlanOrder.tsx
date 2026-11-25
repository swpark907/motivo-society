"use client";

// Client component: the "지금" cards stacked inside a phone frame under the title and intro, with a
// dotted line where the first screen ends. The learner moves cards up and down; the order is saved
// as the plan's content order (the request lists them in this order). Only the first FOLD cards
// are above the line.
import { Nanum_Pen_Script } from "next/font/google";
import { planLines, type PlanButton, type PlanReader } from "@/lib/workbook-plan-readers";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import styles from "./WorkbookPlanOrder.module.scss";
import { FIRST_PAGE_TITLE } from "./WorkbookFileAsk";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/** 휴대폰 첫 화면에 제목·소개 아래로 들어가는 카드 수(설명용 어림값). */
export const FOLD = 2;

/** 2-1 screen 4: information order — what goes above the first-screen line. */
export function WorkbookPlanOrder({
  record,
  reader,
  button,
  update,
}: {
  record: ProjectRecord;
  reader: PlanReader;
  button: PlanButton | null;
  update: (patch: Partial<ProjectRecord>) => void;
}) {
  const cards = planLines(record.content);
  function move(index: number, by: -1 | 1) {
    const to = index + by;
    if (to < 0 || to >= cards.length) return;
    const next = [...cards];
    [next[index], next[to]] = [next[to], next[index]];
    update({ content: next.join("\n") });
  }
  return (
    <div data-lesson-wide className={styles.order}>
      <h2 id="lesson-screen-title" className={styles.title}>
        어떤 내용을 먼저 보여줄까요
      </h2>
      <div className={styles.lead}>
        <p>
          휴대폰으로 페이지를 열면 처음에는 화면 한 장만큼만 보여요. 그 안에서 궁금한 내용이 보여야
          아래로 더 내려 봅니다. 그래서 <strong>가장 중요한 내용을 위쪽에</strong> 둬요. 이렇게
          내용의 순서와 자리를 정하는 일을 <strong>정보 구조</strong>라고 해요.
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.phone} aria-label="휴대폰 화면 속 내 페이지">
          <strong className={styles.pageTitle}>{record.title.trim() || FIRST_PAGE_TITLE}</strong>
          <i className={styles.introBar} aria-hidden="true" />
          {cards.length === 0 && (
            <p className={styles.empty}>앞 화면에서 ‘지금 넣기’로 고른 카드가 여기 나와요</p>
          )}
          <ol className={styles.cards}>
            {cards.map((card, index) => (
              <li key={`${card}-${index}`} data-below={index >= FOLD}>
                {index === FOLD && (
                  <span className={styles.fold} aria-hidden="true">
                    여기까지가 첫 화면
                  </span>
                )}
                <span className={styles.card}>{card}</span>
                <span className={styles.moves}>
                  <button
                    type="button"
                    aria-label={`${card} 위로`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`${card} 아래로`}
                    disabled={index === cards.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </button>
                </span>
              </li>
            ))}
          </ol>
          {button && <span className={styles.cta}>{button.label}</span>}
        </div>

        <div className={styles.side}>
          <p className={`${styles.voice} ${hand.className}`}>
            {reader.tag}: “저는 {reader.looksFor}부터 보고 싶어요.”
          </p>
          <p>
            ↑↓ 버튼으로 카드 순서를 바꿔 보세요. 점선 위는 휴대폰을 열자마자 보이는 곳이고, 점선
            아래는 화면을 내려야 보이는 곳이에요.
          </p>
          <p className={styles.note}>
            여기서 정한 순서는 다음 수업의 요청에 그대로 들어가서, AI에게 이 순서대로 배치해 달라고
            부탁하게 돼요.
          </p>
        </div>
      </div>
    </div>
  );
}

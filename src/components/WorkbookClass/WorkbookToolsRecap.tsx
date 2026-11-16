import Image from "next/image";
import type { CSSProperties } from "react";
import styles from "./WorkbookToolsRecap.module.scss";

/** What 1-2 covered, in the order the screens showed it. */
const LEARNED = [
  {
    term: "무엇을 만들지에 따라 AI가 달라요",
    text: "글, 그림, 영상, 3D, 웹사이트 빌더, 코드 에이전트가 있어요.",
  },
  {
    term: "코드 에이전트는 파일을 직접 만들고 고쳐요",
    text: "챗봇은 답을 글로 주고, 코드 에이전트는 내 폴더에서 일해요.",
  },
  {
    term: "바꾸기 전에 묻고, 확인은 내가 해요",
    text: "폴더를 정하고, 허락하고, 결과를 보고 다시 부탁해요.",
  },
] as const;

/**
 * 1-2 screen 6: the recap as one page of a notebook (1-1 used three cards, so this lesson
 * changes the form). Three lines get ticked in order once, the capybara sticker from the comic
 * sits on the corner, and a ticket points to the next lesson as planned in
 * docs/product/workbook-unit-1-plan.md. CSS-only motion; reduced motion shows the finished page.
 */
export function WorkbookToolsRecap() {
  return (
    <div data-lesson-wide className={styles.recap}>
      <h2 id="lesson-screen-title" className={styles.title}>
        오늘 알게 된 것
      </h2>

      <div className={styles.layout}>
        <div className={styles.page}>
          <span className={styles.holes} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <ol className={styles.lines}>
            {LEARNED.map((item, index) => (
              <li key={item.term} style={{ "--i": index } as CSSProperties}>
                <svg className={styles.tick} viewBox="0 0 28 28" aria-hidden="true">
                  <path d="M5 15l6 7L24 6" />
                </svg>
                <div>
                  <strong>{item.term}</strong>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <Image
            className={styles.capy}
            src="/images/workbook/lesson-1-2/capy-thumb.png"
            alt=""
            width={295}
            height={480}
          />
        </div>

        <aside className={styles.ticket} aria-labelledby="tools-next-title">
          <span className={styles.ticketLabel}>다음 수업</span>
          <h3 id="tools-next-title">
            <span>1-3</span> AI를 쓰는 만큼
          </h3>
          <p>AI가 얼마나 읽고 쓰는지, 그게 왜 요금과 이어지는지 알아봐요.</p>
        </aside>
      </div>
    </div>
  );
}

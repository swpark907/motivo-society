import type { CSSProperties, ReactNode } from "react";
import styles from "./WorkbookLessonRecap.module.scss";
import { scissorCut } from "./workbook-collage";

/** What 1-1 covered, one card per idea, in the order the screens showed them. */
const LEARNED = [
  {
    term: "생성형 AI",
    text: "부탁을 받으면 글·그림·코드를 새로 만들어요.",
  },
  {
    term: "바이브코딩",
    text: "코드도 규칙이 있는 글자라서 AI가 만들 수 있어요. 결과를 보고 고쳐 달라고 말하며 완성해요.",
  },
  {
    term: "LLM",
    text: "많은 글로 언어를 익혀 사람과 말로 주고받는 AI예요. GPT·Claude·Gemini가 대표적이에요.",
  },
] as const;

/** A scrap from the screen each card sums up; it lands with the card and then fades away. */
const SCRAPS: ReactNode[] = [
  <svg key="cat" viewBox="0 0 48 40" role="presentation">
    <rect width="48" height="40" fill="#f3e3c4" />
    <path d="M10 34c0-9 6-14 14-14s14 5 14 14z" fill="#e08a4b" />
    <path d="M16 22l2-8 6 6M32 22l-2-8-6 6" fill="#e08a4b" />
  </svg>,
  <code key="tag" className={styles.codeScrap}>
    &lt;h1&gt;
  </code>,
  <span key="llm" className={styles.nameScrap}>
    GPT · Claude · Gemini
  </span>,
];

/** The rest of unit 1, as planned in docs/product/workbook-unit-1-plan.md. */
const NEXT = [
  { label: "1-2", title: "어떤 AI를 쓸까", text: "챗봇과 코드 에이전트의 차이" },
  { label: "1-3", title: "AI를 쓰는 만큼", text: "토큰과 요금제" },
  { label: "1-4", title: "도구와 작업 공간 준비", text: "설치하고 프로젝트 폴더 정하기" },
  { label: "1-5", title: "요청 잘하기", text: "원하는 결과를 말로 전하기" },
  { label: "1-6", title: "첫 코드 만들기", text: "화면 파일을 만들고 브라우저에서 확인" },
] as const;

/**
 * 1-1 screen 6: a calm recap. Three cards for what was learned, then where unit 1 goes next.
 * Motion is CSS only and plays once on entry: the cards stick on in order, each with a scrap of
 * its screen that fades away, then the path to the next lessons draws left to right.
 */
export function WorkbookLessonRecap() {
  return (
    <div data-lesson-wide className={styles.recap}>
      <h2 id="lesson-screen-title" className={styles.title}>
        오늘 알게 된 것
      </h2>
      <ol className={styles.learned}>
        {LEARNED.map((item, index) => (
          <li key={item.term} style={{ "--i": index } as CSSProperties}>
            <span
              className={styles.scrap}
              style={scissorCut(17 + index * 9, 5, 6)}
              aria-hidden="true"
            >
              {SCRAPS[index]}
            </span>
            <span className={styles.number} aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <strong>{item.term}</strong>
            <p>{item.text}</p>
          </li>
        ))}
      </ol>
      <section className={styles.next} aria-labelledby="unit-next-title">
        <h3 id="unit-next-title">1단원에서 이어서 배울 것</h3>
        <ol>
          {NEXT.map((item, index) => (
            <li key={item.label} style={{ "--j": index } as CSSProperties}>
              <span className={styles.label}>
                {item.label}
                {index === 0 && <span className={styles.upNext}>다음</span>}
              </span>
              <strong>{item.title}</strong>
              <span className={styles.what}>{item.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

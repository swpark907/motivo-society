"use client";

// Client component: "화면으로 보기" reveals what the code line turns into on a web page.
import { useState } from "react";
import styles from "./WorkbookCodeIsText.module.scss";

/**
 * 1-1 screen 2: a Korean sentence and one HTML line side by side.
 * Both open and close with a pair of marks (quotes ↔ tags); the matching marks share a color.
 * A calm comparison screen between the two collage scenes.
 */
export function WorkbookCodeIsText() {
  const [rendered, setRendered] = useState(false);
  return (
    <div data-lesson-wide>
      <p>
        코드라고 하면 어렵게 느껴지지만, 코드는{" "}
        <strong>정해진 규칙에 맞춰 글자를 늘어놓은 것</strong>
        이에요. 우리가 매일 쓰는 문장과 나란히 놓고 볼게요.
      </p>
      <div className={styles.pair}>
        <section className={styles.card} aria-labelledby="code-text-sentence">
          <h3 id="code-text-sentence" className={styles.cardLabel}>
            우리가 쓰는 문장
          </h3>
          <p className={styles.sample}>
            사장님이 말했어요.
            <br />
            <span className={styles.nowrap}>
              <mark className={styles.open}>“</mark>창가 자리가 비었어요.
              <mark className={styles.close}>”</mark>
            </span>
          </p>
          <ul className={styles.rules}>
            <li>
              <mark className={styles.open}>“</mark>로 열고 <mark className={styles.close}>”</mark>
              로 닫으면,
            </li>
            <li>그 사이는 누군가 한 말이에요.</li>
          </ul>
        </section>
        <section className={styles.card} aria-labelledby="code-text-html">
          <h3 id="code-text-html" className={styles.cardLabel}>
            웹페이지 코드(HTML)
          </h3>
          <p className={`${styles.sample} ${styles.code}`}>
            <code>
              <mark className={styles.open}>&lt;h1&gt;</mark>
              <span className={styles.codeText}>창가 책방</span>
              <mark className={styles.close}>&lt;/h1&gt;</mark>
            </code>
          </p>
          <ul className={styles.rules}>
            <li>
              <mark className={styles.open}>&lt;h1&gt;</mark>로 열고{" "}
              <mark className={styles.close}>&lt;/h1&gt;</mark>로 닫으면,
            </li>
            <li>그 사이는 페이지의 큰 제목이에요.</li>
          </ul>
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={rendered}
            aria-controls="code-text-result"
            onClick={() => setRendered((value) => !value)}
          >
            {rendered ? "화면 접기" : "화면으로 보기"}
          </button>
          <div id="code-text-result" className={styles.browser} hidden={!rendered}>
            <span className={styles.address} aria-hidden="true">
              index.html
            </span>
            <p className={styles.page}>창가 책방</p>
          </div>
        </section>
      </div>
      <p>
        규칙만 지키면 코드도 문장처럼 글자로 쓸 수 있어요. 그래서 글을 만드는 생성형 AI는{" "}
        <strong>코드도 만들 수 있어요.</strong>
      </p>
      <p>
        원하는 것을 말로 설명하면 AI가 코드를 쓰고, 우리는 결과를 보며 다듬어요. 이렇게 만드는
        방식을 <strong>바이브코딩</strong>이라고 해요.
      </p>
    </div>
  );
}

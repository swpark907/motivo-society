"use client";

// Client component: the two cups fill step by step once when the screen opens, and "다시 보기"
// replays it. Reduced-motion users get the finished cups at once.
import { useEffect, useState } from "react";
import { WorkbookUsageCup } from "./WorkbookUsageCup";
import styles from "./WorkbookUsageCups.module.scss";

const REQUEST = "제목 색을 바꿔줘";
/** What the agent does for the same request; each line pours a little more into its cup. */
const AGENT_STEPS = ["index.html 읽기", "style.css 읽기", "제목 색 고치기", "바뀐 화면 다시 확인"];
const LAST = AGENT_STEPS.length + 1;

/**
 * 1-3 screen 3: why a code agent uses more. The same request goes to a chatbot and to an agent;
 * the chatbot's cup takes one pour, the agent's cup takes one per file it reads and each check.
 * The levels are an example of the idea, with no numbers, so they are not read as measurements.
 */
export function WorkbookUsageCups() {
  const [tick, setTick] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => setTick(LAST));
      return () => cancelAnimationFrame(frame);
    }
    let current = 0;
    const reset = requestAnimationFrame(() => setTick(0));
    const timer = setInterval(() => {
      current += 1;
      setTick(current);
      if (current >= LAST) clearInterval(timer);
    }, 750);
    return () => {
      cancelAnimationFrame(reset);
      clearInterval(timer);
    };
  }, [run]);

  const agentDone = Math.max(0, Math.min(AGENT_STEPS.length, tick - 1));

  return (
    <div data-lesson-wide className={styles.cups}>
      <h2 id="lesson-screen-title" className={styles.title}>
        에이전트는 더 많이 읽어요
      </h2>
      <div className={styles.lead}>
        <p>
          코드 에이전트는 답하기 전에 파일을 열어 읽고, 고친 뒤 다시 확인합니다. 그래서 같은
          부탁이라도 대화만 할 때보다 조각을 훨씬 많이 써요.
        </p>
        <p>쓸 수 있는 양에 더 빨리 닿는 이유죠.</p>
      </div>

      <p className={styles.request}>
        <span>같은 부탁</span> {REQUEST}
      </p>

      <div className={styles.pair}>
        <section className={styles.side} aria-label="챗봇이 쓴 양">
          <h3>챗봇</h3>
          <div className={styles.row}>
            <div className={styles.cup}>
              <WorkbookUsageCup level={tick >= 1 ? 1 : 0} max={6} label="챗봇이 쓴 양: 조금" />
            </div>
            <ul className={styles.log}>
              <li data-on={tick >= 1 || undefined}>답 한 번 쓰기</li>
            </ul>
          </div>
        </section>

        <section className={styles.side} aria-label="코드 에이전트가 쓴 양">
          <h3>코드 에이전트</h3>
          <div className={styles.row}>
            <div className={styles.cup}>
              <WorkbookUsageCup
                level={tick >= 1 ? 1 + agentDone : 0}
                max={6}
                label="코드 에이전트가 쓴 양: 많이"
              />
            </div>
            <ul className={styles.log}>
              <li data-on={tick >= 1 || undefined}>부탁 읽기</li>
              {AGENT_STEPS.map((step, index) => (
                <li key={step} data-on={agentDone > index || undefined}>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className={styles.foot}>
        <p>컵의 높이는 차이를 보여주는 예시예요. 실제 양은 작업마다 달라요.</p>
        <button type="button" className={styles.replay} onClick={() => setRun((n) => n + 1)}>
          다시 보기
        </button>
      </div>
    </div>
  );
}

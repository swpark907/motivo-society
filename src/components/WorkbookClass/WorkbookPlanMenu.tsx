import { WorkbookUsageCup } from "./WorkbookUsageCup";
import styles from "./WorkbookPlanMenu.module.scss";

/**
 * Claude plans, checked on claude.com/pricing and the support articles on 2026-11-16:
 * Free has limited use and no Claude Code; Pro is $20 a month ($17 on an annual plan), Max $100,
 * Ultra $200; Claude Code comes with every paid plan and shares the plan's limits with chat;
 * limits reset every five hours and every week. Prices change, so the screen carries the date.
 * The cup sizes only show "more than the one before", not exact ratios.
 */
const PLANS = [
  { name: "Free", price: "무료", cup: 1, code: false, note: "가볍게 써 보기" },
  { name: "Pro", price: "월 20달러", cup: 2, code: true, note: "Free보다 넉넉하게" },
  { name: "Max", price: "월 100달러", cup: 4, code: true, note: "Pro보다 훨씬 많이" },
  { name: "Ultra", price: "월 200달러", cup: 6, code: true, note: "가장 많이" },
] as const;

/**
 * 1-3 screen 4: why plans differ, as a paper menu. A quiet screen with no motion.
 * It says what is verified (Claude Code needs a paid plan) and does not promise which plan is
 * enough for the class: that needs real practice to say.
 */
export function WorkbookPlanMenu() {
  return (
    <div data-lesson-wide className={styles.menu}>
      <h2 id="lesson-screen-title" className={styles.title}>
        그래서 요금제가 나뉘어요
      </h2>
      <div className={styles.lead}>
        <p>
          요금제는 주로 <strong>쓸 수 있는 양</strong>에서 차이가 납니다. 우리가 쓸 Claude를 예로
          볼게요.
        </p>
      </div>

      <div className={styles.board}>
        <p className={styles.boardTitle}>
          Claude 요금제 <span>2026년 11월 기준</span>
        </p>
        <ul className={styles.plans}>
          {PLANS.map((plan) => (
            <li key={plan.name} data-code={plan.code || undefined}>
              <div className={styles.cup}>
                <WorkbookUsageCup level={plan.cup} max={6} label={`${plan.name}: ${plan.note}`} />
              </div>
              <strong lang="en">{plan.name}</strong>
              <span className={styles.price}>{plan.price}</span>
              <span className={styles.note}>{plan.note}</span>
              <span className={styles.code}>
                {plan.code ? "Claude Code 쓸 수 있어요" : "Claude Code는 못 써요"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ul className={styles.facts}>
        <li>
          쓸 수 있는 양은 <strong>5시간마다, 그리고 주마다</strong> 다시 찹니다.
        </li>
        <li>Claude Code와 채팅은 같은 양을 나눠 써요.</li>
        <li>
          이 클래스 실습에는 <strong>Claude Code를 쓸 수 있는 요금제</strong>가 필요해요. 가격과
          한도는 바뀔 수 있으니 가입 전에 공식 요금 페이지를 확인하세요.
        </li>
      </ul>
    </div>
  );
}

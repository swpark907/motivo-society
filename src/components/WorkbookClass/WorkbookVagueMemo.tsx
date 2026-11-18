"use client";

// Client component: the learner hands the same lunch memo to a helper up to three times. How many
// bags have come back is kept in the visit's lesson state, so returning shows the same table.
import { useRef } from "react";
import Image from "next/image";
import { Nanum_Pen_Script } from "next/font/google";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookVagueMemo.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/**
 * What the helper brings back for the same memo ("점심 사다 줘"). Each bag fills a different gap
 * the memo left open; `guessed` names that gap in the helper's own words.
 */
const BAGS = [
  { menu: "매운 짬뽕 곱빼기", guessed: "매운 걸 좋아하겠지?" },
  { menu: "샐러드 하나", guessed: "가볍게 먹고 싶겠지?" },
  { menu: "김밥 열 줄", guessed: "여럿이 먹겠지?" },
] as const;

/**
 * 1-5 screen 1: what asking well means, shown with an everyday errand before any AI example.
 * Opens from where the learner is (tools ready), invites them to hand a short memo over, and only
 * then connects the finding to AI. Nothing is graded.
 */
export function WorkbookVagueMemo() {
  const [count, setCount] = useWorkbookLessonState("ai-5-errand-count", 0);
  const shown = Math.min(count, BAGS.length);
  const done = shown === BAGS.length;
  const table = useRef<HTMLOListElement>(null);
  // On a narrow screen the new bag lands below the fold; bring it into view after it is added.
  function handOver() {
    setCount(shown + 1);
    requestAnimationFrame(() =>
      table.current?.lastElementChild?.scrollIntoView({ block: "nearest" }),
    );
  }

  return (
    <div data-lesson-wide className={styles.vague}>
      <h2 id="lesson-screen-title" className={styles.title}>
        AI에게 요청을 잘한다는 건 어떤 걸까요
      </h2>
      <div className={styles.lead}>
        <p>
          이제 AI에게 일을 맡겨 볼 차례입니다. 그 전에, 조수에게 심부름을 부탁하는 장면부터 떠올려
          볼게요.
        </p>
      </div>

      <div className={styles.scene}>
        <div className={styles.give}>
          <div className={styles.memoWrap}>
            <Image
              className={styles.capy}
              src="/images/workbook/lesson-1-2/capy-ask.png"
              alt=""
              aria-hidden="true"
              width={306}
              height={480}
            />
            <figure className={styles.memo}>
              <figcaption>조수에게 건넬 메모</figcaption>
              <blockquote className={hand.className}>점심 사다 줘</blockquote>
            </figure>
          </div>
          <div className={styles.action}>
            {done ? (
              <button type="button" className={styles.again} onClick={() => setCount(0)}>
                처음부터 다시
              </button>
            ) : (
              <>
                {shown === 0 && <p className={styles.invite}>이 메모를 조수에게 건네 볼까요?</p>}
                <button type="button" className={styles.hand} onClick={handOver}>
                  {shown === 0 ? "메모 건네기" : "같은 메모 한 번 더 건네기"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.back}>
          <h3 className={styles.backTitle}>조수가 사 온 것</h3>
          {/* 화면 읽기 도구에는 바뀐 것 하나만 읽어 준다: 새 봉투, 세 번째에는 정리까지. */}
          <p className={styles.announce} aria-live="polite">
            {shown > 0 && `${shown}번째 봉투: ${BAGS[shown - 1].menu}. ${BAGS[shown - 1].guessed}`}
            {done &&
              " 메모에 없던 것을 조수가 짐작했어요. 요청을 잘한다는 건 짐작할 틈을 줄이는 일입니다."}
          </p>
          {shown === 0 && <p className={styles.empty}>메모를 건네면 여기에 봉투가 놓여요.</p>}
          <ol ref={table} className={styles.bags}>
            {BAGS.slice(0, shown).map((bag, index) => (
              <li key={bag.menu} className={styles.bagItem}>
                <div className={styles.bag}>
                  <span className={styles.nth}>{index + 1}번째</span>
                  <strong className={styles.menu}>{bag.menu}</strong>
                </div>
                <p className={`${styles.guessed} ${hand.className}`}>{bag.guessed}</p>
              </li>
            ))}
          </ol>
          <div className={styles.closing}>
            {done && (
              <>
                <p>
                  메모에는 무엇을, 얼마나 사 올지가 없었어요. 그래서 조수는 매번 다르게 짐작했죠.
                </p>
                <p>
                  AI에게 부탁할 때도 똑같습니다. 적지 않은 부분은 AI가 짐작해서 채워요. 요청을
                  잘한다는 건 <strong>짐작할 틈을 줄이는 일</strong>입니다.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

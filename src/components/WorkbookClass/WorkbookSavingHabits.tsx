"use client";

// Client component: the learner switches three habits on and off and the cup level follows.
// Which habits are on is kept in the visit's lesson state.
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { WorkbookUsageCup } from "./WorkbookUsageCup";
import styles from "./WorkbookSavingHabits.module.scss";

const HABITS = [
  {
    title: "주제가 바뀌면 새 대화로 시작해요",
    before: "한 대화에서 소개 페이지도, 메뉴도, 다른 프로젝트도 계속 이어서 부탁해요.",
    after: "소개 페이지가 끝나면 새 대화를 열고 다음 일을 부탁해요.",
    why: "지난 이야기를 매번 다시 읽지 않아도 돼요.",
  },
  {
    title: "큰 일은 작게 나눠서 맡겨요",
    before: "“홈페이지 전체를 한 번에 다 만들어줘.”",
    after: "“먼저 맨 위 소개 부분만 만들어줘.”",
    why: "잘못됐을 때 전부 다시 하지 않아도 돼요.",
  },
  {
    title: "필요한 파일만 콕 집어 알려줘요",
    before: "“어딘가에 있는 제목 색 좀 바꿔줘.”",
    after: "“index.html의 제목 색을 바꿔줘.”",
    why: "찾느라 다른 파일을 열어 보지 않아도 돼요.",
  },
] as const;

/**
 * 1-3 screen 5: three habits that use less. Each card is a before/after switch and the cup
 * drops as habits turn on. The cup is an example of the idea: how much is saved depends on the
 * work, and the screen says so. Not a quiz: nothing is right or wrong to switch.
 */
export function WorkbookSavingHabits() {
  const [on, setOn] = useWorkbookLessonState<boolean[]>("ai-2-habits", [false, false, false]);
  const active = on.filter(Boolean).length;

  return (
    <div data-lesson-wide className={styles.habits}>
      <h2 id="lesson-screen-title" className={styles.title}>
        아껴 쓰는 세 가지 습관
      </h2>
      <p className={styles.lead}>
        몇 가지 습관만 들여도 같은 요금제로 더 오래 쓸 수 있어요. 습관을 하나씩 켜 볼까요?
      </p>

      <div className={styles.layout}>
        <ul className={styles.cards}>
          {HABITS.map((habit, index) => (
            <li key={habit.title} data-on={on[index] || undefined}>
              <button
                type="button"
                role="switch"
                aria-checked={on[index]}
                className={styles.switch}
                onClick={() =>
                  setOn((previous) => previous.map((value, i) => (i === index ? !value : value)))
                }
              >
                <span className={styles.knob} aria-hidden="true" />
                <span>{habit.title}</span>
              </button>
              <p className={styles.sample}>{on[index] ? habit.after : habit.before}</p>
              {on[index] && <p className={styles.why}>{habit.why}</p>}
            </li>
          ))}
        </ul>

        <div className={styles.meter} aria-live="polite">
          <div className={styles.cup}>
            <WorkbookUsageCup
              level={5 - active}
              max={6}
              label={`쓰는 양: 습관 ${active}개를 켠 상태`}
            />
          </div>
          <p>
            {active === 0
              ? "습관을 켜기 전이에요"
              : active === 3
                ? "세 가지를 다 켰어요"
                : `습관 ${active}개를 켰어요`}
          </p>
          <small>얼마나 줄어드는지는 작업마다 달라요.</small>
        </div>
      </div>
    </div>
  );
}

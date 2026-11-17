import styles from "./WorkbookSetupStart.module.scss";

/**
 * 1-4 screen 1: what gets done today, and what it takes. The plan is a plain numbered list, not
 * the stamp card: empty stamps here looked pressable and made people tap them before doing
 * anything (planner's feedback, 2026-11-17). Stamps appear from the next screen, where each one
 * has something to do first. This is the first lesson with work
 * outside the workbook, so it says so up front, including that Claude Code needs a paid plan
 * (checked on claude.com/pricing and the desktop quickstart on 2026-11-17: Pro is $20 a month,
 * macOS 13+ / Windows 10 1809+). Reading only and coming back later is allowed.
 */
/** The four things done on the learner's own computer, in order (same as the stamps). */
const PLAN = [
  { title: "Claude 앱 설치하기", text: "설치 파일을 받아서 설치해요." },
  { title: "로그인하기", text: "Claude 계정으로 들어가요." },
  { title: "Code 탭 열기", text: "앱에서 Claude Code를 찾아요." },
  { title: "작업 폴더 정하기", text: "만들 것을 담을 폴더를 만들어요." },
] as const;

export function WorkbookSetupStart() {
  return (
    <div data-lesson-wide className={styles.start}>
      <h2 id="lesson-screen-title" className={styles.title}>
        오늘 준비할 네 가지
      </h2>
      <div className={styles.lead}>
        <p>
          이번 수업에는 워크북 밖에서, <strong>내 컴퓨터로 직접 하는 일</strong>이 있습니다. 하나를
          마칠 때마다 돌아와서 도장을 찍어요.
        </p>
      </div>

      <div className={styles.layout}>
        <section className={styles.plan} aria-labelledby="setup-plan-title">
          <h3 id="setup-plan-title">오늘의 순서</h3>
          <ol>
            {PLAN.map((item, index) => (
              <li key={item.title}>
                <span className={styles.number} aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>
              </li>
            ))}
          </ol>
          <p className={styles.how}>
            <span className={styles.sample} aria-hidden="true">
              완료
            </span>
            하나를 마치면 그 화면에서 이렇게 도장을 찍어요.
          </p>
        </section>

        <section className={styles.needs} aria-labelledby="setup-needs-title">
          <h3 id="setup-needs-title">시작하기 전에</h3>
          <ul>
            <li>
              <strong>컴퓨터</strong>
              <span>Windows 10 이상 또는 macOS 13 이상</span>
            </li>
            <li>
              <strong>Claude 계정</strong>
              <span>없으면 설치하면서 만들어요</span>
            </li>
            <li>
              <strong>유료 요금제</strong>
              <span>
                Claude Code는 유료 요금제에서 쓸 수 있어요. 가장 낮은 Pro가 월 20달러예요(2026년
                11월 기준).
              </span>
            </li>
          </ul>
          <p>
            컴퓨터가 없거나 결제 전이라면 읽기만 하고 넘어가도 괜찮아요. 준비되면 돌아와서 도장을
            찍으면 됩니다.
          </p>
        </section>
      </div>
    </div>
  );
}

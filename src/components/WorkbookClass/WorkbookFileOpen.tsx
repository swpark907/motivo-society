"use client";

// Client component: the learner reads the three steps for opening the file, writes what they saw,
// and stamps that they saw it.
import { WorkbookDoneStamp } from "./WorkbookDoneStamp";
import { useFirstFilePractice } from "./useFirstFilePractice";
import styles from "./WorkbookFileOpen.module.scss";

/**
 * The folder was made on the desktop in the setup lesson. The steps are the same on Windows and
 * Mac, so there is no computer picker here (an earlier draft had one that only changed spacing).
 */
const STEPS = [
  "바탕 화면의 my-first-web 폴더를 두 번 눌러 열어요.",
  "안에 있는 index.html 파일을 두 번 눌러요.",
  "브라우저가 열리고 내 소개 화면이 나와요.",
] as const;

/**
 * 1-6 screen 3: open the file. The sketch is our own drawing of a folder window with one file,
 * not a screenshot. Says the page is still only on this computer (not published).
 */
export function WorkbookFileOpen() {
  const { record, save } = useFirstFilePractice();

  return (
    <div data-lesson-wide className={styles.open}>
      <h2 id="lesson-screen-title" className={styles.title}>
        만든 파일을 열어 봐요
      </h2>
      <div className={styles.lead}>
        <p>
          파일이 생겼으면 눈으로 확인할 차례입니다. 파일은 Claude 앱 안이 아니라 내 컴퓨터의 폴더에
          있어요. 그 폴더로 가서 열어 볼까요?
        </p>
      </div>

      <div className={styles.desk}>
        <div className={styles.way}>
          <ol className={styles.steps}>
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className={styles.local}>
            주소 칸이 <code>file://</code>로 시작하면 내 컴퓨터의 파일을 보고 있는 거예요. 아직
            인터넷에 올라간 화면은 아닙니다.
          </p>
        </div>

        <div className={styles.side}>
          <svg
            className={styles.sketch}
            viewBox="0 0 320 132"
            role="img"
            aria-label="폴더 안의 파일"
          >
            <rect x="1" y="1" width="318" height="130" rx="6" className={styles.frame} />
            <path d="M1 26h318" className={styles.rule} />
            <text x="14" y="18" className={styles.small}>
              my-first-web
            </text>
            <rect x="12" y="38" width="296" height="34" rx="4" className={styles.pick} />
            <rect x="24" y="45" width="15" height="20" className={styles.sheet} />
            <text x="50" y="60" className={styles.name}>
              index.html
            </text>
            <text x="296" y="60" textAnchor="end" className={styles.small}>
              두 번 누르기
            </text>
            <rect x="24" y="88" width="120" height="6" rx="3" className={styles.block} />
            <rect x="24" y="106" width="86" height="6" rx="3" className={styles.block} />
          </svg>
          {record.mode === "example" ? (
            <p className={styles.later}>
              컴퓨터가 준비되면 이 순서대로 열어 봐요. 지금은 그림으로 순서만 봐 두면 돼요.
            </p>
          ) : (
            <>
              <label className={styles.mine}>
                <span>
                  화면에 무엇이 보였는지 한 줄로 적어 볼까요?{" "}
                  <small>
                    안 적어도 돼요. 적어 두면 다음 단원에서 내 파일을 확인한 기록으로 이어져요.
                  </small>
                </span>
                <input
                  type="text"
                  value={record.observation}
                  placeholder="예: 제목 ‘내 소개’와 세 문장이 보였다"
                  autoComplete="off"
                  onChange={(event) => save({ observation: event.target.value })}
                />
              </label>
              <WorkbookDoneStamp index={1} ask="화면을 봤으면 눌러서 도장을 찍어요" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

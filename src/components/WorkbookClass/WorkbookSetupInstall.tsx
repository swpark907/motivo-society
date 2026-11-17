"use client";

// Client component: the learner picks their computer (Windows or Mac) and the steps follow.
// The choice is kept in the visit's lesson state and reused on the folder screen.
import { useEffect } from "react";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { WorkbookSetupStamps } from "./WorkbookSetupStamps";
import styles from "./WorkbookSetupInstall.module.scss";

export type SetupOs = "windows" | "mac";

/**
 * Install steps from the official desktop quickstart (code.claude.com/docs/en/desktop-quickstart,
 * checked 2026-11-17): download the installer and run it, launch Claude from the Start menu
 * (Windows) or the Applications folder (macOS), then sign in. Not verified by installing on both
 * systems here, so the plan doc asks for a check against the real app before release.
 */
const DOWNLOAD = "https://claude.com/download";

const STEPS: Record<SetupOs, { title: string; text: string; download?: true }[]> = {
  windows: [
    { title: "설치 파일 받기", text: "에서 Windows 줄의 ‘다운로드’를 눌러요.", download: true },
    {
      title: "설치하기",
      text: "다운로드 폴더에서 받은 파일을 두 번 눌러 열고, 안내를 따라 설치해요.",
    },
    { title: "Claude 열기", text: "시작 메뉴에서 Claude를 검색해서 열어요." },
    { title: "로그인하기", text: "Claude 계정으로 로그인해요. 없으면 여기서 만들어요." },
  ],
  mac: [
    { title: "설치 파일 받기", text: "에서 macOS 줄의 ‘다운로드’를 눌러요.", download: true },
    {
      title: "설치하기",
      text: "다운로드 폴더에서 받은 파일을 두 번 눌러 열고, 안내를 따라 설치해요.",
    },
    { title: "Claude 열기", text: "응용 프로그램 폴더에서 Claude를 찾아 열어요." },
    { title: "로그인하기", text: "Claude 계정으로 로그인해요. 없으면 여기서 만들어요." },
  ],
};

/**
 * 1-4 screen 2: install, as an assembly-manual strip of numbered steps. Each step shows a small
 * sketch of the screen with the place to press ringed, and follows the chosen computer.
 * "막혔을 때" stays folded so the steps read first.
 */
export function WorkbookSetupInstall() {
  const [os, setOs] = useWorkbookLessonState<SetupOs>("setup-os", "windows");
  // 처음 열 때 한 번, 지금 쓰는 컴퓨터가 Mac이면 Mac 안내를 먼저 보여준다. 직접 고른 뒤에는 바꾸지 않는다.
  const [detected, setDetected] = useWorkbookLessonState("setup-os-detected", false);
  useEffect(() => {
    if (detected) return;
    setDetected(true);
    if (/Mac/i.test(navigator.userAgent) && !/iPhone|iPad/i.test(navigator.userAgent)) setOs("mac");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 방문 중 한 번만 맞춘다
  }, [detected]);
  return (
    <div data-lesson-wide className={styles.install}>
      <h2 id="lesson-screen-title" className={styles.title}>
        Claude를 설치해요
      </h2>
      <p className={styles.lead}>
        Claude Code는 <strong>Claude 앱</strong> 안에 들어 있습니다. 앱 하나만 설치하면 돼요.
      </p>

      <div className={styles.os} role="group" aria-label="내 컴퓨터 고르기">
        <button type="button" aria-pressed={os === "windows"} onClick={() => setOs("windows")}>
          Windows
        </button>
        <button type="button" aria-pressed={os === "mac"} onClick={() => setOs("mac")}>
          Mac
        </button>
      </div>

      <ol className={styles.steps}>
        {STEPS[os].map((step, index) => (
          <li key={step.title}>
            <span className={styles.number}>{index + 1}</span>
            <span className={styles.art} aria-hidden="true">
              <StepArt index={index} os={os} />
            </span>
            <strong>{step.title}</strong>
            <span className={styles.text}>
              {step.download && (
                <>
                  <a href={DOWNLOAD} target="_blank" rel="noreferrer">
                    claude.com/download
                  </a>{" "}
                </>
              )}
              {step.text}
            </span>
          </li>
        ))}
      </ol>

      <div className={styles.foot}>
        <details className={styles.help}>
          <summary>막혔을 때</summary>
          <ul>
            <li>
              <strong>설치 파일이 안 열려요.</strong> 컴퓨터가 Windows 10 이상 또는 macOS 13
              이상인지 확인해요.
            </li>
            <li>
              <strong>로그인이 안 돼요.</strong> 공식 문제 해결 안내를 따라가 보세요:{" "}
              <a
                href="https://code.claude.com/docs/en/troubleshoot-install"
                target="_blank"
                rel="noreferrer"
              >
                설치·로그인 문제 해결
              </a>
            </li>
            <li>
              <strong>요금제는 어디서 보나요?</strong>{" "}
              <a href="https://claude.com/pricing" target="_blank" rel="noreferrer">
                claude.com/pricing
              </a>
              에서 볼 수 있어요. Claude Code는 유료 요금제에서 열립니다.
            </li>
          </ul>
        </details>
        <WorkbookSetupStamps only={[0, 1]} compact />
      </div>
    </div>
  );
}

/**
 * A small sketch of the screen for each step, with the one place to press ringed in the accent
 * colour. Capybara pose cuts were tried here and dropped: cute, but they only repeated the step
 * names and did not show where to press (planner's feedback, 2026-11-17).
 * Step 1 follows the real download page (claude.com/download, seen 2026-11-17: a "데스크톱" card
 * with macOS and Windows rows, each with a 다운로드 button). Steps 2–4 are generic sketches that
 * hold on any version (a file in the downloads folder, finding the app by name, a sign-in box);
 * they are to be redrawn from real screenshots when the planner sends them.
 */
function StepArt({ index, os }: { index: number; os: SetupOs }) {
  const mac = os === "mac";
  return (
    <svg viewBox="0 0 160 100" className={styles.picto} role="presentation">
      <rect x="2" y="2" width="156" height="96" rx="6" className={styles.win} />
      <path d="M2 16h156" className={styles.thin} />
      <circle cx="11" cy="9" r="2.5" className={styles.dot} />
      <circle cx="19" cy="9" r="2.5" className={styles.dot} />
      {index === 0 && (
        <>
          <text x="80" y="32" textAnchor="middle" className={styles.head}>
            Claude 다운로드
          </text>
          <rect x="24" y="40" width="112" height="50" rx="5" className={styles.card} />
          <text x="32" y="56" className={styles.cell}>
            macOS
          </text>
          <rect x="92" y="46" width="38" height="15" rx="4" className={styles.btn} />
          <text x="111" y="57" textAnchor="middle" className={styles.btnText}>
            다운로드
          </text>
          <path d="M30 65h100" className={styles.thin} />
          <text x="32" y="80" className={styles.cell}>
            Windows
          </text>
          <rect x="92" y="70" width="38" height="15" rx="4" className={styles.btn} />
          <text x="111" y="81" textAnchor="middle" className={styles.btnText}>
            다운로드
          </text>
          <rect x="88" y={mac ? 42 : 66} width="46" height="23" rx="7" className={styles.ring} />
        </>
      )}
      {index === 1 && (
        <>
          <text x="12" y="30" className={styles.cell}>
            다운로드 폴더
          </text>
          <path d="M66 40h20l8 8v30H66z" className={styles.card} />
          <path d="M86 40v8h8" className={styles.thin} />
          <path d="M80 54v12M75 61l5 5 5-5" className={styles.thin} />
          <text x="80" y="94" textAnchor="middle" className={styles.cell}>
            Claude 설치 파일
          </text>
          <rect x="58" y="34" width="44" height="48" rx="7" className={styles.ring} />
          <path d="M108 44l8-4M110 52h9M108 60l8 4" className={styles.tap} />
        </>
      )}
      {index === 2 &&
        (mac ? (
          <>
            <text x="12" y="30" className={styles.cell}>
              응용 프로그램
            </text>
            {[20, 62, 104].map((x) => (
              <rect key={x} x={x} y="40" width="30" height="30" rx="7" className={styles.card} />
            ))}
            <text x="77" y="84" textAnchor="middle" className={styles.cell}>
              Claude
            </text>
            <rect x="56" y="34" width="42" height="56" rx="7" className={styles.ring} />
          </>
        ) : (
          <>
            <rect x="12" y="24" width="136" height="16" rx="8" className={styles.card} />
            <text x="22" y="35.5" className={styles.cell}>
              Claude
            </text>
            <text x="12" y="54" className={styles.hint}>
              시작 메뉴에서 찾기
            </text>
            <rect x="12" y="60" width="136" height="24" rx="5" className={styles.card} />
            <rect x="18" y="64" width="16" height="16" rx="4" className={styles.btn} />
            <text x="42" y="76" className={styles.cell}>
              Claude
            </text>
            <rect x="8" y="56" width="144" height="32" rx="7" className={styles.ring} />
          </>
        ))}
      {index === 3 && (
        <>
          <text x="80" y="34" textAnchor="middle" className={styles.head}>
            로그인
          </text>
          <rect x="30" y="42" width="100" height="16" rx="4" className={styles.card} />
          <text x="36" y="53.5" className={styles.hint}>
            이메일 주소
          </text>
          <rect x="30" y="64" width="100" height="16" rx="4" className={styles.btn} />
          <text x="80" y="75.5" textAnchor="middle" className={styles.btnText}>
            계속
          </text>
          <rect x="26" y="38" width="108" height="24" rx="7" className={styles.ring} />
        </>
      )}
    </svg>
  );
}

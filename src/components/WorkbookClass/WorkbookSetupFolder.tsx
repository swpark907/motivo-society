"use client";

// Client component: shows the folder steps for the computer the learner picked on the install
// screen (kept in the visit's lesson state) and lets them switch here too.
import Image from "next/image";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import type { SetupOs } from "./WorkbookSetupInstall";
import { WorkbookSetupStamps } from "./WorkbookSetupStamps";
import styles from "./WorkbookSetupFolder.module.scss";

/** The class keeps one folder, my-first-web, from here to the last unit. */
const FOLDER = "my-first-web";

const MAKE: Record<SetupOs, string[]> = {
  windows: [
    "바탕 화면의 빈 곳을 오른쪽 클릭해요.",
    "새로 만들기 → 폴더를 골라요.",
    `이름을 ${FOLDER} 로 적어요.`,
  ],
  mac: [
    "바탕화면의 빈 곳을 오른쪽 클릭해요(또는 control을 누른 채 클릭).",
    "새로운 폴더를 골라요.",
    `이름을 ${FOLDER} 로 적어요.`,
  ],
};

/**
 * 1-4 screen 4 (the lesson's big scene): where the work lives. The same capybara at the same
 * desk appears twice: once with the folder right on its own computer, once reaching over the
 * internet to a folder that sits on far-away computers it borrows (the cloud). An earlier version
 * drew a house and an office building, which only changed the building and did not show
 * "borrowing someone else's computer from home" (planner's feedback, 2026-11-17). Then the steps
 * to make the class folder. The agent works inside the folder it is given (Claude Code docs,
 * checked 2026-11-17).
 */
export function WorkbookSetupFolder() {
  const [os, setOs] = useWorkbookLessonState<SetupOs>("setup-os", "windows");
  return (
    <div data-lesson-wide className={styles.folder}>
      <h2 id="lesson-screen-title" className={styles.title}>
        작업할 폴더를 정해요
      </h2>
      <div className={styles.lead}>
        <p>
          코드 에이전트는 <strong>폴더 하나</strong>를 작업 공간으로 삼습니다. 그 폴더 안의 파일을
          읽고 고치죠. 그래서 만들 것마다 폴더를 하나씩 정해요.
        </p>
      </div>

      {/* 같은 집, 같은 책상에서 폴더가 어디에 있는지만 다르다. 그림은 장식이고 같은 내용이 아래 글에 있다. */}
      <div className={styles.places} aria-hidden="true">
        <div className={styles.place} data-ours>
          <div className={styles.row}>
            <Image
              className={styles.capy}
              src="/images/workbook/lesson-1-4/capy-desk.png"
              alt=""
              width={420}
              height={480}
            />
            <span className={styles.here}>
              <FolderChip />
            </span>
          </div>
          <span className={styles.caption}>
            <strong>내 컴퓨터</strong>
            <span>폴더가 내 컴퓨터 안에 있어요</span>
            <span className={styles.pick}>이 클래스는 여기서 해요</span>
          </span>
        </div>
        <div className={styles.place}>
          <div className={styles.row}>
            <Image
              className={styles.capy}
              src="/images/workbook/lesson-1-4/capy-desk.png"
              alt=""
              width={420}
              height={480}
            />
            <svg className={styles.wire} viewBox="0 0 120 70" role="presentation">
              <text x="60" y="20" textAnchor="middle" className={styles.wireLabel}>
                인터넷
              </text>
              <path d="M4 38h112" className={styles.dash} />
              <path d="M108 32l8 6-8 6" className={styles.stroke} />
              <circle cx="8" cy="38" r="5" className={styles.runner} />
            </svg>
            <svg className={styles.remote} viewBox="0 0 110 100" role="presentation">
              {/* 멀리 있는 컴퓨터들 */}
              <rect x="6" y="8" width="60" height="24" rx="3" className={styles.wall} />
              <rect x="6" y="38" width="60" height="24" rx="3" className={styles.wall} />
              <rect x="6" y="68" width="60" height="24" rx="3" className={styles.wall} />
              <path d="M14 20h18M14 50h18M14 80h18" className={styles.stroke} />
              <circle cx="54" cy="20" r="2.5" className={styles.light} />
              <circle cx="54" cy="50" r="2.5" className={styles.light} />
              <circle cx="54" cy="80" r="2.5" className={styles.light} />
              <path d="M58 44h46v30H58zM58 44l6-7h16l5 7" className={styles.paper} />
            </svg>
          </div>
          <span className={styles.caption}>
            <strong>빌려 쓰는 컴퓨터 (클라우드)</strong>
            <span>폴더가 멀리 있는 컴퓨터에 있어요</span>
          </span>
        </div>
      </div>
      <p className={styles.explain}>
        작업 공간은 <strong>내 컴퓨터</strong>에 둘 수도 있고, 멀리 있는 다른 컴퓨터를 인터넷으로
        빌려 쓸 수도 있어요. 빌려 쓰는 쪽을 <strong>클라우드</strong>라고 합니다. 이 클래스는 내
        컴퓨터의 폴더에서 해요.
      </p>

      <div className={styles.foot}>
        <section className={styles.make} aria-labelledby="setup-folder-make">
          <div className={styles.makeHead}>
            <h3 id="setup-folder-make">폴더를 만들어 볼까요?</h3>
            <div className={styles.os} role="group" aria-label="내 컴퓨터 고르기">
              <button
                type="button"
                aria-pressed={os === "windows"}
                onClick={() => setOs("windows")}
              >
                Windows
              </button>
              <button type="button" aria-pressed={os === "mac"} onClick={() => setOs("mac")}>
                Mac
              </button>
            </div>
          </div>
          <ol>
            {MAKE[os].map((step) => (
              <li key={step}>{step}</li>
            ))}
            <li>Claude 앱의 Code 탭에서 이 폴더를 작업 폴더로 골라요.</li>
          </ol>
        </section>
        <WorkbookSetupStamps only={[3]} compact />
      </div>
    </div>
  );
}

/** The class folder as a small paper folder with its name. */
function FolderChip() {
  return (
    <svg viewBox="0 0 96 46" role="presentation" className={styles.chip}>
      <path d="M2 10h92v34H2zM2 10l8-8h24l6 8" className={styles.paper} />
      <text x="48" y="32" textAnchor="middle" className={styles.name}>
        {FOLDER}
      </text>
    </svg>
  );
}

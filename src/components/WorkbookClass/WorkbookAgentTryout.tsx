"use client";

// Client component: the learner steps through a practice agent window (pick a folder → the agent
// asks before making a file → allow or decline). The step is kept in the visit's lesson state so
// going to another screen and back keeps where they were.
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookAgentTryout.module.scss";

/** 0 folder not picked · 1 asking to make the file · 2 declined · 3 allowed and made. */
type Stage = 0 | 1 | 2 | 3;

const FOLDERS = ["사진", "my-first-web", "문서"] as const;

/**
 * What changes for the learner with a code agent, from their side. Checked against the Claude Code
 * docs on 2026-11-13 (code.claude.com/docs/en/permission-modes, /security, /desktop): it works in
 * the folder it was started in (the desktop app has you choose one), and by default it asks before
 * editing files or running commands, and before touching files outside that folder.
 */
const POINTS = [
  {
    title: "작업할 폴더를 먼저 정해요",
    text: "에이전트는 고른 폴더 안의 파일을 읽고 고쳐요.",
    chat: "챗봇이었다면 폴더 없이 대화창만 있어요.",
  },
  {
    title: "바꾸기 전에 물어봐요",
    text: "기본 설정에서는 파일을 만들거나 고치기 전, 명령을 실행하기 전에 허락을 구해요. 폴더 밖의 파일도 따로 물어봐요.",
    chat: "챗봇이었다면 코드를 글로 줄 뿐, 내 파일에는 손대지 않아요.",
  },
  {
    title: "결과가 파일로 남아요",
    text: "바뀐 곳을 보고, 브라우저에서 화면을 확인하는 건 내 몫이에요.",
    chat: "챗봇이었다면 받은 코드를 직접 파일에 붙여 넣어야 해요.",
  },
] as const;

/**
 * 1-2 screen 3: try a code agent in a small practice window.
 * Not a chat (1-1 screen 3 already plays a chat): a file explorer on the left, where the learner
 * picks the folder and sees the new file appear, and on the right the agent's question as a paper
 * slip that gets stamped when they allow or decline.
 * The window is our own paper window, not Claude Code's screen, and nothing on the learner's
 * computer changes. The three points stay readable from the start; the window only marks which
 * one the learner has reached.
 */
export function WorkbookAgentTryout() {
  const [stage, setStage] = useWorkbookLessonState<Stage>("ai-1-tryout", 0);
  const reached = stage === 0 ? 0 : stage === 3 ? 3 : 2;

  return (
    <div data-lesson-wide className={styles.tryout}>
      <h2 id="lesson-screen-title" className={styles.title}>
        코드 에이전트, 이렇게 써요
      </h2>
      <p className={styles.lead}>
        코드 에이전트와 일할 때 우리가 하는 일은 세 가지예요. 아래 연습 창에서 한 번 해볼까요?
      </p>

      <div className={styles.layout}>
        <section className={styles.window} aria-label="연습용 코드 에이전트 창">
          <header className={styles.bar}>
            <span className={styles.dots} aria-hidden="true" />
            <span>
              작업 폴더 <strong>{stage === 0 ? "고르기 전" : "my-first-web"}</strong>
            </span>
          </header>

          <div className={styles.panes}>
            {/* 왼쪽: 파일 탐색기. 폴더 고르기도 여기서 한다. */}
            <div className={styles.explorer}>
              <span className={styles.paneLabel}>파일</span>
              {stage === 0 ? (
                <ul>
                  {FOLDERS.map((folder) => (
                    <li key={folder}>
                      <button
                        type="button"
                        className={folder === "my-first-web" ? styles.folderMain : styles.folder}
                        disabled={folder !== "my-first-web"}
                        onClick={() => setStage(1)}
                      >
                        <FolderIcon />
                        {folder}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul aria-live="polite">
                  <li className={styles.openFolder}>
                    <FolderIcon />
                    my-first-web
                  </li>
                  {stage === 3 ? (
                    <li className={styles.newFile}>
                      index.html <em>새 파일</em>
                    </li>
                  ) : (
                    <li className={styles.empty}>(아직 비어 있어요)</li>
                  )}
                </ul>
              )}
            </div>

            {/* 오른쪽: 부탁과 허락 쪽지 */}
            <div className={styles.work} aria-live="polite">
              {stage === 0 ? (
                <p className={styles.hint}>
                  왼쪽에서 일할 폴더를 골라 주세요. 소개 페이지를 만들 폴더는 my-first-web예요.
                </p>
              ) : (
                <>
                  <p className={styles.request}>
                    <span>부탁</span> 내 소개 페이지 만들어줘
                  </p>
                  <div className={styles.slip} data-answer={stage === 1 ? undefined : stage}>
                    <p>
                      <strong>index.html</strong> 파일을 만들어도 될까요?
                    </p>
                    {stage === 1 && (
                      <div className={styles.askButtons}>
                        <button type="button" className={styles.allow} onClick={() => setStage(3)}>
                          허락
                        </button>
                        <button
                          type="button"
                          className={styles.decline}
                          onClick={() => setStage(2)}
                        >
                          거절
                        </button>
                      </div>
                    )}
                    {stage !== 1 && (
                      <span className={styles.stamp} aria-hidden="true">
                        {stage === 3 ? "허락" : "거절"}
                      </span>
                    )}
                  </div>
                  {stage === 2 && (
                    <>
                      <p className={styles.status}>알겠어요. 파일을 만들지 않았어요.</p>
                      <button type="button" className={styles.again} onClick={() => setStage(1)}>
                        다시 물어보기
                      </button>
                    </>
                  )}
                  {stage === 3 && (
                    <>
                      <code className={styles.diff}>
                        <span>+ &lt;h1&gt;안녕하세요, 카피바라예요&lt;/h1&gt;</span>
                        <span>+ &lt;p&gt;천천히 읽고 만드는 걸 좋아해요.&lt;/p&gt;</span>
                      </code>
                      <p className={styles.status}>만들었어요. 브라우저에서 열어 확인해 보세요.</p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {stage !== 0 && (
            <button type="button" className={styles.restart} onClick={() => setStage(0)}>
              처음부터 다시
            </button>
          )}
        </section>

        <ol className={styles.points}>
          {POINTS.map((point, index) => (
            <li key={point.title} data-reached={index < reached || undefined}>
              <span className={styles.number}>{index + 1}</span>
              <div>
                <strong>{point.title}</strong>
                <p>{point.text}</p>
                <p className={styles.chat}>{point.chat}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className={styles.next}>폴더 정하기와 설치는 1-4에서 함께 해요.</p>
    </div>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 20 16" aria-hidden="true" className={styles.folderIcon}>
      <path d="M1 2h6l2 2h10v11H1z" fill="currentColor" />
    </svg>
  );
}

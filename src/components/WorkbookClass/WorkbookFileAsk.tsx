"use client";

// Client component: the learner copies a memo that asks for the first file, sends it in the Claude
// app, and stamps that the file was made. The pasted intro text is kept in the visit's lesson
// state and the memo in the practice record; "copied" is only a momentary notice.
import { useState } from "react";
import { Nanum_Pen_Script } from "next/font/google";
import { WorkbookDoneStamp } from "./WorkbookDoneStamp";
import { useFirstFilePractice } from "./useFirstFilePractice";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { WorkbookCopyFallback } from "./WorkbookCopyFallback";
import { useWorkbookProgress } from "./WorkbookProgressContext";

/** 1-6에서 붙여 넣은 소개 글을 담는 프로젝트 기록의 이름. 2-1이 같은 이름으로 읽는다. */
export const FIRST_INTRO_NOTE = "first-intro";
/** 1-6 메모가 첫 파일 맨 위에 넣어 달라고 한 제목. */
export const FIRST_PAGE_TITLE = "내 소개";
import styles from "./WorkbookFileAsk.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/** The memo lines under the same four tags as the previous lesson. `text` is the pasted intro. */
function memoLines(text: string) {
  const intro = text.trim();
  return [
    { label: "무엇을", line: "index.html 파일을 하나 만들어줘. 내 소개 페이지야." },
    { label: "어디에 쓸지", line: "내 컴퓨터의 브라우저로 열어서 볼 거야." },
    {
      label: "조건",
      line: intro
        ? `맨 위에 제목 “${FIRST_PAGE_TITLE}”를 넣고, 그 아래에 이 글을 그대로 넣어줘: ${intro}`
        : `맨 위에 제목 “${FIRST_PAGE_TITLE}”를 넣고, 그 아래에는 소개 글이 들어갈 자리만 비워 둬.`,
    },
    { label: "하지 말 것", line: "다른 파일은 만들지 마. 꾸미지 말고 단순하게 해줘." },
  ];
}

/**
 * 1-6 screen 2: ask for the file and answer the permission question. That Claude asks before
 * editing files in the default mode is from the official desktop docs (checked 2026-11-17); what
 * the prompt looks like was not confirmed, so the note names what to look at, not which button.
 */
export function WorkbookFileAsk() {
  const { record, save } = useFirstFilePractice();
  const { dispatchProjectWorkflow } = useWorkbookProgress();
  const [intro, setIntro] = useWorkbookLessonState("ai-6-ask-intro", "");
  const [copied, setCopied] = useState<"done" | "failed" | null>(null);
  const lines = memoLines(intro);
  const memo = lines.map((item) => item.line).join("\n");

  async function copy() {
    save({ request: memo });
    try {
      await navigator.clipboard.writeText(memo);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
  }

  return (
    <div data-lesson-wide className={styles.ask}>
      <h2 id="lesson-screen-title" className={styles.title}>
        파일을 만들어 달라고 부탁해요
      </h2>
      <div className={styles.lead}>
        <p>
          부탁하는 방법은 지난 수업과 같습니다. 네 가지 이름표를 채운 메모를 Claude Code에 보내면
          돼요. 달라지는 건 하나예요. 기본 설정에서는 파일을 만들기 전에 AI가{" "}
          <strong>승인 여부</strong>를 묻습니다.
        </p>
      </div>

      <div className={styles.desk}>
        <section className={styles.memo} aria-label="파일을 부탁하는 메모">
          <header className={`${styles.to} ${hand.className}`}>AI에게</header>
          <ol className={styles.rows}>
            {lines.map((item) => (
              <li key={item.label} className={styles.row}>
                <strong className={styles.tag}>{item.label}</strong>
                <p className={styles.line}>{item.line}</p>
              </li>
            ))}
          </ol>
          <label className={styles.paste}>
            <span>
              지난 수업에서 받은 소개 글이 있으면 붙여 넣어요.{" "}
              <small>없으면 글 자리만 비워 두게 해요</small>
            </span>
            <input
              type="text"
              value={intro}
              placeholder="안녕하세요, …"
              autoComplete="off"
              onChange={(event) => {
                setCopied(null);
                setIntro(event.target.value);
                // 2-1이 첫 화면을 다시 꺼낼 때 읽는다. 화면 상태가 아니라 프로젝트 기록에 둔다.
                dispatchProjectWorkflow({
                  type: "note",
                  key: FIRST_INTRO_NOTE,
                  text: event.target.value.trim(),
                  stage: "setup",
                });
              }}
            />
          </label>
          <div className={styles.tear}>
            <button type="button" className={styles.copy} onClick={copy}>
              메모 떼어 가기 (복사)
            </button>
            <p className={styles.copied} role="status">
              {copied === "done" && "복사했어요. Claude 앱의 입력 칸에 붙여 넣고 Enter를 눌러요."}
            </p>
            {copied === "failed" && <WorkbookCopyFallback text={memo} />}
          </div>
        </section>

        <div className={styles.side}>
          <section className={styles.slip} aria-label="승인을 물으면 볼 것">
            <h3 className={hand.className}>승인을 물으면 두 가지를 봐요</h3>
            <ol>
              <li>
                만들려는 파일 이름이 <code>index.html</code>인가요?
              </li>
              <li>
                만드는 곳이 <code>my-first-web</code> 폴더인가요?
              </li>
            </ol>
            <p>둘 다 맞으면 승인해요. 다르면 거절하고, 무엇이 다른지 말해 주면 됩니다.</p>
            <small>승인을 묻는 창의 모양과 버튼 이름은 앱 버전에 따라 다를 수 있어요.</small>
          </section>
          <div className={styles.back}>
            <WorkbookDoneStamp index={0} ask="파일이 만들어졌으면 눌러서 도장을 찍어요" />
            {!record.checks[0] && (
              <button
                type="button"
                className={styles.later}
                aria-pressed={record.mode === "example"}
                onClick={() => save({ mode: "example" })}
              >
                지금은 만들지 않고 읽으면서 따라갈게요
              </button>
            )}
            <p className={styles.next} aria-live="polite">
              {record.mode === "example" &&
                !record.checks[0] &&
                "괜찮아요. 다음 화면부터 그림과 연습 창으로 따라가요."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

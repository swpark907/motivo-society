"use client";

// Client component: the learner writes one line about themselves on the memo, copies it, sends it
// in the Claude app, and stamps that they did. The memo text and how they practiced are kept in
// the practice record (read by the map and the unit summary); "copied" is only a momentary notice.
import { useState } from "react";
import { Nanum_Pen_Script } from "next/font/google";
import { workbookLessonId } from "@/lib/workbook-course";
import { MEMO_PARTS } from "./WorkbookMemoParts";
import { emptyPractice, type PracticeRecord } from "./WorkbookPracticeLesson";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { WorkbookCopyFallback } from "./WorkbookCopyFallback";
import styles from "./WorkbookMemoSend.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

const ASK = "나를 소개하는 글을 써줘.";

/** The memo as the AI will read it. An empty "about me" line is simply left out. */
function memoText(about: string) {
  const [, where, rules, avoid] = MEMO_PARTS;
  return [`${ASK} ${about.trim()}`.trim(), where.ai, rules.ai, avoid.ai].join("\n");
}

/**
 * 1-5 screen 3: send the memo for real. How to send (paste into the prompt box, press Enter) is
 * from the official desktop docs, checked 2026-11-17. The sketch is our own drawing of the prompt
 * box area, not a screenshot. Nothing checks the learner's computer; the stamp is their own word.
 */
export function WorkbookMemoSend() {
  const { practice, setPractice, setupStatus } = useWorkbookProgress();
  const [about, setAbout] = useWorkbookLessonState("ai-5-memo-about", "");
  const [copied, setCopied] = useState<"done" | "failed" | null>(null);
  const record = practice[workbookLessonId.firstRequest] ?? emptyPractice();
  const sent = record.mode === "computer";
  const ready = setupStatus === "ready";

  function save(patch: Partial<PracticeRecord>) {
    setPractice((previous) => ({
      ...previous,
      [workbookLessonId.firstRequest]: {
        ...(previous[workbookLessonId.firstRequest] ?? emptyPractice()),
        ...patch,
      },
    }));
  }
  function write(value: string) {
    // 글을 고치면 지난 복사 안내는 지운다(남은 글 상자가 입력 중에 포커스를 가져가지 않게).
    setCopied(null);
    setAbout(value);
    save({ request: memoText(value) });
  }
  async function copy() {
    save({ request: memoText(about) });
    try {
      await navigator.clipboard.writeText(memoText(about));
      setCopied("done");
    } catch {
      setCopied("failed");
    }
  }

  return (
    <div data-lesson-wide className={styles.send}>
      <h2 id="lesson-screen-title" className={styles.title}>
        직접 보내 볼까요
      </h2>
      <div className={styles.lead}>
        <p>
          이제 내 메모를 Claude Code에 보낼 차례입니다. 빈칸 한 줄만 내 이야기로 채우고, 메모를
          복사해 붙여 넣으면 돼요.
        </p>
      </div>

      <div className={styles.desk}>
        <section className={styles.memo} aria-label="내 작업 메모">
          <header className={`${styles.to} ${hand.className}`}>AI에게</header>
          <ol className={styles.rows}>
            {MEMO_PARTS.map((part, index) => (
              <li key={part.label} className={styles.row}>
                <strong className={styles.tag}>{part.label}</strong>
                {index === 0 ? (
                  <div className={styles.mine}>
                    <span>{ASK}</span>
                    <input
                      type="text"
                      aria-label="나를 한 줄로 소개하기"
                      value={about}
                      placeholder="나는 커피와 산책을 좋아하는 직장인이야."
                      autoComplete="off"
                      onChange={(event) => write(event.target.value)}
                    />
                    <small>
                      {about.trim()
                        ? "내가 쓴 만큼만 AI가 알아요."
                        : "여기에 나를 한 줄로 적어요. 비워 두면 AI가 짐작해요."}
                    </small>
                  </div>
                ) : (
                  <p className={styles.line}>
                    {part.ai}
                    {index === 3 && (
                      <small>
                        Claude Code는 파일도 만들 수 있어요. 파일은 다음 수업에서 만들어요.
                      </small>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ol>
          <div className={styles.tear}>
            <button type="button" className={styles.copy} onClick={copy}>
              메모 떼어 가기 (복사)
            </button>
            <p className={styles.copied} role="status">
              {copied === "done" && "복사했어요. 이제 Claude 앱으로 가요."}
            </p>
            {copied === "failed" && <WorkbookCopyFallback text={memoText(about)} />}
          </div>
        </section>

        <div className={styles.side}>
          <ol className={styles.steps}>
            <li>
              Claude 앱의 <strong>Code 탭</strong>을 열어요. 작업 폴더는 다음 수업에서 쓸{" "}
              <code>my-first-web</code>
              으로 둬요.
            </li>
            <li>
              아래쪽 <strong>입력 칸</strong>을 누르고 붙여 넣어요. (Windows는 Ctrl+V, Mac은 ⌘V)
            </li>
            <li>
              <strong>Enter</strong>를 눌러 보내고, 답이 다 나올 때까지 기다려요.
            </li>
          </ol>
          <svg className={styles.sketch} viewBox="0 0 320 84" role="img" aria-label="입력 칸 위치">
            <rect x="1" y="1" width="318" height="82" rx="6" className={styles.frame} />
            <rect x="16" y="12" width="150" height="5" rx="2.5" className={styles.block} />
            <rect x="16" y="23" width="110" height="5" rx="2.5" className={styles.block} />
            <rect x="14" y="38" width="292" height="24" rx="5" className={styles.box} />
            <text x="24" y="54" className={styles.label}>
              여기에 붙여 넣고 Enter
            </text>
            <rect x="16" y="69" width="34" height="7" rx="3.5" className={styles.block} />
            <rect x="56" y="69" width="48" height="7" rx="3.5" className={styles.block} />
            <rect x="110" y="69" width="34" height="7" rx="3.5" className={styles.block} />
          </svg>
          <p className={styles.note}>
            위 그림은 입력 칸 자리만 그린 약도예요. 앱이 업데이트되면 모양이 조금 다를 수 있어요.
          </p>

          <div className={styles.back}>
            <button
              type="button"
              className={styles.stamp}
              aria-pressed={sent}
              onClick={() => save({ mode: sent ? null : "computer" })}
            >
              <span className={styles.mark} aria-hidden="true">
                {sent ? "보냄" : ""}
              </span>
              <span>{sent ? "보냈어요" : "보냈으면 눌러서 도장을 찍어요"}</span>
            </button>
            {!sent && (
              <button
                type="button"
                className={styles.later}
                aria-pressed={record.mode === "example"}
                onClick={() => save({ mode: "example" })}
              >
                {ready ? "지금은 보내지 않고" : "아직 도구 준비 전이라"} 예시 답으로 따라갈게요
              </button>
            )}
            <p className={styles.next} aria-live="polite">
              {sent &&
                "Claude 앱의 답은 닫지 말고 띄워 둔 채 다음 화면으로 가요. 받은 답을 함께 확인합니다."}
              {record.mode === "example" && "괜찮아요. 다음 화면에서 예시 답을 함께 봐요."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

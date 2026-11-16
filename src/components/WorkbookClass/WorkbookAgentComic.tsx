"use client";

// Client component: the four panels stick on in order once, and "다시 보기" replays them by
// remounting the strip. Reduced-motion users get the finished strip at once (CSS).
import Image from "next/image";
import { Nanum_Pen_Script } from "next/font/google";
import { useState, type CSSProperties } from "react";
import styles from "./WorkbookAgentComic.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

const REQUEST = "내 소개 페이지 만들어줘";

/**
 * 1-2 screen 2: what a code agent is, as a four-panel comic strip on paper.
 * 1-1 already used the dark collage board with the capybara's question mark → light bulb twice,
 * so this lesson tells the same kind of contrast as a comic instead: ask → the chatbot hands back
 * code as text → the capybara is stuck with it → the code agent makes the file in the folder.
 * The windows are our own drawings, not any real service's screen.
 * Each panel has a very faint line drawing of the capybara's room behind it so the panels do not
 * look empty; it stays far lighter than the story.
 * The panels are decoration (aria-hidden); the same story is in the text below the strip.
 */
export function WorkbookAgentComic() {
  const [run, setRun] = useState(0);

  return (
    <div data-lesson-wide className={styles.comic}>
      <h2 id="lesson-screen-title" className={styles.title}>
        그럼 코드 에이전트는 뭘까요
      </h2>

      <ol key={run} className={`${styles.strip} ${hand.className}`} aria-hidden="true">
        <li style={{ "--i": 0 } as CSSProperties}>
          <Backdrop variant="window" />
          <span className={styles.caption}>부탁해요</span>
          <span className={styles.bubble}>{REQUEST}</span>
          <Image
            className={styles.capy}
            src="/images/workbook/lesson-1-2/capy-ask.png"
            alt=""
            width={306}
            height={480}
          />
        </li>

        <li style={{ "--i": 1 } as CSSProperties}>
          <Backdrop variant="shelf" />
          <span className={styles.caption}>챗봇은</span>
          <div className={styles.window}>
            <span className={styles.tag}>챗봇</span>
            <code>
              &lt;!doctype html&gt;
              <br />
              &lt;html lang=&quot;ko&quot;&gt;
              <br />
              &nbsp;&nbsp;&lt;h1&gt;안녕하세요&lt;/h1&gt;
              <br />
              &nbsp;&nbsp;&lt;p&gt;천천히…&lt;/p&gt;
              <br />
              &nbsp;&nbsp;…
            </code>
            <span className={styles.note}>코드를 글로 돌려줘요</span>
          </div>
        </li>

        <li style={{ "--i": 2 } as CSSProperties}>
          <Backdrop variant="desk" />
          <span className={styles.caption}>그런데…</span>
          <span className={styles.files}>
            <span>
              <NotepadIcon />
              메모장
            </span>
            <span>
              <FolderIcon />새 폴더
            </span>
            <span>
              <DocumentIcon />
              문서 1
            </span>
          </span>
          <span className={`${styles.bubble} ${styles.bubbleWide}`}>
            이 코드, 어느 파일에
            <br />
            넣어야 하지?
          </span>
          <Image
            className={styles.capy}
            src="/images/workbook/lesson-1-2/capy-puzzled.png"
            alt=""
            width={267}
            height={480}
          />
        </li>

        <li style={{ "--i": 3 } as CSSProperties}>
          <Backdrop variant="plant" />
          <span className={styles.caption}>코드 에이전트는</span>
          <div className={styles.window}>
            <span className={styles.tag}>코드 에이전트</span>
            <span className={styles.folder}>
              my-site / <strong>index.html</strong> 만들었어요
            </span>
            <span className={styles.page}>
              <strong>안녕하세요, 카피바라예요</strong>
              <span />
              <span />
            </span>
          </div>
          <Image
            className={`${styles.capy} ${styles.capySmall}`}
            src="/images/workbook/lesson-1-2/capy-thumb.png"
            alt=""
            width={295}
            height={480}
          />
        </li>
      </ol>

      <div className={styles.text}>
        <p>
          <strong>챗봇</strong>은 대화창에서 답을 글로 돌려줍니다. 코드를 받아도 파일로 옮기고 열어
          보는 건 직접 해야 하죠.
        </p>
        <p>
          <strong>코드 에이전트</strong>는 내 컴퓨터의 폴더를 직접 열고, 파일을 만들고 고칩니다.
          답만 주는 게 아니라, 작업까지 대신 해 주는 거죠.
        </p>
        <button type="button" className={styles.replay} onClick={() => setRun((n) => n + 1)}>
          다시 보기
        </button>
      </div>
    </div>
  );
}

/** A faint corner of the capybara's study, one view per panel. Ink lines only, set very light in CSS. */
function Backdrop({ variant }: { variant: "window" | "shelf" | "desk" | "plant" }) {
  return (
    <svg className={styles.backdrop} viewBox="0 0 200 220" preserveAspectRatio="xMidYMid slice">
      {/* 바닥 선과 걸레받이 */}
      <path d="M0 176h200M0 182h200" />
      {variant === "window" && (
        <>
          <rect x="112" y="34" width="70" height="84" />
          <path d="M147 34v84M112 76h70" />
          <path d="M104 28h86M108 28c6 30 2 62-6 94M186 28c-6 30-2 62 6 94" />
          <path d="M14 176v-34h44v34M20 142v-10h32v10" />
        </>
      )}
      {variant === "shelf" && (
        <>
          <path d="M10 60h84M10 104h84" />
          <path d="M18 60V34h10v26M30 60V28h12v32M44 60V38h8v22M56 60l8-24 9 3-7 21" />
          <path d="M16 104V82h14v22M34 104V76h9v28M70 104V84h16v20" />
          <rect x="140" y="40" width="44" height="56" />
          <path d="M148 84l12-18 9 10 7-8 8 16z" />
        </>
      )}
      {variant === "desk" && (
        <>
          <path d="M96 150h104M108 150v26M190 150v26" />
          <rect x="124" y="104" width="58" height="38" />
          <path d="M146 142v8M134 150h38" />
          <path d="M12 40h60v48H12zM12 52h60" />
          <path d="M20 66h30M20 76h42" />
        </>
      )}
      {variant === "plant" && (
        <>
          <rect x="16" y="30" width="62" height="76" />
          <path d="M47 30v76M16 68h62" />
          <path d="M24 176v-22h28v22M38 154c-2-22-14-30-22-34M38 154c2-26 12-38 22-42M38 154c0-20-4-40-2-52" />
        </>
      )}
    </svg>
  );
}

function NotepadIcon() {
  return (
    <svg viewBox="0 0 32 32" className={styles.icon}>
      <rect x="6" y="5" width="20" height="24" rx="2" fill="#fffdf8" />
      <path d="M10 5V2M16 5V2M22 5V2M10 13h12M10 18h12M10 23h8" fill="none" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 32 32" className={styles.icon}>
      <path d="M3 8h10l3 4h13v15H3z" fill="#e8c9a0" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 32 32" className={styles.icon}>
      <path d="M7 3h13l6 6v20H7z" fill="#fffdf8" />
      <path d="M20 3v6h6M11 15h10M11 20h10M11 25h6" fill="none" />
    </svg>
  );
}

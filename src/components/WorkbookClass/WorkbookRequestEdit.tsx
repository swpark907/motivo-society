"use client";

// Client component: 2-2 screen 2. One line of the memo's "하지 말 것" — "새 폴더나 새 파일은 만들지 마" —
// can be switched off and on, and the folder picture next to it shows the two possible results: the
// same index.html gets changed, or a second folder appears next to the first. It shows what can
// happen, not what the AI always does. The switch is the visit's lesson state; the memo sent on the
// next screen always keeps the line.
import Image from "next/image";
import { Nanum_Pen_Script } from "next/font/google";
import { NO_NEW_FILE } from "@/lib/workbook-plan-memo";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { FIRST_PAGE_TITLE } from "./WorkbookFileAsk";
import styles from "./WorkbookRequestEdit.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/** 2-2 screen 2: say "change this file", not just "make it". */
export function WorkbookRequestEdit({ record }: { record: ProjectRecord }) {
  const [kept, setKept] = useWorkbookLessonState("request-no-new", false);
  const title = record.title.trim() || "새 제목";
  return (
    <div data-lesson-wide className={styles.edit}>
      <h2 id="lesson-screen-title" className={styles.title}>
        새로 만들지 말고, 고쳐 달라고 해요
      </h2>
      <div className={styles.lead}>
        <p>
          이번에는 처음부터 만드는 게 아니라 1단원에서 만든 <strong>index.html을 고치는</strong>
          일이에요. “만들어줘”라고만 하면 AI가 기존 파일을 두고 새 폴더나 새 파일을 만들 수도
          있어요. 그래서 메모의 ‘하지 말 것’에 한 줄을 넣어 둡니다. 이 줄을 켜고 끄면서 결과를
          비교해 볼까요?
        </p>
      </div>

      <div className={styles.desk}>
        <div className={styles.switchCard}>
          <strong className={styles.tag}>하지 말 것</strong>
          <button
            type="button"
            role="switch"
            aria-checked={kept}
            className={styles.switch}
            onClick={() => setKept(!kept)}
          >
            <span className={styles.knob} aria-hidden="true" />
            <span className={styles.switchText}>{NO_NEW_FILE}</span>
          </button>
          <p className={styles.state}>{kept ? "메모에 이 줄이 있어요" : "메모에 이 줄이 없어요"}</p>
        </div>

        <div className={styles.result} aria-live="polite">
          <ul className={styles.tree} aria-label="작업 폴더 안">
            <li data-state={kept ? "changed" : "same"}>
              <span className={styles.folder}>my-first-web</span>
              <span className={styles.file}>
                index.html · {kept ? title : FIRST_PAGE_TITLE}
                <em>{kept ? "고쳐졌어요" : "그대로예요"}</em>
              </span>
            </li>
            {!kept && (
              <li data-state="new">
                <span className={styles.folder}>my-first-web-2</span>
                <span className={styles.file}>
                  index.html · {title}
                  <em>새로 생겼어요</em>
                </span>
              </li>
            )}
          </ul>
          <div className={styles.capy}>
            <p key={String(kept)} className={`${styles.bubble} ${hand.className}`}>
              {kept ? "내 페이지가 그 자리에서 바뀌었어요!" : "어느 쪽이 내 페이지지?"}
            </p>
            <Image
              key={kept ? "thumb" : "puzzled"}
              src={
                kept
                  ? "/images/workbook/lesson-1-2/capy-thumb.png"
                  : "/images/workbook/lesson-1-2/capy-puzzled.png"
              }
              alt=""
              aria-hidden="true"
              width={kept ? 295 : 267}
              height={480}
            />
          </div>
        </div>
      </div>
      <p className={styles.closing}>
        메모의 ‘무엇을’ 칸에도 “index.html을 <strong>먼저 읽고</strong>, 같은 파일을 고쳐줘”라고
        적혀 있어요. 무엇을 고칠지와 무엇을 새로 만들지 않을지를 같이 말하면 결과가 엇나가지
        않습니다.
      </p>
    </div>
  );
}

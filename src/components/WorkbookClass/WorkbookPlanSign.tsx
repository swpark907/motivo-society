"use client";

// Client component: the page's sign (title, top) and exit (button, bottom) on one screen. A title
// sticker drops into the top slot and the capybara reacts; a button piece snaps into the bottom
// slot and the reader says what they'll do. Both go to the plan (title · purpose). Any sticker may
// stay; the reaction is the lesson, not a grade.
import Image from "next/image";
import { Nanum_Pen_Script } from "next/font/google";
import {
  planButtons,
  stickerReaction,
  type PlanButton,
  type PlanReader,
} from "@/lib/workbook-plan-readers";
import styles from "./WorkbookPlanSign.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/** 2-1 screen 2: a sign at the top, an exit at the bottom. Nothing to type. */
export function WorkbookPlanSign({
  reader,
  title,
  button,
  onTitle,
  onButton,
}: {
  reader: PlanReader;
  title: string;
  button: PlanButton | null;
  onTitle: (text: string) => void;
  onButton: (button: PlanButton) => void;
}) {
  const stuck = reader.stickers.find((sticker) => sticker.text === title) ?? null;
  const happy = stuck?.kind === "clear";
  return (
    <div data-lesson-wide className={styles.sign}>
      <h2 id="lesson-screen-title" className={styles.title}>
        제목과 맨 아래 버튼을 정해요
      </h2>
      <div className={styles.lead}>
        <p>
          페이지 맨 위의 <strong>제목</strong>은 이 페이지가 무엇을 소개하는지 알려 주고, 맨 아래{" "}
          <strong>버튼</strong>은 다 읽은 사람이 다음에 할 일을 알려 줘요. 가게의 간판과 출구를
          떠올리면 쉬워요. 직접 쓰지 않고, 준비된 것 중에서 골라 볼게요.
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.stage}>
          <div className={styles.page} aria-label="내 페이지의 제목과 버튼 자리">
            <div className={styles.slot} data-part="title" data-filled={!!stuck}>
              {stuck ? (
                <strong key={stuck.text} data-kind={stuck.kind}>
                  {stuck.text}
                </strong>
              ) : (
                <span>제목 자리</span>
              )}
            </div>
            <i className={styles.bar} aria-hidden="true" />
            <i className={styles.bar} aria-hidden="true" />
            <div className={styles.slot} data-part="button" data-filled={!!button}>
              {button ? (
                <span key={button.id} className={styles.cta}>
                  {button.label}
                </span>
              ) : (
                <span>버튼 자리</span>
              )}
            </div>
          </div>
          <div className={styles.capy} aria-live="polite">
            {stuck && (
              <p key={stuck.text} className={`${styles.bubble} ${hand.className}`}>
                {stickerReaction[stuck.kind]}
              </p>
            )}
            <Image
              key={happy ? "thumb" : "puzzled"}
              src={
                happy
                  ? "/images/workbook/lesson-1-2/capy-thumb.png"
                  : "/images/workbook/lesson-1-2/capy-puzzled.png"
              }
              alt=""
              aria-hidden="true"
              width={happy ? 295 : 267}
              height={480}
            />
          </div>
        </div>

        <div className={styles.controls}>
          <section aria-label="제목 고르기">
            <h3>제목 고르기</h3>
            <ul className={styles.stickers}>
              {reader.stickers.map((sticker) => (
                <li key={sticker.text}>
                  <button
                    type="button"
                    className={styles.sticker}
                    data-kind={sticker.kind}
                    aria-pressed={sticker.text === title}
                    onClick={() => onTitle(sticker.text)}
                  >
                    {sticker.text}
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section aria-label="맨 아래 버튼 고르기">
            <h3>맨 아래 버튼 고르기</h3>
            <ul className={styles.pieces}>
              {planButtons.map((piece) => (
                <li key={piece.id}>
                  <button
                    type="button"
                    className={styles.piece}
                    aria-pressed={button?.id === piece.id}
                    onClick={() => onButton(piece)}
                  >
                    {piece.label}
                    {piece.id === reader.button && <small>{reader.tag}에게 추천</small>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
          {button && (
            <p key={button.id} className={`${styles.voice} ${hand.className}`} aria-live="polite">
              {reader.tag}: “다 읽고 나서 ‘{button.label}’ 버튼을 누르면 되겠네요.”
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

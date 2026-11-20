"use client";

// Client component: 2-4 screen 1. The page's title (top) and button wording (bottom). A title sticker
// drops into the top slot and the capybara reacts; the bottom button (chosen in 2-1) gets a wording —
// the vague one or the one that says what happens. Both go to the plan (title · buttonLabel). Any
// choice may stay; the reaction is the lesson, not a grade.
import Image from "next/image";
import { Nanum_Pen_Script } from "next/font/google";
import { stickerReaction, type PlanButton, type PlanReader } from "@/lib/workbook-plan-readers";
import { buttonWordings } from "@/lib/workbook-plan-options";
import styles from "./WorkbookPlanSign.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/** 2-1 screen 2: a sign at the top, an exit at the bottom. Nothing to type. */
export function WorkbookPlanSign({
  reader,
  title,
  button,
  label,
  onTitle,
  onLabel,
}: {
  reader: PlanReader;
  title: string;
  /** 2-1에서 고른 맨 아래 버튼. */
  button: PlanButton | null;
  /** 고른 버튼 문구. */
  label: string;
  onTitle: (text: string) => void;
  onLabel: (text: string) => void;
}) {
  const wordings = button ? buttonWordings[button.id] : [];
  const shownLabel = label || button?.label || "";
  const stuck = reader.stickers.find((sticker) => sticker.text === title) ?? null;
  const happy = stuck?.kind === "clear";
  return (
    <div data-lesson-wide className={styles.sign}>
      <h2 id="lesson-screen-title" className={styles.title}>
        제목과 버튼 문구를 정해요
      </h2>
      <div className={styles.lead}>
        <p>
          페이지 맨 위의 <strong>제목</strong>은 이 페이지가 무엇을 소개하는지 알려 주고, 맨 아래{" "}
          <strong>버튼 문구</strong>는 누르면 무엇이 되는지 알려 줘요. 가게의 간판과 출구를 떠올리면
          쉬워요. 같은 뜻이라도 말에 따라 전해지는 게 달라요.
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
                <span key={shownLabel} className={styles.cta}>
                  {shownLabel}
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
          <section aria-label="버튼 문구 고르기">
            <h3>버튼 문구 고르기</h3>
            {button ? (
              <ul className={styles.pieces}>
                {wordings.map((wording, index) => (
                  <li key={wording}>
                    <button
                      type="button"
                      className={styles.piece}
                      aria-pressed={shownLabel === wording && !!label}
                      onClick={() => onLabel(wording)}
                    >
                      {wording}
                      <small>{index === 0 ? "짧은 말" : "무엇이 되는지 알려 주는 말"}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.missing}>지난 수업에서 맨 아래 버튼을 먼저 골라요.</p>
            )}
          </section>
          {button && label && (
            <p key={label} className={`${styles.voice} ${hand.className}`} aria-live="polite">
              {reader.tag}:{" "}
              {label === wordings[0]
                ? `“‘${label}’를 누르면 정확히 뭐가 되는 거지?”`
                : "“누르면 무엇이 되는지 바로 알겠어요.”"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

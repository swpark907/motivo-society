"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./WorkbookFeaturedClass.module.scss";

export function WorkbookReviewExcerpt({
  person,
  quote,
  index,
  rating,
}: {
  person: string;
  quote: string;
  index: number;
  rating: number;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [overflows, setOverflows] = useState(false);
  const text = useRef<HTMLSpanElement>(null);
  const dialogTitleId = useId();

  useEffect(() => {
    const element = text.current;
    if (!element) return;
    const measure = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
      setOverflows(element.scrollHeight > lineHeight * 3 + 1);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();

    return () => observer.disconnect();
  }, [quote]);

  useEffect(() => {
    if (!open || !dialog.current) return;
    const previousOverflow = document.body.style.overflow;
    dialog.current.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <figure>
        <span className={styles.exampleBadge}>가상 후기 예시 0{index + 1}</span>
        <div className={styles.reviewRating} aria-label={`가상 평점 5점 만점에 ${rating}점`}>
          <span aria-hidden="true">
            {"★".repeat(rating)}
            {"☆".repeat(5 - rating)}
          </span>
          <strong aria-hidden="true">
            {rating.toFixed(1)} <span>/ 5</span>
          </strong>
        </div>
        <blockquote>
          <span ref={text} className={styles.reviewText}>
            {quote}
          </span>
          <div className={styles.reviewActionSlot}>
            {overflows && (
              <button
                type="button"
                className={styles.reviewToggle}
                aria-haspopup="dialog"
                aria-label={`${person}의 예시 수강평 더보기`}
                onClick={() => setOpen(true)}
              >
                더보기 ↗
              </button>
            )}
          </div>
        </blockquote>
        <figcaption>{person} · 가상 인물</figcaption>
      </figure>
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            className={styles.reviewDialog}
            aria-labelledby={dialogTitleId}
            onClose={() => setOpen(false)}
            onClick={(event) => {
              if (event.target !== event.currentTarget) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              if (
                event.clientX < bounds.left ||
                event.clientX > bounds.right ||
                event.clientY < bounds.top ||
                event.clientY > bounds.bottom
              )
                dialog.current?.close();
            }}
          >
            <div className={styles.reviewDialogHeader}>
              <span className={styles.exampleBadge}>가상 후기 예시 0{index + 1}</span>
              <button
                type="button"
                onClick={() => dialog.current?.close()}
                aria-label="수강평 닫기"
              >
                닫기 ×
              </button>
            </div>
            <h2 id={dialogTitleId}>{person}의 수강평</h2>
            <div className={styles.dialogRating} aria-label={`가상 평점 5점 만점에 ${rating}점`}>
              <span aria-hidden="true">
                {"★".repeat(rating)}
                {"☆".repeat(5 - rating)}
              </span>
              <strong aria-hidden="true">{rating.toFixed(1)} / 5</strong>
            </div>
            <p className={styles.fullReview}>{quote}</p>
            <p className={styles.dialogNote}>
              화면 구성을 위한 가상 후기이며 실제 수강생의 후기가 아닙니다.
            </p>
          </dialog>,
          document.body,
        )}
    </>
  );
}

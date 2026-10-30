"use client";

import Image from "next/image";
import { workbookTrial } from "@/lib/workbook-course";
import { useEffect, useRef, useState } from "react";
import { workbookPurposes } from "@/lib/workbook-purpose";
import styles from "./WorkbookClass.module.scss";

// 실제 예시 페이지가 준비되면 previewUrl에 같은 출처의 경로를 등록한다.
const examples: { id: string; label: string; previewUrl?: string }[] = [
  { id: "service", label: "서비스 소개" },
  { id: "portfolio", label: "포트폴리오" },
  { id: "personal", label: "좋아하는 것 모음" },
];

export function WorkbookExampleBrowser({ onStart }: { onStart: () => void }) {
  const [active, setActive] = useState(examples[0]);
  const dialog = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);
  const purpose = workbookPurposes.find((item) => item.id === active.id)!;
  const thumbnail = `/images/workbook/candidates/${active.id}-website-v2.png`;
  return (
    <div className={styles.purposeLayout}>
      <div className={styles.exampleList}>
        <div className={styles.choices} aria-label="만들 수 있는 페이지 예시">
          {examples.map((example) => (
            <button
              key={example.id}
              className={styles.choice}
              aria-pressed={active.id === example.id}
              aria-controls="purpose-preview"
              onClick={() => setActive(example)}
            >
              {example.label}
              <span>{workbookPurposes.find((item) => item.id === example.id)!.goal}</span>
            </button>
          ))}
        </div>
        <button onClick={onStart}>기초강의 시작하기 →</button>
        <small>{workbookTrial.records}</small>
      </div>
      <aside
        id="purpose-preview"
        className={styles.purposePreview}
        aria-label="페이지 예시 미리보기"
      >
        <button
          className={styles.exampleThumbnailButton}
          onClick={() => {
            dialog.current?.showModal();
            setIsOpen(true);
          }}
          aria-label={`${active.label} 예시 크게 보기`}
          aria-haspopup="dialog"
        >
          <Image
            src={thumbnail}
            alt={`${active.label} 구성 예시`}
            width={1672}
            height={941}
            sizes="(min-width: 1024px) 45vw, 90vw"
            className={styles.purposeThumbnail}
          />
          <span>예시 크게 보기 ↗</span>
        </button>
        <div aria-live="polite">
          <h2>{active.label}</h2>
          <p>{purpose.connection}</p>
        </div>
        <small>
          현재는 디자인 참고 이미지예요. 실제로 조작할 수 있는 예시 페이지는 준비 중이에요.
        </small>
      </aside>
      <dialog
        ref={dialog}
        className={styles.exampleDialog}
        aria-labelledby="example-dialog-title"
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className={styles.exampleDialogContent}>
          <header>
            <h2 id="example-dialog-title">{active.label} · 페이지 예시</h2>
            <button autoFocus className={styles.quiet} onClick={() => dialog.current?.close()}>
              닫기 ×
            </button>
          </header>
          {active.previewUrl && isOpen ? (
            <iframe
              title={`${active.label} 직접 살펴보기`}
              src={active.previewUrl}
              sandbox="allow-scripts"
            />
          ) : (
            <div className={styles.exampleImageViewer}>
              <p>디자인 참고 이미지예요. 버튼과 링크는 동작하지 않아요.</p>
              <Image
                src={thumbnail}
                alt={`${active.label} 전체 디자인 예시`}
                width={1672}
                height={941}
                sizes="90vw"
              />
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}

"use client";

// 기존 모바일 소개 페이지 실험과 클래스의 전후 비교가 같은 CSS 화면을 사용한다.
import { useRef, type Ref, type ReactNode } from "react";
import styles from "./WorkbookJourney.module.scss";

export function ResponsivePagePreview({
  screen,
  appearance,
  fluid,
  stack,
  previewRef,
  page,
  onButton,
  children,
  label = "소개 페이지 실험 화면",
}: {
  children?: ReactNode;
  appearance?: "lesson";
  screen: "mobile" | "desktop";
  fluid: boolean;
  stack: boolean;
  previewRef?: Ref<HTMLDivElement>;
  page?: { title: string; intro: string; content: string };
  onButton: () => void;
  label?: string;
}) {
  const list = useRef<HTMLDivElement>(null);
  return (
    <div
      className={`${styles.previewOuter} ${appearance === "lesson" ? styles.lessonPreviewOuter : ""}`}
    >
      <div
        ref={previewRef}
        className={styles.preview}
        style={{ width: screen === "mobile" ? 280 : 560 }}
        tabIndex={0}
        role="region"
        aria-label={label}
      >
        <div className={styles.sample} style={{ width: fluid ? "100%" : 560 }}>
          <small>CAPY STUDIO</small>
          <h3>
            {page ? (
              page.title
            ) : (
              <>
                작은 작업실에서
                <br />
                만드는 다정한 것들.
              </>
            )}
          </h3>
          <p>{page ? page.intro : "차 한 잔과 함께, 우리만의 작업을 나눠요."}</p>
          {page ? (
            <>
              <button
                onClick={() => {
                  list.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
                  onButton();
                }}
              >
                내용 보기
              </button>
              <div ref={list}>
                <h4>소개할 내용</h4>
                <ul>
                  {page.content
                    .split("\n")
                    .filter((line) => line.trim())
                    .map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                </ul>
              </div>
            </>
          ) : (
            <>
              <div
                className={styles.sampleCards}
                style={{ flexDirection: screen === "mobile" && stack ? "column" : "row" }}
              >
                {["작업 이야기", "함께 만드는 시간"].map((title, i) => (
                  <article key={title}>
                    <span aria-hidden="true">{i === 0 ? "✳" : "☕"}</span>
                    <h4>{title}</h4>
                    <p>{i === 0 ? "작은 생각을 하나씩 완성해요." : "처음이어도 함께 시작해요."}</p>
                  </article>
                ))}
              </div>
              <button onClick={onButton}>작업실에 문의하기 ↗</button>
            </>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

// 2-2 예시 페이지 한 장: 칸과 막대로만 그린 가상의 페이지(실존 사이트를 그리지 않는다).
// onPart를 주면 부분마다 누를 수 있고, 누른 부분에는 그 부분이 하는 일이 붙는다.
import type { ReactNode } from "react";
import type { ReferenceExample } from "@/lib/workbook-plan-options";
import styles from "./WorkbookRefPage.module.scss";

export function WorkbookRefPage({
  example,
  letter,
  found = [],
  onPart,
  compact = false,
}: {
  example: ReferenceExample;
  letter: string;
  found?: readonly string[];
  onPart?: (id: string) => void;
  compact?: boolean;
}) {
  function part(id: string, children: ReactNode, className: string) {
    const meta = example.parts.find((item) => item.id === id)!;
    const shown = found.includes(id);
    const inner = (
      <>
        {children}
        {shown && (
          <em className={styles.label}>
            {meta.label} · {meta.role}
          </em>
        )}
      </>
    );
    return onPart ? (
      <button
        type="button"
        className={`${styles.part} ${className}`}
        data-found={shown}
        aria-label={`${meta.label}${shown ? ` · ${meta.role}` : " · 무슨 일을 하는지 보기"}`}
        onClick={() => onPart(id)}
      >
        {inner}
      </button>
    ) : (
      <div className={`${styles.part} ${className}`}>{inner}</div>
    );
  }
  return (
    <figure
      className={styles.page}
      data-compact={compact}
      aria-label={`예시 ${letter} · ${example.name}`}
    >
      <div className={styles.bar} aria-hidden="true">
        <i />
        <i />
        <i />
        <span>예시 {letter}</span>
      </div>
      <div className={styles.body}>
        {example.id === "a" && (
          <>
            {part("hero-photo", <span className={styles.photo}>사진</span>, styles.wide)}
            {part("one-line", <i className={styles.line} />, styles.wide)}
            {part("top-button", <span className={styles.cta}>버튼</span>, styles.center)}
          </>
        )}
        {example.id === "b" && (
          <>
            {part("plain-title", <i className={styles.titleBar} />, styles.wide)}
            {part(
              "card-list",
              <span className={styles.cards}>
                <i />
                <i />
                <i />
              </span>,
              styles.wide,
            )}
            {part("review", <i className={styles.quote} />, styles.wide)}
          </>
        )}
        {example.id === "c" && (
          <>
            {part(
              "big-sentence",
              <span className={styles.big}>
                <i />
                <i />
              </span>,
              styles.wide,
            )}
            {part("bottom-button", <span className={styles.cta}>버튼</span>, styles.center)}
            {part("footer-contact", <i className={styles.footer} />, styles.wide)}
          </>
        )}
      </div>
      <figcaption>{example.name}</figcaption>
    </figure>
  );
}

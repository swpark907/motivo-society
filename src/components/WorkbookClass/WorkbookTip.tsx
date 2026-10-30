"use client";

// 도움 카드를 직접 열되 수업 입력과 진행 상태는 그대로 유지한다.
import { useId, useRef, useState, type ReactNode } from "react";
import styles from "./WorkbookTip.module.scss";

export function WorkbookTip({
  title,
  children,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <div
      className={`${styles.tip} ${className ?? ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          close();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <span className={styles.label}>도움 카드</span>
        <span className={styles.title}>{title}</span>
        <span aria-hidden="true" className={styles.indicator}>
          {open ? "닫기 −" : "살펴보기 ↗"}
        </span>
      </button>
      <div id={id} hidden={!open} className={styles.content}>
        {children}
        <button type="button" className={styles.close} onClick={close}>
          도움 카드 닫기 ↑
        </button>
      </div>
    </div>
  );
}

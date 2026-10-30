import type { ReactNode } from "react";
import styles from "./WorkbookMapPanel.module.scss";

export function WorkbookPanelDisclosure({
  title,
  count,
  children,
  className = "",
}: {
  title: string;
  count?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={`${styles.disclosure} ${className}`}>
      <summary>
        <span>{title}</span>
        {count !== undefined && <small>{count}개</small>}
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className={styles.disclosureBody}>{children}</div>
    </details>
  );
}

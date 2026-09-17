import type { ReactNode } from "react";
import styles from "./Rail.module.scss";

type Props = { children: ReactNode; label: string };

export function Rail({ children, label }: Props) {
  return (
    <aside className={styles.rail} aria-label={label}>
      {children}
    </aside>
  );
}

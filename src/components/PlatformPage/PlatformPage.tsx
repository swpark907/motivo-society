import type { ReactNode } from "react";
import styles from "./PlatformPage.module.scss";

/**
 * 플랫폼 제품 화면의 공통 틀: 종이 바탕 + 한글 제목 + 영문 라벨 + 한 줄 설명.
 * AGENTS.md "플랫폼 제품 화면 예외"를 따른다.
 */
export function PlatformPage({
  label,
  title,
  lead,
  children,
}: {
  label: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className={`paper ${styles.page}`}>
      <div className={styles.inner}>
        <header className={styles.head}>
          <p className="label">{label}</p>
          <h1 className={styles.title}>{title}</h1>
          {lead && <p className={styles.lead}>{lead}</p>}
        </header>
        {children}
      </div>
    </main>
  );
}

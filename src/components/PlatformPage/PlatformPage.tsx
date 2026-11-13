import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./PlatformPage.module.scss";

/**
 * 플랫폼 제품 화면의 공통 틀(작업 노트, 2026-11-13): 검은 머리 띠(오렌지 윗선 · 영문 아이브로 ·
 * 한글 제목 · 한 줄 설명) + 도트 그리드 종이 본문. AGENTS.md "플랫폼 제품 화면 예외"를 따른다.
 */
export function PlatformPage({
  label,
  title,
  lead,
  back,
  children,
}: {
  label: string;
  title: string;
  lead?: ReactNode;
  /** 제목 위 되돌아가기 링크(예: 호스트 도구로) */
  back?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <main data-platform className={`paper ${styles.page}`}>
      <header className={styles.band}>
        <div className={styles.head}>
          {back && (
            <Link href={back.href} className={styles.back}>
              ← {back.label}
            </Link>
          )}
          <p className={styles.eyebrow}>{label}</p>
          <h1 className={styles.title}>{title}</h1>
          {lead && <p className={styles.lead}>{lead}</p>}
        </div>
      </header>
      <div className={styles.inner}>{children}</div>
    </main>
  );
}

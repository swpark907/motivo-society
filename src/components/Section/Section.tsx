import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./Section.module.scss";

type Props = {
  title: string;
  label: string;
  href?: string;
  children: ReactNode;
};

// 홈 섹션 공용 틀: 한글 제목 + 영문 대문자 부제, 오른쪽에 "전체 보기".
export function Section({ title, label, href, children }: Props) {
  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          <p className="label">{label}</p>
        </div>
        {href && (
          <Link href={href} className={styles.more}>
            전체 보기 →
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

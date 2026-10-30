import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./layout.module.scss";
export const metadata: Metadata = {
  title: "관리자 설계 실험실",
  robots: { index: false, follow: false },
};
export default function AdminLabLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <div className={styles.lab}>
      <nav aria-label="관리자 실험실 메뉴">
        <Link href="/demo/admin">관리자 설계</Link>
        <Link href="/demo/admin/articles">아티클 편집기</Link>
        <Link href="/workbook">워크북으로 ↗</Link>
      </nav>
      {children}
    </div>
  );
}

import type { Metadata } from "next";
import styles from "@/app/page.module.scss";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Library</h1>
      <p className={styles.lead}>준비 중입니다.</p>
    </main>
  );
}

import type { Metadata } from "next";
import styles from "@/app/page.module.scss";

export const metadata: Metadata = { title: "Yard" };

export default function YardPage() {
  return (
    <main className={styles.main}>
      <h1 className={`display ${styles.title}`}>Yard</h1>
      <p className={styles.lead}>준비 중입니다.</p>
    </main>
  );
}

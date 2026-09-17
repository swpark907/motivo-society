import type { Metadata } from "next";
import styles from "@/app/page.module.scss";

export const metadata: Metadata = { title: "Workbook" };

export default function WorkbookPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Workbook</h1>
      <p className={styles.lead}>커리큘럼을 따라가며 공부하는 공간. 준비 중입니다.</p>
    </main>
  );
}

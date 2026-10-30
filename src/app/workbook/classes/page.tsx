import type { Metadata } from "next";
import Link from "next/link";
import { WorkbookCatalog } from "@/components/WorkbookCatalog/WorkbookCatalog";
import styles from "@/components/WorkbookCatalog/WorkbookCatalog.module.scss";

export const metadata: Metadata = {
  title: "전체 클래스 · Workbook",
  description: "워크북의 웹페이지 클래스와 준비 중인 앱·게임·AI 영상 클래스를 둘러보세요.",
};

export default function WorkbookClassesPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/workbook#classes">← 워크북 홈</Link>
        <div className="label">WORKBOOK CLASSES</div>
        <h1>만들면서 익히는 클래스</h1>
        <p>지금 시작할 클래스와 준비 중인 클래스를 한곳에서 살펴보세요.</p>
      </header>
      <WorkbookCatalog layout="grid" />
    </main>
  );
}

import type { Metadata } from "next";
import { YardCard } from "@/components/YardCard/YardCard";
import { getAllYardItems } from "@/lib/content/yard";
import styles from "@/app/page.module.scss";
import local from "./page.module.scss";

export const metadata: Metadata = { title: "Yard", description: "모쏘의 클래스와 오프라인 모임" };

export default async function YardPage() {
  const items = await getAllYardItems();
  return (
    <main className={styles.main}>
      <h1 className={`display ${styles.title}`}>Yard</h1>
      <p className={styles.lead}>클래스와 오프라인 모임. 신청은 곧 열립니다.</p>
      <ul className={local.grid}>
        {items.map((item) => (
          <li key={item.slug}>
            <YardCard item={item} />
          </li>
        ))}
      </ul>
    </main>
  );
}

import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <h1 className={`display ${styles.heroTitle}`}>
          <span>배우고,</span>
          <span>만들고,</span>
          <span className={styles.heroAccent}>발견하는</span>
        </h1>
        <p className={styles.heroLead}>테크 기반 컬쳐클럽 — 모티보 소사이어티</p>
      </section>

      <section className={styles.index} aria-label="섹션">
        {NAV_ITEMS.map((item, i) => (
          <Link key={item.href} href={item.href} className={styles.indexItem}>
            <span className="label">{String(i + 1).padStart(2, "0")}</span>
            <span className={`display ${styles.indexTitle}`}>{item.label}</span>
            <span className={styles.indexDesc}>{item.description}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}

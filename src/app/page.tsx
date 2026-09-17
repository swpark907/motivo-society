import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>motivo society</h1>
      <p className={styles.lead}>배우고, 만들고, 발견하는 테크 기반 컬쳐클럽</p>
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => (
          <li key={item.href} className={styles.item}>
            <h2>
              <Link href={item.href}>{item.label}</Link>
            </h2>
            <p className={styles.meta}>{item.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { LIBRARY_CATEGORIES, getAllLibraryItems } from "@/lib/content/library";
import styles from "@/app/page.module.scss";
import local from "./page.module.scss";

export const metadata: Metadata = {
  title: "Library",
  description: "스킬·프롬프트·사용법 — 직접 돌려본 기술 자료",
};

export default async function LibraryPage() {
  const items = await getAllLibraryItems();
  return (
    <main className={styles.main}>
      <h1 className={`display ${styles.title}`}>Library</h1>
      <p className={styles.lead}>스킬·프롬프트·사용법. 뉴스가 아니라 기술.</p>

      {LIBRARY_CATEGORIES.map((c) => {
        const list = items.filter((i) => i.category === c.id);
        return (
          <section key={c.id} id={c.id} className={local.category}>
            <header className={local.categoryHeader}>
              <h2 className={`display ${local.categoryTitle}`}>{c.title.join(" ")}</h2>
              <p className="label">{c.label}</p>
            </header>
            {list.length === 0 ? (
              <p className={local.empty}>준비 중입니다.</p>
            ) : (
              <ul className={styles.list}>
                {list.map((i) => (
                  <li key={i.slug} className={styles.item}>
                    <h3>
                      <Link href={`/library/${i.slug}`}>{i.title}</Link>
                    </h3>
                    <p className={styles.meta}>
                      <time dateTime={i.publishedAt}>{i.publishedAt}</time>
                    </p>
                    <p>{i.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}

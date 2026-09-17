import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles } from "@/lib/content/articles";
import styles from "@/app/page.module.scss";

export const metadata: Metadata = { title: "Article" };

export default async function ArticleListPage() {
  const articles = await getAllArticles();
  return (
    <main className={styles.main}>
      <h1 className={`display ${styles.title}`}>Article</h1>
      <ul className={styles.list}>
        {articles.map((a) => (
          <li key={a.slug} className={styles.item}>
            <h2>
              <Link href={`/article/${a.slug}`}>{a.title}</Link>
            </h2>
            <p className={styles.meta}>
              <time dateTime={a.publishedAt}>{a.publishedAt}</time>
            </p>
            <p>{a.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}

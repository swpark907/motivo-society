import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getArticle, getArticleSlugs } from "@/lib/content/articles";
import styles from "./page.module.scss";

export async function generateStaticParams() {
  const slugs = await getArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/article/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  return { title: article.title, description: article.summary };
}

export default async function ArticlePage({ params }: PageProps<"/article/[slug]">) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <main className={styles.main}>
      <article>
        <header className={styles.header}>
          <h1 className={styles.title}>{article.title}</h1>
          <p className={styles.meta}>
            <time dateTime={article.publishedAt}>{article.publishedAt}</time>
          </p>
        </header>
        <div className={styles.body}>
          <MDXRemote source={article.content} />
        </div>
      </article>
    </main>
  );
}

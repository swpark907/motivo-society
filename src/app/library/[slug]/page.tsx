import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getCategory, getLibraryItem, getLibrarySlugs } from "@/lib/content/library";
import styles from "@/app/article/[slug]/page.module.scss";

export async function generateStaticParams() {
  return (await getLibrarySlugs()).map((slug) => ({ slug }));
}

// DM 링크의 첫인상 = OG 미리보기. title·description을 반드시 채운다.
export async function generateMetadata({
  params,
}: PageProps<"/library/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = await getLibraryItem(slug);
  if (!item) return {};
  return {
    title: item.title,
    description: item.summary,
    openGraph: { title: item.title, description: item.summary, type: "article" },
  };
}

export default async function LibraryItemPage({ params }: PageProps<"/library/[slug]">) {
  const { slug } = await params;
  const item = await getLibraryItem(slug);
  if (!item) notFound();
  const category = getCategory(item.category);

  return (
    <main className={`paper ${styles.main}`}>
      <article className={styles.article}>
        <header className={styles.header}>
          <p className="label">
            <Link href={`/library#${item.category}`}>Library · {category?.label}</Link> ·{" "}
            <time dateTime={item.publishedAt}>{item.publishedAt}</time>
          </p>
          <h1 className={styles.title}>{item.title}</h1>
          <p className={styles.summary}>{item.summary}</p>
        </header>
        <div className={styles.body}>
          <MDXRemote source={item.content} />
        </div>
      </article>
    </main>
  );
}

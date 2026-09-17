import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { YARD_STATUS_LABEL, getYardItem, getYardSlugs } from "@/lib/content/yard";
import styles from "@/app/article/[slug]/page.module.scss";

export async function generateStaticParams() {
  return (await getYardSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/yard/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = await getYardItem(slug);
  if (!item) return {};
  return {
    title: item.title,
    description: item.summary,
    openGraph: { title: item.title, description: item.summary },
  };
}

export default async function YardItemPage({ params }: PageProps<"/yard/[slug]">) {
  const { slug } = await params;
  const item = await getYardItem(slug);
  if (!item) notFound();

  return (
    <main className={`paper ${styles.main}`}>
      <article className={styles.article}>
        <header className={styles.header}>
          <p className="label">
            Yard · {item.kind === "class" ? "Class" : "Meetup"} · {YARD_STATUS_LABEL[item.status]}
            {item.startsAt && (
              <>
                {" "}
                · <time dateTime={item.startsAt}>{item.startsAt}</time>
                {item.endsAt && (
                  <>
                    {" "}
                    – <time dateTime={item.endsAt}>{item.endsAt}</time>
                  </>
                )}
              </>
            )}
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

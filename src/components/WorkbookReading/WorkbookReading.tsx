import { EditorialArticle } from "@/components/EditorialArticle/EditorialArticle";
import Link from "next/link";
import Image from "next/image";
import { WorkbookComments } from "./WorkbookComments";
import type { getWorkbookReading, WorkbookReadingSummary } from "@/lib/content/workbook-readings";
import styles from "./WorkbookReading.module.scss";

type Reading = NonNullable<Awaited<ReturnType<typeof getWorkbookReading>>>;
export function WorkbookReading({
  article,
  related,
}: {
  article: Reading;
  related: (WorkbookReadingSummary & { reason: string })[];
}) {
  return (
    <main className={styles.page} data-editorial-version={article.version}>
      <nav className={styles.breadcrumb} aria-label="읽을거리 경로">
        <Link href="/workbook">워크북</Link>
        <span aria-hidden="true">/</span>
        <Link href="/workbook#reading">읽을거리</Link>
      </nav>
      <EditorialArticle document={article} />
      <WorkbookComments key={article.slug} slug={article.slug} />
      <section className={styles.related} aria-labelledby="related-title">
        <header>
          <span className="label">KEEP EXPLORING</span>
          <h2 id="related-title">같이 보면 좋은 글들</h2>
        </header>
        <div>
          {related.map((entry) => (
            <Link href={`/workbook/reading/${entry.slug}`} key={entry.slug}>
              <Image
                src={entry.thumbnail}
                alt={entry.thumbnailAlt}
                width={1672}
                height={941}
                sizes="(min-width: 768px) 40vw, 100vw"
              />
              <div>
                <small>{entry.tags[0]} · 테스트 글</small>
                <h3>{entry.title}</h3>
                <p className={styles.relatedReason}>{entry.reason}</p>
                <span>읽어보기 ↗</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

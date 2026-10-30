import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { getWorkbookReadingOutline } from "@/lib/content/workbook-reading-outline";
import type { WorkbookReadingDocument } from "@/lib/content/workbook-editorial-schema";
import { ReadingDocument } from "./EditorialBlocks";
import styles from "./EditorialArticle.module.scss";

// 공개 화면과 관리자 미리보기가 같은 문서 데이터와 렌더러를 사용한다.
export function EditorialArticle({
  document: article,
  renderInsertion,
}: {
  document: WorkbookReadingDocument;
  renderInsertion?: (index: number) => ReactNode;
}) {
  const coverClass = {
    "title-first": "",
    "image-first": styles.imageFirst,
    split: styles.opening,
    compact: styles.compactOpening,
  }[article.cover.layout];
  const { sections, showToc } = getWorkbookReadingOutline(article.content, article.layout);
  const contents = (
    <nav className={styles.toc} aria-label="글 목차">
      <span className="label">IN THIS NOTE</span>
      <ol>
        {sections.map((section) => (
          <li key={section.id}>
            <Link href={`#${section.id}`}>{section.title}</Link>
          </li>
        ))}
      </ol>
    </nav>
  );
  return (
    <div className={styles.editorial}>
      <div
        className={coverClass}
        data-cover-layout={article.cover.layout}
        data-align={article.cover.align}
        data-focus={article.cover.focus}
      >
        <header className={styles.header}>
          <span className="label">FIELD NOTES · {article.tags.join(" / ")}</span>
          <h1>
            {article.displayTitle
              ? article.displayTitle.map((line, index) => (
                  <span key={line}>
                    {index > 0 && <br />}
                    {line}
                  </span>
                ))
              : article.title}
          </h1>
          <p className={styles.summary}>{article.deck ?? article.summary}</p>
          <p className={styles.status}>
            <span>테스트 글</span> 화면 검토용 임시 발행 · 실사용 검증 전
          </p>
        </header>
        <figure className={styles.cover}>
          <div
            className={styles.coverImage}
            data-ratio={
              article.cover.layout === "compact"
                ? "square"
                : article.cover.layout === "split"
                  ? "portrait"
                  : "wide"
            }
            data-focus={article.cover.focus}
            data-crop="scene"
          >
            <Image
              src={article.thumbnail}
              alt={article.thumbnailAlt}
              fill
              sizes="(min-width: 1024px) 80vw, 100vw"
              preload
            />
          </div>
          <figcaption>
            <span>{article.visualCaption}</span>
            <span>
              {article.thumbnail.startsWith("data:")
                ? "직접 추가한 이미지"
                : "AI 생성 이미지 · 주제 연출"}
            </span>
          </figcaption>
        </figure>
      </div>
      <div className={`paper ${styles.paper}`}>
        <div className={styles.layout}>
          {showToc && (
            <details className={styles.compactToc}>
              <summary>이 글의 흐름 보기</summary>
              {contents}
            </details>
          )}
          <article className={styles.body} aria-label="아티클 본문">
            <ReadingDocument blocks={article.content} renderInsertion={renderInsertion} />
            <footer className={styles.footer}>
              <span className="label">TAKE IT TO YOUR NEXT TRY</span>
              <p>{article.nextTry}</p>
              {article.nextTry && (
                <Link className={styles.nextTry} href="#reading-comments">
                  내 질문을 댓글로 남겨보기 ↗
                </Link>
              )}
              <Link href="/workbook#reading">다른 힌트 살펴보기 →</Link>
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}

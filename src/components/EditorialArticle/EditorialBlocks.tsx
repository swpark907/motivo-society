import { Fragment, type ReactNode } from "react";
import Image from "next/image";
import type { EditorialBlock, EditorialImage } from "@/lib/content/workbook-editorial-schema";
import { parseEditorialInline } from "@/lib/content/workbook-editorial-inline";
import styles from "./EditorialBlocks.module.scss";

function Inline({ text }: { text: string }) {
  return parseEditorialInline(text).map((token, index) => {
    switch (token.type) {
      case "strong":
        return <strong key={index}>{token.text}</strong>;
      case "code":
        return <code key={index}>{token.text}</code>;
      case "link":
        return (
          <a key={index} href={token.href}>
            {token.text}
          </a>
        );
      case "text":
        return token.text;
    }
  });
}
function Paragraphs({ text }: { text: string }) {
  return text.split(/\n\s*\n/).map((paragraph, index) => (
    <p key={index}>
      <Inline text={paragraph} />
    </p>
  ));
}
function Picture({ image }: { image: EditorialImage }) {
  return (
    <div
      className={styles.picture}
      data-ratio={image.ratio}
      data-focus={image.focus}
      data-crop={image.crop}
    >
      <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 60vw, 100vw" />
    </div>
  );
}
type FlowSpacing = "start" | "body" | "section" | "heading" | "feature" | "intro";
function spacingBefore(block: EditorialBlock, previous?: EditorialBlock): FlowSpacing {
  if (!previous) return "start";
  if (block.type === "heading") return "section";
  if (previous.type === "heading") return "heading";
  const standalone = (item: EditorialBlock) =>
    ["image", "split", "compare", "list", "quote", "qa"].includes(item.type);
  if (standalone(block) || standalone(previous)) return "feature";
  if (previous.type === "text" && previous.tone === "lead") return "intro";
  return "body";
}
function ReadingNode({
  block,
  preview = false,
  spacing,
}: {
  block: EditorialBlock;
  preview?: boolean;
  spacing?: FlowSpacing;
}) {
  const common = {
    ...(preview ? {} : { id: block.id, "data-block-type": block.type }),
    "data-spacing": spacing,
  };
  switch (block.type) {
    case "text":
      return (
        <div
          {...common}
          className={`${styles.node} ${styles.text}`}
          data-width={block.width}
          data-align={block.align}
          data-tone={block.tone}
        >
          <Paragraphs text={block.text} />
        </div>
      );
    case "callout":
      return (
        <aside
          {...common}
          className={`${styles.node} ${styles.callout}`}
          data-layout={block.layout}
          data-width={block.width}
          data-align={block.align}
        >
          {block.label && <span className={styles.label}>{block.label}</span>}
          <Paragraphs text={block.text} />
        </aside>
      );
    case "qa":
      return (
        <dl
          {...common}
          className={`${styles.node} ${styles.qa}`}
          data-layout={block.layout}
          data-width={block.width}
        >
          {block.items.map((item, index) => (
            <div key={index}>
              <dt>
                <span aria-hidden="true">Q.</span>
                <Inline text={item.question} />
              </dt>
              <dd>
                <Paragraphs text={item.answer} />
              </dd>
            </div>
          ))}
        </dl>
      );
    case "heading":
      return (
        <h2 {...common} className={`${styles.node} ${styles.heading}`}>
          {block.text}
        </h2>
      );
    case "quote":
      return (
        <blockquote
          {...common}
          className={`${styles.node} ${styles.quote}`}
          data-width={block.width}
          data-align={block.align}
          data-layout={block.layout}
        >
          {block.label && <span className={styles.label}>{block.label}</span>}
          <Paragraphs text={block.text} />
        </blockquote>
      );
    case "list":
      return (
        <ol
          {...common}
          className={`${styles.node} ${styles.list}`}
          data-width={block.width}
          data-layout={block.layout}
        >
          {block.items.map((item, index) => (
            <li key={index}>
              <span className={styles.number} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>
                  <Inline text={item.body} />
                </p>
              </div>
            </li>
          ))}
        </ol>
      );
    case "compare":
      return (
        <figure
          {...common}
          className={`${styles.node} ${styles.compare}`}
          data-width={block.width}
          data-layout={block.layout}
          data-count={block.items.length}
          aria-label="요청 비교"
        >
          {block.items.map((item, index) => (
            <div key={index}>
              <span className={styles.label}>{item.label}</span>
              <Paragraphs text={item.text} />
            </div>
          ))}
          <figcaption>{block.caption}</figcaption>
        </figure>
      );
    case "image":
      return (
        <figure {...common} className={styles.node} data-width={block.width}>
          <Picture image={block.image} />
          <figcaption>{block.image.caption}</figcaption>
        </figure>
      );
    case "split":
      return (
        <div
          {...common}
          className={`${styles.node} ${styles.split}`}
          data-width={block.width}
          data-side={block.imageSide}
          data-proportion={block.proportion}
          data-valign={block.verticalAlign}
        >
          <figure className={styles.media}>
            <Picture image={block.image} />
            <figcaption>{block.image.caption}</figcaption>
          </figure>
          <div className={styles.splitContent}>
            {block.content.map((item) => (
              <ReadingNode key={item.id} block={item} preview={preview} />
            ))}
          </div>
        </div>
      );
  }
}
export function ReadingDocument({
  blocks,
  renderInsertion,
}: {
  blocks: EditorialBlock[];
  renderInsertion?: (index: number) => ReactNode;
}) {
  return (
    <div className={styles.document}>
      {renderInsertion?.(0)}
      {blocks.map((block, index) => (
        <Fragment key={block.id}>
          <ReadingNode block={block} spacing={spacingBefore(block, blocks[index - 1])} />
          {renderInsertion?.(index + 1)}
        </Fragment>
      ))}
    </div>
  );
}

// 확인용 복사본에는 편집 대상 ID나 선택 표식을 만들지 않는다.
export function ReadingBlockPreview({ block }: { block: EditorialBlock }) {
  return (
    <div className={`paper ${styles.document} ${styles.preview}`}>
      <ReadingNode block={block} preview spacing="start" />
    </div>
  );
}

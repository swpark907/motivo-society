"use client";
// PC 너비의 독립 viewport에서 공개 렌더러를 사용한다. 문서·실행 코드는 저장하지 않는다.
import { useEffect, useRef, useState } from "react";
import { EditorialArticle } from "@/components/EditorialArticle/EditorialArticle";
import { ReadingBlockPreview } from "@/components/EditorialArticle/EditorialBlocks";
import type {
  EditorialBlock,
  WorkbookReadingDocument,
} from "@/lib/content/workbook-editorial-schema";
import { validateEditorialDraft } from "@/lib/editorial/editor-state";
import { findEditorialBlock } from "@/lib/editorial/selection";
import styles from "./ContentWorkspace.module.scss";
export const BLOCK_PREVIEW_DATA = "motivo.block-preview.data.v1";
export const BLOCK_PREVIEW_READY = "motivo.block-preview.ready.v1";
export const BLOCK_PREVIEW_SIZE = "motivo.block-preview.size.v1";
export function BlockPreviewCanvas({ documents }: { documents: WorkbookReadingDocument[] }) {
  const [block, setBlock] = useState<EditorialBlock | null>(null);
  const [cover, setCover] = useState<WorkbookReadingDocument | null>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        event.data?.type !== BLOCK_PREVIEW_DATA
      )
        return;
      const incoming = event.data.document;
      if (!incoming || typeof incoming.slug !== "string" || typeof event.data.id !== "string")
        return;
      const result = validateEditorialDraft(incoming, documents, incoming.slug, documents, true);
      if (result.ok) {
        setCover(event.data.id === "@cover" ? result.document : null);
        setBlock(findEditorialBlock(result.document, event.data.id) ?? null);
      }
    };
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: BLOCK_PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener("message", receive);
  }, [documents]);
  useEffect(() => {
    if (!root.current) return;
    const observer = new ResizeObserver(() => {
      window.parent.postMessage(
        { type: BLOCK_PREVIEW_SIZE, height: root.current!.getBoundingClientRect().height },
        window.location.origin,
      );
    });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={root}
      data-block-preview
      className={styles.canvas}
      onClickCapture={(event) => {
        if (event.target instanceof Element && event.target.closest("a")) event.preventDefault();
      }}
    >
      {cover ? (
        <EditorialArticle document={cover} />
      ) : block ? (
        <ReadingBlockPreview block={block} />
      ) : (
        <p>미리보기를 불러오는 중이에요.</p>
      )}
    </div>
  );
}

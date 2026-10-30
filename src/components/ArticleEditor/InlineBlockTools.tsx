"use client";
// 선택 구간의 실제 DOM 위치에 따라 본문 도구를 붙인다. 문서 데이터에는 포함하지 않는다.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { WorkbookReadingDocument } from "@/lib/content/workbook-editorial-schema";
import type { BlockOperation } from "@/lib/editorial/block-operations";
import styles from "./EditorialPreview.module.scss";
export function InlineBlockTools({
  id,
  document,
  reasons,
  previewScale,
  pending,
  notice,
  onOperate,
  onEdit,
}: {
  id: string;
  document: WorkbookReadingDocument;
  reasons: Record<BlockOperation, string | null>;
  pending: boolean;
  previewScale: number;
  notice: string;
  onOperate: (operation: BlockOperation) => void;
  onEdit: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; inside: boolean } | null>(
    null,
  );
  const [more, setMore] = useState(false);
  useEffect(() => {
    if (!more) return;
    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) setMore(false);
    };
    window.document.addEventListener("pointerdown", close, true);
    return () => window.document.removeEventListener("pointerdown", close, true);
  }, [more]);
  useLayoutEffect(() => {
    const target =
      id === "@cover"
        ? window.document.querySelector<HTMLElement>("[data-cover-layout]")
        : window.document.getElementById(id);
    const toolbar = ref.current;
    const canvas = toolbar?.parentElement;
    if (!target || !toolbar || !canvas) return;
    let frame = 0;
    const update = () => {
      const rect = target.getBoundingClientRect(),
        parent = canvas.getBoundingClientRect();
      const width = toolbar.getBoundingClientRect().width;
      const inside = rect.top < toolbar.getBoundingClientRect().height + 12;
      const next = {
        top:
          Math.max(rect.top, Math.min(rect.bottom - toolbar.getBoundingClientRect().height, 0)) -
          parent.top,
        left: Math.max(0, Math.min(rect.right - parent.left - width, parent.width - width)),
        inside,
      };
      setPosition((previous) =>
        previous &&
        previous.top === next.top &&
        previous.left === next.left &&
        previous.inside === next.inside
          ? previous
          : next,
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(target);
    observer.observe(canvas);
    observer.observe(toolbar);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
    };
  }, [id, document, previewScale]);
  const reasonFor = (operation: BlockOperation) =>
    pending ? "미적용 내용을 먼저 적용하거나 취소해주세요." : reasons[operation];
  const button = (operation: BlockOperation, label: string, visible: string) => {
    const reason = reasonFor(operation);
    return (
      <button
        type="button"
        aria-label={label}
        disabled={Boolean(reason)}
        title={reason ?? label}
        aria-describedby={reason ? `inline-${operation}` : undefined}
        onClick={() => {
          setMore(false);
          onOperate(operation);
        }}
      >
        {visible}
        {reason && (
          <span className={styles.srOnly} id={`inline-${operation}`}>
            {reason}
          </span>
        )}
      </button>
    );
  };
  return (
    <div
      ref={ref}
      data-editor-tools
      data-inline-block-tools
      className={styles.inlineBlockTools}
      role="group"
      aria-label={id === "@cover" ? "표지 관리" : "구간 관리"}
      data-inside={position?.inside}
      style={
        {
          "--inline-scale": 1 / previewScale,
          top: position?.top ?? 0,
          left: position?.left ?? 0,
          visibility: position ? "visible" : "hidden",
        } as CSSProperties
      }
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setMore(false);
          ref.current?.querySelector<HTMLButtonElement>("[aria-expanded]")?.focus();
          event.stopPropagation();
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setMore(false);
      }}
    >
      <div className={styles.inlineActions}>
        <button type="button" aria-label="구간 편집" onClick={onEdit}>
          편집
        </button>
        {id !== "@cover" && (
          <>
            {button("up", "↑ 위로 이동", "↑")}
            {button("down", "↓ 아래로 이동", "↓")}
            {button("duplicate", "구간 복제", "복제")}
            <button
              type="button"
              aria-label="구간 관리 더보기"
              aria-expanded={more}
              aria-controls="inline-block-more"
              onClick={() => setMore(!more)}
            >
              ⋯
            </button>
          </>
        )}
      </div>
      {more && (
        <div className={styles.inlineMore} id="inline-block-more">
          {button("delete", "구간 삭제", "구간 삭제")}
          {reasonFor("delete") && <p>{reasonFor("delete")}</p>}
        </div>
      )}
      {pending && <p className={styles.inlineHint}>미적용 내용을 먼저 적용하거나 취소해주세요.</p>}
      {notice && (
        <span className={styles.srOnly} role="status">
          {notice}
        </span>
      )}
    </div>
  );
}

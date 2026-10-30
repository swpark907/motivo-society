"use client";
// 입력 상태와 독립적인 스크롤 영역에 PC 너비 미리보기를 축소해 표시한다.
import {
  useEffect,
  useImperativeHandle,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
  type ReactNode,
} from "react";
import type { WorkbookReadingDocument } from "@/lib/content/workbook-editorial-schema";
import { BLOCK_PREVIEW_DATA, BLOCK_PREVIEW_READY, BLOCK_PREVIEW_SIZE } from "./BlockPreviewCanvas";
import styles from "./ContentWorkspace.module.scss";
function ScaledBlockPreview({ document, id }: { document: WorkbookReadingDocument; id: string }) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(300);
  const [zoom, setZoom] = useState<number | null>(null);
  const effectiveScale = zoom ?? scale;
  const canPan = effectiveScale > scale;
  const drag = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const currentScale = useRef(effectiveScale);
  const anchor = useRef<{ x: number; y: number; left: number; top: number; scale: number } | null>(
    null,
  );
  useLayoutEffect(() => {
    currentScale.current = effectiveScale;
    const point = anchor.current;
    if (!point || !scroll.current) return;
    scroll.current.scrollLeft = ((point.left + point.x) * effectiveScale) / point.scale - point.x;
    scroll.current.scrollTop = ((point.top + point.y) * effectiveScale) / point.scale - point.y;
    anchor.current = null;
  }, [effectiveScale]);
  useEffect(() => {
    const target = scroll.current;
    if (!target) return;
    const zoomAt = (value: number, clientX: number, clientY: number) => {
      const next = Math.max(0.1, Math.min(2, value));
      if (next === currentScale.current) {
        anchor.current = null;
        return;
      }
      const rect = target.getBoundingClientRect();
      // 상위 편집 캔버스의 CSS 축소 배율도 좌표에 반영한다.
      anchor.current = {
        x: ((clientX - rect.left) * target.offsetWidth) / rect.width,
        y: ((clientY - rect.top) * target.offsetHeight) / rect.height,
        left: target.scrollLeft,
        top: target.scrollTop,
        scale: currentScale.current,
      };
      setZoom(next);
    };
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const delta =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? target.clientHeight : 1);
      zoomAt(
        currentScale.current * Math.exp(-Math.max(-200, Math.min(200, delta)) * 0.005),
        event.clientX,
        event.clientY,
      );
    };
    let pinch: { distance: number; scale: number } | null = null;
    const distance = (touches: TouchList) =>
      Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    const start = (event: TouchEvent) => {
      if (event.touches.length !== 2) {
        pinch = null;
        return;
      }
      event.preventDefault();
      pinch = { distance: distance(event.touches), scale: currentScale.current };
    };
    const move = (event: TouchEvent) => {
      if (!pinch || event.touches.length !== 2 || pinch.distance === 0) return;
      event.preventDefault();
      zoomAt(
        (pinch.scale * distance(event.touches)) / pinch.distance,
        (event.touches[0].clientX + event.touches[1].clientX) / 2,
        (event.touches[0].clientY + event.touches[1].clientY) / 2,
      );
    };
    const end = () => {
      pinch = null;
    };
    target.addEventListener("wheel", wheel, { passive: false });
    target.addEventListener("touchstart", start, { passive: false });
    target.addEventListener("touchmove", move, { passive: false });
    target.addEventListener("touchend", end);
    target.addEventListener("touchcancel", end);
    return () => {
      target.removeEventListener("wheel", wheel);
      target.removeEventListener("touchstart", start);
      target.removeEventListener("touchmove", move);
      target.removeEventListener("touchend", end);
      target.removeEventListener("touchcancel", end);
    };
  }, []);

  useEffect(() => {
    if (!box.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setScale(Math.min(1, entry.contentRect.width / 1200)),
    );
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const send = () =>
      frame.current?.contentWindow?.postMessage(
        { type: BLOCK_PREVIEW_DATA, document, id },
        window.location.origin,
      );
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow)
        return;
      if (event.data?.type === BLOCK_PREVIEW_READY) send();
      if (
        event.data?.type === BLOCK_PREVIEW_SIZE &&
        Number.isFinite(event.data.height) &&
        event.data.height > 0 &&
        event.data.height < 200000
      )
        setHeight(event.data.height);
    };
    window.addEventListener("message", receive);
    send();
    return () => window.removeEventListener("message", receive);
  }, [document, id]);
  return (
    <div ref={box} className={styles.scaled}>
      <div className={styles.zoomTools} role="group" aria-label="미리보기 배율">
        <span className={styles.scaleLabel} aria-live="polite">
          PC 1200px · {Math.round(effectiveScale * 100)}%
        </span>
        <button
          type="button"
          aria-label="미리보기 축소"
          disabled={effectiveScale <= 0.1}
          onClick={() => setZoom(Math.max(0.1, effectiveScale - 0.25))}
        >
          −
        </button>
        <button
          type="button"
          aria-label="미리보기 확대"
          disabled={effectiveScale >= 2}
          onClick={() => setZoom(Math.min(2, effectiveScale + 0.25))}
        >
          +
        </button>
        <button type="button" aria-pressed={zoom === 1} onClick={() => setZoom(1)}>
          100%
        </button>
        <button type="button" aria-pressed={zoom === null} onClick={() => setZoom(null)}>
          전체 맞춤
        </button>
      </div>
      <p className={styles.gestureHint}>
        <span className={styles.desktopHint}>Ctrl+휠로 확대·축소, 드래그로 이동</span>
        <span className={styles.touchHint}>두 손가락으로 확대·축소, 한 손가락으로 이동</span>
      </p>
      <div
        ref={scroll}
        className={styles.previewScroll}
        data-pannable={canPan}
        data-dragging={dragging}
        tabIndex={0}
        aria-label="확대 미리보기 스크롤"
        onPointerDown={(event) => {
          if (!canPan || event.pointerType !== "mouse" || event.button !== 0) return;
          const target = event.currentTarget;
          drag.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            left: target.scrollLeft,
            top: target.scrollTop,
          };
          target.setPointerCapture(event.pointerId);
          setDragging(true);
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (!start || start.id !== event.pointerId) return;
          event.currentTarget.scrollLeft = start.left - (event.clientX - start.x);
          event.currentTarget.scrollTop = start.top - (event.clientY - start.y);
        }}
        onPointerUp={(event) => {
          if (drag.current?.id !== event.pointerId) return;
          drag.current = null;
          setDragging(false);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
        }}
        onLostPointerCapture={() => {
          drag.current = null;
          setDragging(false);
        }}
      >
        <div
          style={{ width: 1200 * effectiveScale, height: height * effectiveScale }}
          className={styles.frame}
        >
          <iframe
            ref={frame}
            title="PC 구간 미리보기"
            src="/demo/editorial-block-preview"
            style={{ width: 1200, height, transform: `scale(${effectiveScale})` }}
            onLoad={() =>
              frame.current?.contentWindow?.postMessage(
                { type: BLOCK_PREVIEW_DATA, document, id },
                window.location.origin,
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
export type ContentWorkspaceHandle = { focusField: (key: string) => void };
export function ContentWorkspace({
  editor,
  compact,
  document,
  id,
  label = "변경 결과 미리보기",
  focusRef,
}: {
  editor: ReactNode;
  compact: boolean;
  document: WorkbookReadingDocument | null;
  id: string;
  label?: string;
  focusRef?: Ref<ContentWorkspaceHandle>;
}) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const base = useId();
  const editPane = useRef<HTMLElement>(null);
  const [focusRequest, setFocusRequest] = useState<{ key: string } | null>(null);
  useImperativeHandle(
    focusRef,
    () => ({
      focusField(key: string) {
        setTab("edit");
        setFocusRequest({ key });
      },
    }),
    [],
  );
  useLayoutEffect(() => {
    if (!focusRequest) return;
    const input = Array.from(
      editPane.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "[data-feedback-key]",
      ) ?? [],
    ).find((element) => element.dataset.feedbackKey === focusRequest.key);
    input?.focus({ preventScroll: true });
    input?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  }, [focusRequest]);
  return (
    <div className={styles.workspace} data-compact={compact}>
      <div role="tablist" aria-label="내용 편집 화면" className={styles.tabs}>
        {(["edit", "preview"] as const).map((value) => (
          <button
            key={value}
            id={`${base}-${value}-tab`}
            role="tab"
            aria-selected={tab === value}
            aria-controls={`${base}-${value}`}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => setTab(value)}
            onKeyDown={(event) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? "edit"
                    : event.key === "End"
                      ? "preview"
                      : value === "edit"
                        ? "preview"
                        : "edit";
                setTab(next);
                window.document.getElementById(`${base}-${next}-tab`)?.focus();
              }
            }}
          >
            {value === "edit" ? "내용 수정" : "미리보기"}
          </button>
        ))}
      </div>
      <div className={styles.columns}>
        <section
          ref={editPane}
          id={`${base}-edit`}
          role="tabpanel"
          aria-labelledby={`${base}-edit-tab`}
          data-active={tab === "edit"}
          className={styles.edit}
        >
          <p className={styles.paneLabel}>내용 수정</p>
          {editor}
        </section>
        <section
          id={`${base}-preview`}
          role="tabpanel"
          aria-labelledby={`${base}-preview-tab`}
          data-active={tab === "preview"}
          className={styles.preview}
        >
          <p className={styles.paneLabel}>미리보기</p>
          <div role="region" aria-label={label}>
            {document ? (
              <ScaledBlockPreview document={document} id={id} />
            ) : (
              <p role="status">필수 내용을 채우면 미리보기가 나타납니다.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

"use client";

// 표시 좌표는 원본 이미지에 대한 비율로 저장해 요약과 확대 화면에서 같은 곳을 가리킨다.
import Image from "next/image";
import {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  type Ref,
  type PointerEvent,
} from "react";
import type { ResultMark } from "./WorkbookProgressContext";
import styles from "./WorkbookCompletionScreens.module.scss";

export type MarkedScreenshotHandle = { showArea: (id: string) => void };

export function WorkbookMarkedScreenshot({
  src,
  alt,
  marks,
  showNotes = true,
  onChange,
  onEditBegin,
  onEditEnd,
  onEditCancel,
  onNoteSelect,
  ref,
}: {
  ref?: Ref<MarkedScreenshotHandle>;
  onNoteSelect?: (id: string) => void;
  src: string;
  alt: string;
  marks: ResultMark[];
  showNotes?: boolean;
  onChange?: (marks: ResultMark[]) => void;
  onEditBegin?: () => void;
  onEditEnd?: () => void;
  onEditCancel?: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [draft, setDraft] = useState<Omit<ResultMark, "id" | "note"> | null>(null);
  const areas = useRef(new Map<string, HTMLSpanElement>());
  const notes = useRef(new Map<string, HTMLTextAreaElement>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function showArea(id: string) {
    const area = areas.current.get(id);
    if (!area) return;
    area.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
    area.focus({ preventScroll: true });
    setHighlighted(id);
    setSelected(id);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHighlighted(null), 1800);
  }
  useImperativeHandle(ref, () => ({ showArea }));
  function showNote(id: string) {
    if (onNoteSelect) {
      onNoteSelect(id);
      return;
    }
    const note = notes.current.get(id);
    note?.scrollIntoView({ block: "center", behavior: "instant" });
    note?.focus({ preventScroll: true });
  }
  const gesture = useRef<{
    id: string;
    pointerId: number;
    x: number;
    y: number;
    mark: ResultMark;
    mode: "move" | "nw" | "ne" | "sw" | "se";
    canvas: DOMRect;
  } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  function beginGesture(
    event: PointerEvent<HTMLElement>,
    mark: ResultMark,
    mode: "move" | "nw" | "ne" | "sw" | "se",
  ) {
    if (!onChange || marking || !event.isPrimary || event.button !== 0 || gesture.current) return;
    event.preventDefault();
    event.stopPropagation();
    const canvas = areas.current.get(mark.id)?.parentElement?.getBoundingClientRect();
    if (!canvas) return;
    onEditBegin?.();
    gesture.current = {
      id: mark.id,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      mark,
      mode,
      canvas,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(mark.id);
    setSelected(mark.id);
  }
  function updateGesture(event: PointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId || !onChange) return;
    event.stopPropagation();
    const { mark, mode, canvas } = current;
    const dx = (event.clientX - current.x) / canvas.width;
    const dy = (event.clientY - current.y) / canvas.height;
    let { x, y, width, height } = mark;
    if (mode === "move") {
      x = Math.max(0, Math.min(1 - width, x + dx));
      y = Math.max(0, Math.min(1 - height, y + dy));
    } else {
      const right = x + width,
        bottom = y + height;
      if (mode.includes("w")) {
        x = Math.max(0, Math.min(right - 0.04, x + dx));
        width = right - x;
      } else width = Math.max(0.04, Math.min(1 - x, width + dx));
      if (mode.includes("n")) {
        y = Math.max(0, Math.min(bottom - 0.04, y + dy));
        height = bottom - y;
      } else height = Math.max(0.04, Math.min(1 - y, height + dy));
    }
    onChange(
      marks.map((item) => (item.id === current.id ? { ...item, x, y, width, height } : item)),
    );
  }
  function finishGesture(event: PointerEvent<HTMLElement>, cancel = false) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    if (cancel) onEditCancel?.();
    else {
      updateGesture(event);
      onEditEnd?.();
    }
    gesture.current = null;
    setDragging(null);
  }
  const start = useRef<{ x: number; y: number } | null>(null);
  function add(rect: Omit<ResultMark, "id" | "note">) {
    const id = crypto.randomUUID();
    onChange?.([...marks, { ...rect, id, note: "" }]);
    setSelected(id);
  }
  return (
    <div className={styles.markedScreenshot}>
      <div
        className={styles.imageCanvas}
        data-marking={marking || undefined}
        onPointerDown={(event) => {
          if (!marking || !onChange || !event.isPrimary || event.button !== 0) return;
          const rect = event.currentTarget.getBoundingClientRect();
          start.current = {
            x: (event.clientX - rect.left) / rect.width,
            y: (event.clientY - rect.top) / rect.height,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!start.current) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
          const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
          setDraft({
            x: Math.min(start.current.x, x),
            y: Math.min(start.current.y, y),
            width: Math.abs(x - start.current.x),
            height: Math.abs(y - start.current.y),
          });
        }}
        onPointerUp={(event) => {
          if (!start.current) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
          const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
          const completed = {
            x: Math.min(start.current.x, x),
            y: Math.min(start.current.y, y),
            width: Math.abs(x - start.current.x),
            height: Math.abs(y - start.current.y),
          };
          if (completed.width > 0.02 && completed.height > 0.02) {
            add(completed);
            setMarking(false);
          }
          start.current = null;
          setDraft(null);
        }}
        onPointerCancel={() => {
          start.current = null;
          setDraft(null);
        }}
      >
        <Image
          src={src}
          alt={alt}
          unoptimized
          width={1200}
          height={800}
          draggable={false}
          className={styles.markImage}
        />
        {marks.map((mark, index) => (
          <span
            key={mark.id}
            ref={(element) => {
              if (element) areas.current.set(mark.id, element);
              else areas.current.delete(mark.id);
            }}
            onFocus={() => setSelected(mark.id)}
            data-editable={Boolean(onChange) || undefined}
            data-dragging={dragging === mark.id || undefined}
            onPointerDown={(event) => {
              if ((event.target as HTMLElement).closest("button")) return;
              beginGesture(event, mark, "move");
            }}
            onPointerMove={updateGesture}
            onPointerUp={(event) => finishGesture(event)}
            onPointerCancel={(event) => finishGesture(event, true)}
            onLostPointerCapture={(event) => finishGesture(event, true)}
            data-highlighted={highlighted === mark.id || undefined}
            className={styles.userMark}
            aria-label={`변경 영역 ${index + 1}`}
            role="group"
            tabIndex={-1}
            onKeyDown={(event) => {
              if (
                !onChange ||
                !mark ||
                !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
              )
                return;
              event.preventDefault();
              const dx = event.key === "ArrowRight" ? 0.02 : event.key === "ArrowLeft" ? -0.02 : 0;
              const dy = event.key === "ArrowDown" ? 0.02 : event.key === "ArrowUp" ? -0.02 : 0;
              const updated = event.shiftKey
                ? {
                    ...mark,
                    width: Math.max(0.04, Math.min(1 - mark.x, mark.width + dx)),
                    height: Math.max(0.04, Math.min(1 - mark.y, mark.height + dy)),
                  }
                : {
                    ...mark,
                    x: Math.max(0, Math.min(1 - mark.width, mark.x + dx)),
                    y: Math.max(0, Math.min(1 - mark.height, mark.y + dy)),
                  };
              onChange(marks.map((item) => (item.id === mark.id ? updated : item)));
            }}
            style={{
              left: `${mark.x * 100}%`,
              top: `${mark.y * 100}%`,
              width: `${mark.width * 100}%`,
              height: `${mark.height * 100}%`,
            }}
          >
            <button
              type="button"
              className={styles.areaNumber}
              aria-label={`${index + 1}번 영역 설명 보기`}
              onClick={(event) => {
                event.stopPropagation();
                showNote(mark.id);
              }}
            >
              {index + 1}
            </button>
            {onChange &&
              selected === mark.id &&
              (["nw", "ne", "sw", "se"] as const).map((corner) => (
                <ResizeHandle
                  key={corner}
                  corner={corner}
                  index={index}
                  mark={mark}
                  onBegin={beginGesture}
                />
              ))}
          </span>
        ))}
        {draft && (
          <span
            className={styles.userMark}
            aria-hidden="true"
            style={{
              left: `${draft.x * 100}%`,
              top: `${draft.y * 100}%`,
              width: `${draft.width * 100}%`,
              height: `${draft.height * 100}%`,
            }}
          />
        )}
      </div>
      {onChange && (
        <>
          <div className={styles.markTools}>
            <button
              type="button"
              aria-pressed={marking}
              onClick={() => {
                setMarking(!marking);
                start.current = null;
                setDraft(null);
              }}
            >
              변경 영역 표시
            </button>
            <button
              type="button"
              onClick={() => {
                add({
                  x: 0.15,
                  y:
                    [0.15, 0.4, 0.65].find((y) =>
                      marks.every((mark) => Math.abs(mark.y - y) > 0.03),
                    ) ?? 0.15,
                  width: 0.6,
                  height: 0.2,
                });
                setMarking(false);
              }}
            >
              가운데 영역 표시
            </button>
            {marks.length > 0 && (
              <button type="button" onClick={() => onChange([])}>
                모든 표시 지우기
              </button>
            )}
          </div>
          <small>
            {marking
              ? "사진 위에서 손가락이나 마우스로 영역을 그려주세요. 추가할 때마다 번호가 붙어요."
              : "영역 안쪽을 끌면 이동하고 모서리를 끌면 크기가 바뀌어요. 번호는 설명으로 이동해요. 키보드로는 가운데 영역을 추가한 뒤, 표시를 선택하고 방향키로 이동·Shift+방향키로 크기를 조절해요."}
          </small>
        </>
      )}
      {showNotes && marks.length > 0 && (
        <ol className={styles.areaNotes} aria-label="영역별 개선 설명">
          {marks.map((mark, index) => (
            <li key={mark.id}>
              {onChange ? (
                <>
                  <button
                    type="button"
                    className={styles.noteJump}
                    onClick={() => showArea(mark.id)}
                  >
                    {index + 1}번 영역 화면에서 보기 ↑
                  </button>
                  <label className={styles.improvementNote}>
                    {index + 1}번 영역 · 개선한 점
                    <textarea
                      ref={(element) => {
                        if (element) notes.current.set(mark.id, element);
                        else notes.current.delete(mark.id);
                      }}
                      onFocus={onEditBegin}
                      onBlur={onEditEnd}
                      rows={2}
                      maxLength={240}
                      value={mark.note}
                      placeholder="이 영역에서 무엇이 더 좋아졌나요?"
                      onChange={(event) =>
                        onChange(
                          marks.map((item) =>
                            item.id === mark.id ? { ...item, note: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => onChange(marks.filter((item) => item.id !== mark.id))}
                  >
                    {index + 1}번 영역 삭제
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => showArea(mark.id)}>
                  {mark.note.trim() || "설명을 아직 적지 않았어요."}
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ResizeHandle({
  corner,
  index,
  mark,
  onBegin,
}: {
  corner: "nw" | "ne" | "sw" | "se";
  index: number;
  mark: ResultMark;
  onBegin: (
    event: PointerEvent<HTMLElement>,
    mark: ResultMark,
    mode: "move" | "nw" | "ne" | "sw" | "se",
  ) => void;
}) {
  return (
    <button
      type="button"
      className={styles.resizeHandle}
      data-corner={corner}
      aria-label={`${index + 1}번 영역 ${{ nw: "왼쪽 위", ne: "오른쪽 위", sw: "왼쪽 아래", se: "오른쪽 아래" }[corner]} 크기 조절`}
      onPointerDown={(event) => onBegin(event, mark, corner)}
      onClick={(event) => event.stopPropagation()}
    />
  );
}

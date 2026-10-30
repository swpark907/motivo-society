import { useEffect, useId, useRef, useState } from "react";
import type { EditorialBlock } from "@/lib/content/workbook-editorial-schema";
import { requiredFieldMessage } from "@/lib/editorial/input-feedback";
import styles from "./EditorialPreview.module.scss";
export type StructuredBlock = Extract<EditorialBlock, { type: "compare" | "qa" | "list" }>;
export function isStructuredBlock(block: EditorialBlock): block is StructuredBlock {
  return block.type === "compare" || block.type === "qa" || block.type === "list";
}
// 선택한 구간의 내용만 연다. 배치나 문서 메타데이터는 나열하지 않는다.
export function StructuredContentFields({
  block,
  onChange,
}: {
  block: EditorialBlock;
  onChange: (block: EditorialBlock) => void;
}) {
  const base = useId();
  const root = useRef<HTMLDivElement>(null);
  const nextKey = useRef(isStructuredBlock(block) ? block.items.length : 0);
  const [itemKeys, setItemKeys] = useState(() =>
    isStructuredBlock(block) ? block.items.map((_, index) => `${base}-${index}`) : [],
  );
  const focusItem = useRef<number | null>(null);
  useEffect(() => {
    if (focusItem.current === null) return;
    root.current
      ?.querySelectorAll("fieldset")
      [focusItem.current]?.querySelector<HTMLInputElement>("input")
      ?.focus();
    focusItem.current = null;
  }, [block]);
  const field = (
    key: string,
    label: string,
    value: string,
    change: (value: string) => void,
    multiline = false,
    required = true,
  ) => (
    <div className={styles.contentField} key={key}>
      <label htmlFor={`${base}-${key}`}>{label}</label>
      {multiline ? (
        <textarea
          id={`${base}-${key}`}
          value={value}
          data-feedback-key={key}
          aria-invalid={(required && !value.trim()) || undefined}
          aria-describedby={required && !value.trim() ? `${base}-${key}-error` : undefined}
          onChange={(event) => change(event.target.value)}
          rows={3}
        />
      ) : (
        <input
          id={`${base}-${key}`}
          value={value}
          data-feedback-key={key}
          aria-invalid={(required && !value.trim()) || undefined}
          aria-describedby={required && !value.trim() ? `${base}-${key}-error` : undefined}
          onChange={(event) => change(event.target.value)}
        />
      )}
      {required && !value.trim() && (
        <button
          type="button"
          id={`${base}-${key}-error`}
          className={styles.fieldError}
          onClick={() => {
            const input = window.document.getElementById(`${base}-${key}`);
            input?.focus({ preventScroll: true });
            input?.scrollIntoView({ block: "nearest", behavior: "instant" });
          }}
        >
          {requiredFieldMessage(label)}
        </button>
      )}
    </div>
  );
  if (!isStructuredBlock(block))
    return (
      <div className={styles.contentFields}>
        {"text" in block &&
          field(
            "text",
            "선택한 구간의 문구",
            block.text,
            (value) => onChange({ ...block, text: value }),
            true,
          )}
        {("label" in block || block.type === "quote" || block.type === "callout") &&
          field(
            "label",
            "보조 제목 (선택)",
            "label" in block ? (block.label ?? "") : "",
            (value) =>
              onChange({ ...block, label: value.trim() ? value : undefined } as EditorialBlock),
            false,
            false,
          )}
        {"image" in block && (
          <>
            {field("alt", "사진 설명", block.image.alt, (value) =>
              onChange({ ...block, image: { ...block.image, alt: value } }),
            )}
            {field(
              "caption",
              "사진 캡션",
              block.image.caption,
              (value) => onChange({ ...block, image: { ...block.image, caption: value } }),
              true,
            )}
            {block.type === "split" && <p>사진 옆 글은 본문에서 해당 글을 선택해 수정해주세요.</p>}
          </>
        )}
      </div>
    );
  const minimum = block.type === "qa" ? 1 : 2;
  const maximum = block.type === "compare" ? 3 : 8;
  const itemName = block.type === "qa" ? "문답" : "항목";
  const changeItem = (action: "add" | "delete" | "up" | "down", index = 0) => {
    if (action === "add" && block.items.length >= maximum) return;
    if (action === "delete" && block.items.length <= minimum) return;
    const destination = action === "up" ? index - 1 : index + 1;
    if (
      (action === "up" || action === "down") &&
      (destination < 0 || destination >= block.items.length)
    )
      return;
    function rearrange<T>(items: T[], empty: T): T[] {
      const result = [...items];
      if (action === "add") result.push(empty);
      else if (action === "delete") result.splice(index, 1);
      else [result[index], result[destination]] = [result[destination], result[index]];
      return result;
    }
    const addedKey = `${base}-${nextKey.current++}`;
    setItemKeys((keys) => rearrange(keys, addedKey));
    focusItem.current =
      action === "add"
        ? block.items.length
        : action === "delete"
          ? Math.min(index, block.items.length - 2)
          : destination;
    if (block.type === "compare")
      onChange({ ...block, items: rearrange(block.items, { label: "", text: "" }) });
    else if (block.type === "qa")
      onChange({ ...block, items: rearrange(block.items, { question: "", answer: "" }) });
    else onChange({ ...block, items: rearrange(block.items, { title: "", body: "" }) });
  };
  return (
    <div ref={root} className={styles.contentFields} data-count={block.items.length}>
      <p className={styles.itemHint}>
        {itemName} {block.items.length}개 · {minimum}~{maximum}개로 구성할 수 있어요.
      </p>
      {block.items.map((item, index) => (
        <fieldset key={itemKeys[index]}>
          <legend>{block.type === "qa" ? `문답 ${index + 1}` : `항목 ${index + 1}`}</legend>
          <div className={styles.itemActions}>
            <button
              type="button"
              aria-label={`${itemName} ${index + 1} 위로 이동`}
              disabled={index === 0}
              onClick={() => changeItem("up", index)}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`${itemName} ${index + 1} 아래로 이동`}
              disabled={index === block.items.length - 1}
              onClick={() => changeItem("down", index)}
            >
              ↓
            </button>
            <button
              type="button"
              aria-label={`${itemName} ${index + 1} 삭제`}
              title={block.items.length <= minimum ? `최소 ${minimum}개는 남겨주세요.` : undefined}
              disabled={block.items.length <= minimum}
              onClick={() => changeItem("delete", index)}
            >
              삭제
            </button>
          </div>
          {block.type === "qa" && "question" in item ? (
            <>
              {field(`question-${index}`, `질문 ${index + 1}`, item.question, (value) =>
                onChange({
                  ...block,
                  items: block.items.map((entry, at) =>
                    at === index ? { ...entry, question: value } : entry,
                  ),
                }),
              )}
              {field(
                `answer-${index}`,
                `답변 ${index + 1}`,
                item.answer,
                (value) =>
                  onChange({
                    ...block,
                    items: block.items.map((entry, at) =>
                      at === index ? { ...entry, answer: value } : entry,
                    ),
                  }),
                true,
              )}
            </>
          ) : block.type === "compare" && "label" in item ? (
            <>
              {field(`label-${index}`, `항목 ${index + 1} 제목`, item.label, (value) =>
                onChange({
                  ...block,
                  items: block.items.map((entry, at) =>
                    at === index ? { ...entry, label: value } : entry,
                  ),
                }),
              )}
              {field(
                `text-${index}`,
                `항목 ${index + 1} 내용`,
                item.text,
                (value) =>
                  onChange({
                    ...block,
                    items: block.items.map((entry, at) =>
                      at === index ? { ...entry, text: value } : entry,
                    ),
                  }),
                true,
              )}
            </>
          ) : block.type === "list" && "title" in item ? (
            <>
              {field(`title-${index}`, `항목 ${index + 1} 제목`, item.title, (value) =>
                onChange({
                  ...block,
                  items: block.items.map((entry, at) =>
                    at === index ? { ...entry, title: value } : entry,
                  ),
                }),
              )}
              {field(
                `body-${index}`,
                `항목 ${index + 1} 내용`,
                item.body,
                (value) =>
                  onChange({
                    ...block,
                    items: block.items.map((entry, at) =>
                      at === index ? { ...entry, body: value } : entry,
                    ),
                  }),
                true,
              )}
            </>
          ) : null}
        </fieldset>
      ))}
      <button
        type="button"
        className={styles.addItem}
        disabled={block.items.length >= maximum}
        onClick={() => changeItem("add")}
      >
        + {itemName} 추가
      </button>
      {block.type === "compare" &&
        field("caption", "비교 설명", block.caption, (value) =>
          onChange({ ...block, caption: value }),
        )}
    </div>
  );
}

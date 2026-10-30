import {
  editorialBlockSchema,
  type EditorialBlock,
  type WorkbookReadingDocument,
} from "@/lib/content/workbook-editorial-schema";
import { findEditorialBlock } from "./selection";

// 원문을 버리는 변환은 제공하지 않는다. 사진이 있는 복합 구간은 별도 배치 도구를 사용한다.
export function blockTextParts(block: EditorialBlock): string[] {
  if ("text" in block)
    return [
      ...("label" in block && block.label ? [block.label] : []),
      ...block.text.split(/\n\s*\n/).map((part) => part.trim()),
    ].filter(Boolean);
  if (block.type === "list") return block.items.flatMap((item) => [item.title, item.body]);
  if (block.type === "qa") return block.items.flatMap((item) => [item.question, item.answer]);
  if (block.type === "compare")
    return [...block.items.flatMap((item) => [item.label, item.text]), block.caption];
  return [];
}
export type ConversionIssue = {
  code: "missing" | "photo-layout" | "add-block" | "split-text";
  message: string;
  action?: string;
};
export function getConversionIssue(
  document: WorkbookReadingDocument,
  id: string,
  type: EditorialBlock["type"],
): ConversionIssue | null {
  const source = findEditorialBlock(document, id);
  if (!source) return { code: "missing", message: "바꾸고 싶은 본문 구간을 먼저 클릭해주세요." };
  if (source.type === type) return null;
  if (source.type === "image" || source.type === "split")
    return {
      code: "photo-layout",
      message:
        "이 종류로 바꾸면 사진이 빠져요. 사진을 유지하려면 ‘사진 모양 바꾸기’를 눌러 비율이나 위치를 조정해주세요.",
      action: "사진 모양 바꾸기",
    };
  if (type === "image" || type === "split")
    return {
      code: "add-block",
      message:
        "이 글을 지우지 않고 사진을 넣을 수 있어요. 아래 버튼을 누르면 현재 구간 바로 뒤에 사진 요소가 추가됩니다.",
      action: type === "image" ? "아래에 사진 추가" : "아래에 사진과 글 추가",
    };
  if (
    type === "compare" &&
    document.content.some(
      (block) => block.type === "split" && block.content.some((child) => child.id === id),
    )
  )
    return {
      code: "add-block",
      message:
        "사진 옆 글 안에는 비교를 넣을 수 없어요. 아래 버튼을 누르면 사진 구간 바로 뒤에 비교 요소가 추가됩니다.",
      action: "사진 구간 아래에 비교 추가",
    };
  if (
    (type === "list" || type === "compare" || type === "qa") &&
    blockTextParts(source).length < 2
  ) {
    const message =
      type === "qa"
        ? "아래 입력창에 질문을 쓰고 Enter를 두 번 누른 뒤 답변을 적어주세요. 두 내용이 모두 있어야 변경할 수 있어요."
        : "내용을 2개 이상으로 나눠주세요. 아래 입력창에서 첫 내용과 다음 내용 사이에 Enter를 두 번 누르면 변경할 수 있어요.";
    return { code: "split-text", message, action: "내용 나누기" };
  }
  return null;
}
export function conversionReason(
  document: WorkbookReadingDocument,
  id: string,
  type: EditorialBlock["type"],
): string | null {
  return getConversionIssue(document, id, type)?.message ?? null;
}
export function convertEditorialBlock(
  document: WorkbookReadingDocument,
  id: string,
  type: EditorialBlock["type"],
): WorkbookReadingDocument {
  const reason = conversionReason(document, id, type);
  if (reason) throw new Error(reason);
  const source = findEditorialBlock(document, id)!;
  if (source.type === type) return structuredClone(document);
  const parts = blockTextParts(source);
  const text = parts.join("\n\n");
  const width = "width" in source ? source.width : "reading";
  const align = "align" in source ? source.align : "left";
  let candidate: unknown;
  switch (type) {
    case "text":
      candidate = { id, type, text, width, align };
      break;
    case "heading":
      candidate = { id, type, text };
      break;
    case "quote":
      candidate = { id, type, text, width, align, layout: "statement" };
      break;
    case "callout":
      candidate = { id, type, text, width, align };
      break;
    case "list": {
      const items = parts.slice(0, 8).map((body, index) => ({
        title: `항목 ${index + 1}`,
        body: index === 7 ? parts.slice(7).join("\n\n") : body,
      }));
      candidate = { id, type, items, width };
      break;
    }
    case "compare":
      candidate = {
        id,
        type,
        width: width === "reading" ? "wide" : width,
        caption: "비교",
        items: parts.slice(0, 3).map((part, index) => ({
          label: `항목 ${index + 1}`,
          text: index === 2 ? parts.slice(2).join("\n\n") : part,
        })),
      };
      break;
    case "qa":
      candidate = {
        id,
        type,
        width,
        items: [{ question: parts[0], answer: parts.slice(1).join("\n\n") }],
      };
      break;
    default:
      throw new Error("지원하지 않는 종류 변경이에요.");
  }
  const replacement = editorialBlockSchema.parse(candidate);
  const copy = structuredClone(document);
  copy.content = copy.content.map((block) => {
    if (block.id === id) return replacement;
    if (block.type === "split")
      return {
        ...block,
        content: block.content.map((child) =>
          child.id === id ? (replacement as typeof child) : child,
        ),
      };
    return block;
  });
  return copy;
}

export function replaceEditorialBlock(
  document: WorkbookReadingDocument,
  replacement: EditorialBlock,
): WorkbookReadingDocument {
  const copy = structuredClone(document);
  copy.content = copy.content.map((block) =>
    block.id === replacement.id
      ? structuredClone(replacement)
      : block.type === "split"
        ? {
            ...block,
            content: block.content.map((child) =>
              child.id === replacement.id ? (structuredClone(replacement) as typeof child) : child,
            ),
          }
        : block,
  );
  return copy;
}

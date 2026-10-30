import {
  editorialBlockSchema,
  workbookReadingSchema,
  type EditorialBlock,
  type WorkbookReadingDocument,
} from "@/lib/content/workbook-editorial-schema";
import { findEditorialBlock } from "./selection";
export function requiredFieldMessage(label: string): string {
  const last = label.at(-1) ?? "";
  const code = last.charCodeAt(0) - 0xac00;
  const hasFinal = code >= 0 && code < 11172 ? code % 28 !== 0 : "013678".includes(last);
  return `${label}${hasFinal ? "을" : "를"} 입력해주세요.`;
}
function fieldLabel(block: EditorialBlock, path: PropertyKey[]): string | null {
  const [key, index, field] = path;
  if (key === "items" && typeof index === "number") {
    if (block.type === "qa") return `${field === "question" ? "질문" : "답변"} ${index + 1}`;
    return `항목 ${index + 1} ${field === "label" || field === "title" ? "제목" : "내용"}`;
  }
  if (key === "image")
    return index === "alt" ? "사진 설명" : index === "caption" ? "사진 캡션" : null;
  if (key === "content" && typeof index === "number" && block.type === "split") {
    const child = block.content[index];
    const label = child ? fieldLabel(child, path.slice(2)) : null;
    return label ? `사진 옆 ${index + 1}번째 구간의 ${label}` : null;
  }
  if (key === "text")
    return block.type === "heading"
      ? "소제목"
      : block.type === "quote"
        ? "인용문"
        : block.type === "callout"
          ? "메모 내용"
          : "문단 내용";
  if (key === "label") return "보조 제목";
  if (key === "caption") return "비교 설명";
  return null;
}
export type InputFeedbackItem = { message: string; fieldKey?: string };
function inputKey(path: PropertyKey[]): string | undefined {
  const [key, index, field] = path;
  if (key === "items" && typeof index === "number" && typeof field === "string")
    return `${field}-${index}`;
  if (key === "image" && (index === "alt" || index === "caption")) return index;
  if (key === "text" || key === "label" || key === "caption") return key;
}
export function getBlockInputFeedback(block: EditorialBlock): InputFeedbackItem[] {
  const result = editorialBlockSchema.safeParse(block);
  if (result.success) return [];
  const feedback = result.error.issues.map((issue): InputFeedbackItem => {
    if (issue.path.length === 1 && issue.path[0] === "items")
      return {
        message:
          block.type === "compare"
            ? "비교 항목은 2~3개로 구성해주세요."
            : block.type === "qa"
              ? "문답은 1~8개로 구성해주세요."
              : "목록 항목은 2~8개로 구성해주세요.",
      };
    const label = fieldLabel(block, issue.path);
    return {
      message: label ? requiredFieldMessage(label) : "구간의 배치 설정을 확인해주세요.",
      fieldKey: inputKey(issue.path),
    };
  });
  return feedback.filter(
    (item, index) =>
      feedback.findIndex(
        (other) => other.message === item.message && other.fieldKey === item.fieldKey,
      ) === index,
  );
}
export function getBlockInputMessages(block: EditorialBlock): string[] {
  return getBlockInputFeedback(block).map((item) => item.message);
}
export function getSelectionInputMessages(document: WorkbookReadingDocument, id: string): string[] {
  if (id !== "@cover") {
    const block = findEditorialBlock(document, id);
    return block ? getBlockInputMessages(block) : ["수정할 구간을 다시 선택해주세요."];
  }
  const result = workbookReadingSchema.safeParse(document);
  if (result.success) return [];
  return [
    ...new Set(
      result.error.issues.map((issue) =>
        issue.path[0] === "displayTitle" && typeof issue.path[1] === "number"
          ? requiredFieldMessage(`제목 ${issue.path[1] + 1}번째 줄`)
          : requiredFieldMessage("글 제목"),
      ),
    ),
  ];
}

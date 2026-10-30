import type {
  EditorialBlock,
  WorkbookReadingDocument,
} from "@/lib/content/workbook-editorial-schema";
import { cloneEditorialBlock } from "./editor-state";
export type BlockOperation = "up" | "down" | "duplicate" | "delete";
function locate(document: WorkbookReadingDocument, id: string) {
  const rootIndex = document.content.findIndex((block) => block.id === id);
  if (rootIndex >= 0)
    return { siblings: document.content, index: rootIndex, limit: 80, nested: false };
  for (const block of document.content) {
    if (block.type !== "split") continue;
    const index = block.content.findIndex((child) => child.id === id);
    if (index >= 0) return { siblings: block.content, index, limit: 6, nested: true };
  }
  return null;
}
export function getBlockOperationReasons(
  document: WorkbookReadingDocument,
  id: string,
): Record<BlockOperation, string | null> {
  const location = locate(document, id);
  if (!location)
    return {
      up: "본문 구간을 선택해주세요.",
      down: "본문 구간을 선택해주세요.",
      duplicate: "본문 구간을 선택해주세요.",
      delete: "본문 구간을 선택해주세요.",
    };
  const { siblings, index, limit, nested } = location;
  return {
    up: index === 0 ? "같은 영역의 첫 구간이에요." : null,
    down: index === siblings.length - 1 ? "같은 영역의 마지막 구간이에요." : null,
    duplicate:
      siblings.length >= limit
        ? `${nested ? "사진 안에는" : "한 글에는"} 최대 ${limit}개 구간을 넣을 수 있어요.`
        : null,
    delete:
      siblings.length <= 1
        ? `${nested ? "사진 안의 글" : "본문"} 구간은 하나 이상 남겨주세요.`
        : null,
  };
}
export function operateEditorialBlock(
  document: WorkbookReadingDocument,
  id: string,
  operation: BlockOperation,
  makeId: () => string,
) {
  const reason = getBlockOperationReasons(document, id)[operation];
  if (reason) throw new Error(reason);
  const copy = structuredClone(document);
  const location = locate(copy, id)!;
  // 내부 구간도 같은 배열 안에서만 움직이거나 같은 종류로 복제한다.
  const siblings: EditorialBlock[] = location.siblings;
  const index = location.index;
  let selectedId = id;
  if (operation === "duplicate") {
    const clone = cloneEditorialBlock(siblings[index], makeId);
    siblings.splice(index + 1, 0, clone);
    selectedId = clone.id;
  } else if (operation === "delete") {
    siblings.splice(index, 1);
    selectedId = siblings[Math.min(index, siblings.length - 1)].id;
  } else {
    const target = index + (operation === "up" ? -1 : 1);
    [siblings[index], siblings[target]] = [siblings[target], siblings[index]];
  }
  return { document: copy, id: selectedId };
}

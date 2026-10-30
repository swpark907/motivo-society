import type {
  EditorialBlock,
  WorkbookReadingDocument,
} from "@/lib/content/workbook-editorial-schema";
import { createEditorialBlock } from "./editor-state";
export function insertEditorialBlock(
  document: WorkbookReadingDocument,
  afterId: string | null,
  type: EditorialBlock["type"],
  makeId: () => string,
) {
  if (document.content.length >= 80) throw new Error("한 글에는 최대 80개 구간을 넣을 수 있어요.");
  const index =
    afterId === null ? 0 : document.content.findIndex((block) => block.id === afterId) + 1;
  if (afterId !== null && index === 0)
    throw new Error("추가할 위치가 바뀌었어요. + 버튼을 다시 눌러주세요.");
  const block = createEditorialBlock(type, document, makeId);
  const copy = structuredClone(document);
  copy.content.splice(index, 0, block);
  return { document: copy, id: block.id };
}

import type { EditorialBlock, WorkbookReadingDocument } from "./workbook-editorial-schema";

export function getWorkbookReadingOutline(
  content: EditorialBlock[],
  layout: WorkbookReadingDocument["layout"],
) {
  const sections = content.flatMap((block) => {
    if (block.type === "heading") return [{ title: block.text, id: block.id }];
    if (block.type === "split")
      return block.content
        .filter((item) => item.type === "heading")
        .map((item) => ({ title: item.text, id: item.id }));
    return [];
  });
  return { sections, showToc: layout === "guide" && sections.length > 1 };
}

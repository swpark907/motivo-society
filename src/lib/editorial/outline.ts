import type {
  EditorialBlock,
  WorkbookReadingDocument,
} from "@/lib/content/workbook-editorial-schema";
import { BLOCK_LABELS } from "./selection";
import { parseEditorialInline } from "@/lib/content/workbook-editorial-inline";
export type EditorialOutlineEntry = {
  id: string;
  position: string;
  label: string;
  summary: string;
  searchText: string;
  depth: number;
};
function summary(block: EditorialBlock): string {
  if ("text" in block) return block.text;
  if (block.type === "compare") return block.items.map((item) => item.label).join(" · ");
  if (block.type === "qa") return block.items.map((item) => item.question).join(" · ");
  if (block.type === "list") return block.items.map((item) => item.title).join(" · ");
  return block.image.caption;
}
function plain(value: string) {
  return parseEditorialInline(value)
    .map((token) => token.text)
    .join("")
    .replace(/\s+/g, " ");
}
function searchable(block: EditorialBlock): string {
  if ("text" in block) return `${"label" in block ? (block.label ?? "") : ""} ${block.text}`;
  if (block.type === "compare")
    return `${block.caption} ${block.items.map((item) => `${item.label} ${item.text}`).join(" ")}`;
  if (block.type === "qa")
    return block.items.map((item) => `${item.question} ${item.answer}`).join(" ");
  if (block.type === "list")
    return block.items.map((item) => `${item.title} ${item.body}`).join(" ");
  return `${block.image.alt} ${block.image.caption} ${block.type === "split" ? block.content.map(searchable).join(" ") : ""}`;
}
export function getEditorialOutline(document: WorkbookReadingDocument): EditorialOutlineEntry[] {
  return [
    {
      id: "@cover",
      position: "표지",
      label: "표지",
      summary: plain(document.displayTitle?.join(" ") ?? document.title).slice(0, 90),
      searchText: plain(
        `${document.title} ${document.displayTitle?.join(" ") ?? ""} ${document.deck ?? document.summary}`,
      ),
      depth: 0,
    },
    ...document.content.flatMap((block, index) => {
      const root = {
        id: block.id,
        position: `${index + 1}번째 구간`,
        label: BLOCK_LABELS[block.type],
        summary: plain(summary(block)).slice(0, 90),
        searchText: plain(searchable(block)),
        depth: 0,
      };
      return block.type === "split"
        ? [
            root,
            ...block.content.map((child, at) => ({
              id: child.id,
              position: `${index + 1}-${at + 1}번째 구간`,
              label: BLOCK_LABELS[child.type],
              summary: plain(summary(child)).slice(0, 90),
              searchText: plain(searchable(child)),
              depth: 1,
            })),
          ]
        : [root];
    }),
  ];
}

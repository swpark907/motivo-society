import { expect, it } from "vitest";
import { getWorkbookReadings } from "@/lib/content/workbook-readings";
import { validateEditorialDraft } from "./editor-state";
import { insertEditorialBlock } from "./block-insertion";
it("처음·중간·끝에 모든 종류를 넣어도 기존 구간과 원본을 보존한다", async () => {
  const documents = await getWorkbookReadings();
  const source = documents[0];
  const original = structuredClone(source);
  let serial = 0;
  for (const afterId of [null, source.content[0].id, source.content.at(-1)!.id])
    for (const type of [
      "text",
      "quote",
      "compare",
      "list",
      "callout",
      "qa",
      "heading",
      "image",
      "split",
    ] as const) {
      const result = insertEditorialBlock(source, afterId, type, () => `new-${++serial}`);
      expect(validateEditorialDraft(result.document, documents, source.slug).ok).toBe(true);
      expect(result.document.content.filter((block) => block.id !== result.id)).toEqual(
        source.content,
      );
      const index =
        afterId === null ? 0 : source.content.findIndex((block) => block.id === afterId) + 1;
      expect(result.document.content[index].id).toBe(result.id);
    }
  expect(source).toEqual(original);
  expect(() => insertEditorialBlock(source, "gone", "text", () => "new-block")).toThrow(
    "위치가 바뀌었어요",
  );
});

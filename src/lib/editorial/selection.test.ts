import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { workbookReadingSchema } from "@/lib/content/workbook-editorial-schema";
import { applySelectionOption, applySelectionText, getSelectionGroups } from "./selection";
const documents = fs
  .readdirSync("content/drafts/workbook")
  .filter((name) => name.endsWith(".json"))
  .map((name) =>
    workbookReadingSchema.parse(
      JSON.parse(fs.readFileSync(`content/drafts/workbook/${name}`, "utf8")),
    ),
  );
describe("미리보기 구간 편집", () => {
  it("제공하는 배치 변경은 유효한 문서와 기존 ID를 유지한다", () => {
    for (const document of documents) {
      const ids = [
        "@cover",
        ...document.content.flatMap((block) =>
          block.type === "split"
            ? [block.id, ...block.content.map((child) => child.id)]
            : [block.id],
        ),
      ];
      const original = JSON.stringify(document);
      for (const id of ids)
        for (const group of getSelectionGroups(document, id))
          for (const [value] of group.options) {
            const next = applySelectionOption(document, id, group.key, value);
            expect(workbookReadingSchema.safeParse(next).success).toBe(true);
            expect(next.content.map((block) => block.id)).toEqual(
              document.content.map((block) => block.id),
            );
          }
      expect(JSON.stringify(document)).toBe(original);
    }
  });
  it("허용하지 않은 속성 변경은 거부하고 문구 수정은 선택한 곳에만 적용한다", () => {
    const document = documents[0];
    expect(() => applySelectionOption(document, "@cover", "slug", "other")).toThrow();
    const next = applySelectionText(document, "@cover", "바꾼 제목");
    expect(next.slug).toBe(document.slug);
    expect(next.content).toEqual(document.content);
    expect(document.title).not.toBe("바꾼 제목");
  });
});

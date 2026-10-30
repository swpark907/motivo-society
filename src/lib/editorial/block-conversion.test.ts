import { expect, it } from "vitest";
import { getWorkbookReadings } from "@/lib/content/workbook-readings";
import { workbookReadingSchema } from "@/lib/content/workbook-editorial-schema";
import { blockTextParts, conversionReason, convertEditorialBlock } from "./block-conversion";
import { findEditorialBlock } from "./selection";

it("종류를 바꿔도 기존 문장과 ID를 보존하고 원본을 수정하지 않는다", async () => {
  const documents = await getWorkbookReadings();
  const source = documents[0];
  const original = structuredClone(source);
  const comparison = source.content.find((block) => block.type === "compare")!;
  for (const type of ["text", "heading", "quote", "list", "qa", "callout"] as const) {
    const changed = convertEditorialBlock(source, comparison.id, type);
    expect(workbookReadingSchema.safeParse(changed).success).toBe(true);
    const target = findEditorialBlock(changed, comparison.id)!;
    const result = blockTextParts(target).join("\n");
    for (const part of blockTextParts(comparison)) expect(result).toContain(part);
    expect(target.id).toBe(comparison.id);
  }
  expect(source).toEqual(original);
});
it("사진 소실과 비교 재료 부족을 차단하고 내부 문단을 안전하게 전환한다", async () => {
  const documents = await getWorkbookReadings();
  const source = documents[1];
  const split = source.content.find((block) => block.type === "split")!;
  expect(() => convertEditorialBlock(source, split.id, "text")).toThrow();
  expect(conversionReason(source, split.content[0].id, "compare")).toBeTruthy();
  const changed = convertEditorialBlock(source, split.content[0].id, "callout");
  expect(workbookReadingSchema.safeParse(changed).success).toBe(true);
  expect(
    changed.content.find((block) => block.id === split.id && block.type === "split"),
  ).toMatchObject({ image: split.image });
  expect(() => convertEditorialBlock(documents[0], "block-1", "compare")).toThrow("내용을 2개");
});

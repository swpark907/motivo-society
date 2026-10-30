import { expect, it } from "vitest";
import { getWorkbookReadings } from "@/lib/content/workbook-readings";
import {
  validateWorkbookReadingReferences,
  workbookReadingSchema,
} from "@/lib/content/workbook-editorial-schema";
import { getBlockOperationReasons, operateEditorialBlock } from "./block-operations";

it("moves siblings, duplicates split descendants with new identities and deletes without changing the source", async () => {
  const documents = await getWorkbookReadings();
  const source = documents[1];
  const before = structuredClone(source);
  const split = source.content.find((block) => block.type === "split")!;
  let serial = 0;
  const result = operateEditorialBlock(source, split.id, "duplicate", () => `copy-${++serial}`);
  const index = source.content.findIndex((block) => block.id === split.id);
  const clone = result.document.content[index + 1];
  expect(result.id).toBe(clone.id);
  expect(clone).toMatchObject({ type: "split", image: split.image });
  expect(clone.id).not.toBe(split.id);
  if (clone.type !== "split") throw new Error("Expected split");
  expect(clone.content.map((block) => block.id)).not.toEqual(
    split.content.map((block) => block.id),
  );
  expect(workbookReadingSchema.safeParse(result.document).success).toBe(true);
  expect(() =>
    validateWorkbookReadingReferences(
      documents.map((doc) => (doc.slug === source.slug ? result.document : doc)),
    ),
  ).not.toThrow();
  const moved = operateEditorialBlock(result.document, clone.id, "up", () => "unused");
  expect(moved.document.content[index].id).toBe(clone.id);
  expect(operateEditorialBlock(moved.document, clone.id, "down", () => "unused").document).toEqual(
    result.document,
  );
  const deleted = operateEditorialBlock(result.document, clone.id, "delete", () => "unused");
  expect(deleted.document).toEqual(source);
  expect(deleted.id).toBe(source.content[index + 1]?.id ?? split.id);
  expect(source).toEqual(before);
});

it("keeps nested operations inside the parent and guards minimum and maximum sibling counts", async () => {
  const source = (await getWorkbookReadings())[1];
  const parent = source.content.find((block) => block.type === "split")!;
  const first = parent.content[0];
  let serial = 0;
  const duplicate = operateEditorialBlock(
    source,
    first.id,
    "duplicate",
    () => `nested-${++serial}`,
  );
  const copiedParent = duplicate.document.content.find((block) => block.id === parent.id)!;
  if (copiedParent.type !== "split") throw new Error("Expected split");
  expect(copiedParent.content.length).toBe(parent.content.length + 1);
  expect(duplicate.document.content.length).toBe(source.content.length);
  const moved = operateEditorialBlock(duplicate.document, duplicate.id, "up", () => "unused");
  const movedParent = moved.document.content.find((block) => block.id === parent.id)!;
  expect(movedParent.type === "split" && movedParent.content[0].id).toBe(duplicate.id);
  const single = { ...source, content: [{ ...parent, content: [first] }] };
  expect(() => operateEditorialBlock(single, parent.id, "delete", () => "unused")).toThrow(
    "하나 이상",
  );
  expect(() => operateEditorialBlock(single, first.id, "delete", () => "unused")).toThrow(
    "하나 이상",
  );
  expect(() => operateEditorialBlock(single, first.id, "up", () => "unused")).toThrow("첫 구간");
  expect(() => operateEditorialBlock(single, first.id, "down", () => "unused")).toThrow(
    "마지막 구간",
  );
  const full = {
    ...single,
    content: [
      {
        ...parent,
        content: Array.from({ length: 6 }, (_, index) => ({ ...first, id: `child-${index}` })),
      },
    ],
  };
  expect(getBlockOperationReasons(full, "child-0").duplicate).toContain("최대 6개");
  const fullRoot = {
    ...source,
    content: Array.from({ length: 80 }, (_, index) => ({ ...first, id: `root-${index}` })),
  };
  expect(() => operateEditorialBlock(fullRoot, "root-0", "duplicate", () => "unused")).toThrow(
    "최대 80개",
  );
  expect(() => operateEditorialBlock(source, "@cover", "delete", () => "unused")).toThrow(
    "본문 구간",
  );
  expect(() => operateEditorialBlock(source, "missing", "up", () => "unused")).toThrow("본문 구간");
});

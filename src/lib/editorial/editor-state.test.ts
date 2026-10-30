import { expect, it } from "vitest";
import { getWorkbookReadings } from "@/lib/content/workbook-readings";
import {
  cloneEditorialBlock,
  createEditorialBlock,
  moveEditorialBlock,
  validateEditorialDraft,
} from "./editor-state";

it("moves blocks without changing identities and gives cloned split children fresh ids", async () => {
  const entries = await getWorkbookReadings();
  const sample = entries[1];
  const before = structuredClone(sample);
  const moved = moveEditorialBlock(sample, sample.content[1].id, -1);
  expect(moved.content[0]).toEqual(sample.content[1]);
  expect(sample).toEqual(before);
  const split = sample.content.find((block) => block.type === "split")!;
  let serial = 0;
  const clone = cloneEditorialBlock(split, () => `copy-${++serial}`);
  expect(clone.id).not.toBe(split.id);
  expect(clone.type === "split" && clone.content[0].id).not.toBe(split.content[0].id);
  expect(
    validateEditorialDraft({ ...sample, content: [...sample.content, clone] }, entries, sample.slug)
      .ok,
  ).toBe(true);
});
it("creates all supported blocks as valid editable documents", async () => {
  const entries = await getWorkbookReadings();
  let serial = 0;
  for (const type of [
    "text",
    "heading",
    "image",
    "quote",
    "list",
    "compare",
    "split",
    "callout",
    "qa",
  ] as const) {
    const block = createEditorialBlock(type, entries[0], () => `new-${++serial}`);
    expect(
      validateEditorialDraft(
        { ...entries[0], content: [...entries[0].content, block] },
        entries,
        entries[0].slug,
      ).ok,
    ).toBe(true);
  }
});
it("rejects invalid edits and identity changes before preview or export", async () => {
  const entries = await getWorkbookReadings();
  const sample = entries[0];
  expect(validateEditorialDraft({ ...sample, title: "" }, entries, sample.slug).ok).toBe(false);
  expect(
    validateEditorialDraft(
      { ...sample, thumbnail: "/images/workbook/notes/missing.png" },
      entries,
      sample.slug,
    ).ok,
  ).toBe(false);
  expect(validateEditorialDraft({ ...sample, slug: "changed" }, entries, sample.slug).ok).toBe(
    false,
  );
  expect(
    validateEditorialDraft(
      { ...sample, content: [sample.content[0], sample.content[0]] },
      entries,
      sample.slug,
    ).ok,
  ).toBe(false);
  expect(
    validateEditorialDraft(
      { ...sample, related: [{ slug: "missing", reason: "없는 글" }] },
      entries,
      sample.slug,
    ).ok,
  ).toBe(false);
});

it("validates new documents against a separate trusted asset catalog", async () => {
  const entries = await getWorkbookReadings();
  const fresh = { ...structuredClone(entries[0]), slug: "new-article", related: [] };
  expect(validateEditorialDraft(fresh, [...entries, fresh], fresh.slug, entries).ok).toBe(true);
  const invalid = { ...fresh, thumbnail: "/images/workbook/notes/missing.png" };
  expect(validateEditorialDraft(invalid, [...entries, invalid], invalid.slug, entries).ok).toBe(
    false,
  );
  expect(
    validateEditorialDraft(
      { ...fresh, related: [{ slug: "missing-article", reason: "함께 읽기" }] },
      [...entries, fresh],
      fresh.slug,
      entries,
    ).ok,
  ).toBe(false);
});

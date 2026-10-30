import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getWorkbookReadings, workbookReadingSchema } from "./workbook-readings";
import { validateWorkbookReadingReferences } from "./workbook-editorial-schema";

describe("editorial document v1", () => {
  it("keeps the AI-readable JSON Schema synchronized with the runtime validator", async () => {
    const artifact = JSON.parse(
      await fs.readFile("content/schemas/workbook-editorial-v1.schema.json", "utf8"),
    );
    expect(artifact).toEqual(z.toJSONSchema(workbookReadingSchema));
  });
  it("loads six documents with stable slugs, real images and explicit reading connections", async () => {
    const entries = await getWorkbookReadings();
    expect(entries.map((entry) => entry.slug)).toEqual([
      "describe-the-result",
      "show-the-screen",
      "leave-a-handoff",
      "report-the-error",
      "check-the-source",
      "test-the-awkward-cases",
    ]);
    expect(entries.find((entry) => entry.slug === "show-the-screen")).toMatchObject({
      version: 1,
      cover: { layout: "split" },
      displayTitle: ["어디가", "이상한가요?"],
    });
    for (const entry of entries) {
      await fs.access(path.join(process.cwd(), "public", entry.thumbnail));
      for (const block of entry.content) {
        if (block.type === "image" || block.type === "split")
          await fs.access(path.join(process.cwd(), "public", block.image.src));
      }
      expect(entry.related).toHaveLength(2);
    }
  });
  it("rejects unknown versions, arbitrary styling, executable blocks and unsupported nesting", async () => {
    const entry = (await getWorkbookReadings())[0];
    expect(workbookReadingSchema.safeParse({ ...entry, version: 2 }).success).toBe(false);
    expect(workbookReadingSchema.safeParse({ ...entry, style: "color:red" }).success).toBe(false);
    expect(
      workbookReadingSchema.safeParse({ ...entry, cover: { ...entry.cover, layout: "custom" } })
        .success,
    ).toBe(false);
    expect(
      workbookReadingSchema.safeParse({
        ...entry,
        content: [{ type: "html", id: "html", html: "<script />" }],
      }).success,
    ).toBe(false);
    const split = (await getWorkbookReadings())[1].content.find((block) => block.type === "split")!;
    expect(
      workbookReadingSchema.safeParse({ ...entry, content: [{ ...split, content: [split] }] })
        .success,
    ).toBe(false);
    expect(
      workbookReadingSchema.safeParse({
        ...entry,
        content: [
          { ...split, image: { ...split.image, src: "https://unapproved.example/image.png" } },
        ],
      }).success,
    ).toBe(false);
  });
  it("rejects missing recommendations and duplicate block ids across nested layouts", async () => {
    const entries = await getWorkbookReadings();
    const wrongReference = structuredClone(entries);
    wrongReference[0].related[0].slug = "missing";
    expect(() => validateWorkbookReadingReferences(wrongReference)).toThrow(
      "Invalid related reading",
    );
    const duplicate = structuredClone(entries);
    const split = duplicate[1].content.find((block) => block.type === "split")!;
    split.content[0].id = duplicate[1].content[0].id;
    expect(() => validateWorkbookReadingReferences(duplicate)).toThrow("Duplicate block id");
  });
});

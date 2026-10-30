import { expect, it } from "vitest";
import { workbookReadingSchema } from "./workbook-editorial-schema";
import { getWorkbookReadings } from "./workbook-readings";
import { getWorkbookReadingOutline } from "./workbook-reading-outline";

it("uses explicit heading blocks for guide outlines, including headings in a split", async () => {
  const sample = (await getWorkbookReadings())[1];
  const split = sample.content.find((block) => block.type === "split")!;
  const content = workbookReadingSchema.parse({
    ...sample,
    content: [
      { type: "text", id: "example", text: "## 제목처럼 보이는 문자열" },
      { type: "heading", id: "prepare", text: "준비" },
      { ...split, content: [{ type: "heading", id: "run", text: "실행" }] },
    ],
  }).content;
  expect(getWorkbookReadingOutline(content, "guide")).toEqual({
    sections: [
      { title: "준비", id: "prepare" },
      { title: "실행", id: "run" },
    ],
    showToc: true,
  });
  expect(getWorkbookReadingOutline(content, "note").showToc).toBe(false);
  expect(getWorkbookReadingOutline(content, "feature").showToc).toBe(false);
  expect(getWorkbookReadingOutline(content.slice(0, 2), "guide").showToc).toBe(false);
});

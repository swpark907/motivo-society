import { expect, it } from "vitest";
import { getWorkbookReadings } from "@/lib/content/workbook-readings";
import { getEditorialOutline } from "./outline";
it("numbers root and nested blocks by current order while preserving their identity", async () => {
  const samples = await getWorkbookReadings();
  const sample = samples.find((entry) => entry.content.some((block) => block.type === "split"))!;
  const original = JSON.stringify(sample);
  const entries = getEditorialOutline(sample);
  expect(entries[0].id).toBe("@cover");
  sample.content.forEach((block, index) => {
    expect(entries.find((entry) => entry.id === block.id)?.position).toBe(`${index + 1}번째 구간`);
    if (block.type === "split")
      block.content.forEach((child, at) => {
        expect(entries.find((entry) => entry.id === child.id)).toMatchObject({
          position: `${index + 1}-${at + 1}번째 구간`,
          depth: 1,
        });
      });
  });
  const reversed = getEditorialOutline({ ...sample, content: [...sample.content].reverse() });
  expect(reversed.find((entry) => entry.id === sample.content[0].id)?.position).toBe(
    `${sample.content.length}번째 구간`,
  );
  expect(JSON.stringify(sample)).toBe(original);
});
it("makes plain searchable excerpts without formatting or link destinations", async () => {
  const [sample] = await getWorkbookReadings();
  const entries = getEditorialOutline({
    ...sample,
    content: [
      {
        id: "test-text",
        type: "text",
        text: "**강조**와 [출처](https://example.com)\n다음 줄",
        tone: "body",
        align: "left",
        width: "reading",
      },
    ],
  });
  expect(entries[1].summary).toBe("강조와 출처 다음 줄");
});

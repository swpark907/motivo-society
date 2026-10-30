import fs from "node:fs/promises";
import path from "node:path";
import {
  workbookReadingSchema,
  validateWorkbookReadingReferences,
  type WorkbookReadingDocument,
} from "./workbook-editorial-schema";
export { workbookReadingSchema } from "./workbook-editorial-schema";

// 사용자 승인 테스트 프리뷰. 정식 Article의 발행·검증 파이프라인은 유지한다.
export type WorkbookReadingSummary = Pick<
  WorkbookReadingDocument,
  "slug" | "title" | "summary" | "thumbnail" | "thumbnailAlt" | "visualCaption" | "tags" | "sources"
>;
export async function getWorkbookReadings() {
  const dir = path.join(process.cwd(), "content/drafts/workbook");
  const files = (await fs.readdir(dir)).filter((file) => file.endsWith(".json")).sort();
  const readings = await Promise.all(
    files.map(async (file) => {
      const parsed = workbookReadingSchema.safeParse(
        JSON.parse(await fs.readFile(path.join(dir, file), "utf8")),
      );
      if (!parsed.success)
        throw new Error(`Invalid editorial document ${file}: ${parsed.error.message}`);
      return parsed.data;
    }),
  );
  validateWorkbookReadingReferences(readings);
  return readings;
}
export async function getWorkbookReading(slug: string) {
  return (await getWorkbookReadings()).find((entry) => entry.slug === slug) ?? null;
}

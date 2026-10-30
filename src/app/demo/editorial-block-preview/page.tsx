import { notFound } from "next/navigation";
import { BlockPreviewCanvas } from "@/components/ArticleEditor/BlockPreviewCanvas";
import { getWorkbookReadings } from "@/lib/content/workbook-readings";
export const metadata = { title: "구간 미리보기", robots: { index: false, follow: false } };
export default async function BlockPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <BlockPreviewCanvas documents={await getWorkbookReadings()} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialPreview } from "@/components/ArticleEditor/EditorialPreview";
import { getWorkbookReadings } from "@/lib/content/workbook-readings";
export const metadata: Metadata = {
  title: "아티클 미리보기",
  robots: { index: false, follow: false },
};
export default async function AdminPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <EditorialPreview documents={await getWorkbookReadings()} />;
}

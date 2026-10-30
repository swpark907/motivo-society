import type { Metadata } from "next";
import { getWorkbookReadings } from "@/lib/content/workbook-readings";
import { WorkbookHome } from "@/components/WorkbookHome/WorkbookHome";
export const metadata: Metadata = {
  title: "Workbook",
  description: "작은 실천을 나만의 배움으로. 모쏘와 함께 배우고 만들고 기록하는 공간.",
};
export default async function WorkbookPage() {
  const readings = (await getWorkbookReadings()).map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    summary: entry.summary,
    thumbnail: entry.thumbnail,
    thumbnailAlt: entry.thumbnailAlt,
    visualCaption: entry.visualCaption,
    tags: entry.tags,
    sources: entry.sources,
  }));
  return <WorkbookHome readings={readings} />;
}

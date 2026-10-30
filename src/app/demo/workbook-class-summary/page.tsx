import type { Metadata } from "next";
import { WorkbookClassSummaryPreview } from "@/components/WorkbookClass/WorkbookClassSummaryPreview";
export const metadata: Metadata = {
  title: "클래스 정리 검토 · Workbook",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <WorkbookClassSummaryPreview />;
}

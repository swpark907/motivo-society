import type { Metadata } from "next";
import { WorkbookMapPointsReview } from "@/components/WorkbookClass/WorkbookMapPointsReview";
export const metadata: Metadata = {
  title: "지도 지점 검토 · Workbook",
  robots: { index: false, follow: false },
};
export default function MapPointsReview() {
  return <WorkbookMapPointsReview />;
}

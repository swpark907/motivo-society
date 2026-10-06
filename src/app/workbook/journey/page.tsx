import type { Metadata } from "next";
import { WorkbookJourney } from "@/components/WorkbookJourney/WorkbookJourney";
export const metadata: Metadata = {
  title: "작은 화면, 새로운 발견 | Workbook",
  description: "카피바라와 작은 웹의 마을을 탐험하며 반응형 화면을 직접 고쳐보세요.",
};
export default function JourneyPage() {
  return <WorkbookJourney />;
}

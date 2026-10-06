import type { Metadata } from "next";
import { WorkbookHome } from "@/components/WorkbookHome/WorkbookHome";
export const metadata: Metadata = {
  title: "Workbook",
  description: "작은 실천을 나만의 배움으로. 모쏘와 함께 배우고 만들고 기록하는 공간.",
};
export default function WorkbookPage() {
  return <WorkbookHome />;
}

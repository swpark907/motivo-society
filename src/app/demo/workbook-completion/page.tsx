import type { Metadata } from "next";
import { WorkbookCompletionPreview } from "@/components/WorkbookClass/WorkbookCompletionPreview";

export const metadata: Metadata = {
  title: "단원 완료 화면 테스트 · Workbook",
  robots: { index: false, follow: false },
};
export default function CompletionPreviewPage() {
  return <WorkbookCompletionPreview />;
}

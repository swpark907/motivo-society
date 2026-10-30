import type { Metadata } from "next";
import { WorkbookClassNavigationPreview } from "@/components/WorkbookClass/WorkbookClassNavigationPreview";
export const metadata: Metadata = {
  title: "클래스 이동 검토",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <WorkbookClassNavigationPreview />;
}

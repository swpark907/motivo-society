import type { Metadata } from "next";
import { getWorkbookReadings } from "@/lib/content/workbook-readings";
import { WorkbookProgressProvider } from "@/components/WorkbookClass/WorkbookProgressContext";
import { WorkbookHome } from "@/components/WorkbookHome/WorkbookHome";
export const metadata: Metadata = {
  title: "워크북 홈 · 작업실 추가 시안",
  robots: { index: false, follow: false },
};
// 기존 홈 콘텐츠를 그대로 재사용하고 새 기능만 더한다. 비교용 화면도 같은 컴포넌트를 사용한다.
export default async function WorkbookHomeNextPage() {
  const readings = await getWorkbookReadings();
  return (
    <WorkbookProgressProvider>
      <WorkbookHome readings={readings} showWorkspaceStudies />
    </WorkbookProgressProvider>
  );
}

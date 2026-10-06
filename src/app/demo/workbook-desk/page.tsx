import type { Metadata } from "next";
import { DeskDemo } from "@/components/DeskDemo/DeskDemo";

export const metadata: Metadata = {
  title: "카피바라의 책상 정리 · Workbook Demo",
  description: "방향과 간격, 정렬을 직접 바꾸며 CSS Flex를 발견하는 작은 실험.",
  robots: { index: false, follow: false },
};

export default function DeskDemoPage() {
  return <DeskDemo />;
}

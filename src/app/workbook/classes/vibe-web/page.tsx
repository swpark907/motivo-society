import type { Metadata } from "next";
import { WorkbookClass } from "@/components/WorkbookClass/WorkbookClass";

export const metadata: Metadata = {
  title: "바이브코딩 웹개발 클래스 | Workbook",
  description: "카피바라와 아이디어를 첫 화면으로. 만들고 확인하며 익히는 웹 제작 여정.",
};

export default function Page() {
  return <WorkbookClass />;
}

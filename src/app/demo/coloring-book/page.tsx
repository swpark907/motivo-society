import type { Metadata } from "next";
import { ColoringDemo } from "@/components/ColoringDemo/ColoringDemo";

export const metadata: Metadata = {
  title: "비밀 정원 · 컬러링 실험",
  description: "정원의 작은 칸에 색을 채우며 머무는 컬러링 북 실험.",
  robots: { index: false, follow: false },
};

export default function ColoringBookPage() {
  return <ColoringDemo />;
}

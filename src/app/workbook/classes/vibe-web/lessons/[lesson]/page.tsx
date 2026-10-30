import { notFound } from "next/navigation";
import { WorkbookClass } from "@/components/WorkbookClass/WorkbookClass";
import { workbookLessonRoutes } from "@/lib/workbook-lesson-routes";

export const metadata = { title: "웹개발 기초 수업 | Workbook" };
export default async function Page({
  params,
}: PageProps<"/workbook/classes/vibe-web/lessons/[lesson]">) {
  const { lesson } = await params;
  if (!workbookLessonRoutes.some((route) => route.slug === lesson)) notFound();
  return <WorkbookClass />;
}

import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/ArticleEditor/ArticleEditor";
import { getWorkbookReadings } from "@/lib/content/workbook-readings";
export default async function AdminArticleLabPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <ArticleEditor documents={await getWorkbookReadings()} />;
}

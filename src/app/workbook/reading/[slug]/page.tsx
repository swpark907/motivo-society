import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWorkbookReading, getWorkbookReadings } from "@/lib/content/workbook-readings";
import { WorkbookReading } from "@/components/WorkbookReading/WorkbookReading";

export async function generateStaticParams() {
  return (await getWorkbookReadings()).map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: PageProps<"/workbook/reading/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getWorkbookReading(slug);
  if (!article) return {};
  return {
    title: `${article.title} · 테스트 글`,
    description: article.summary,
    robots: { index: false, follow: false },
    openGraph: {
      title: article.title,
      description: article.summary,
      images: [article.thumbnail],
    },
  };
}
export default async function WorkbookReadingPage({
  params,
}: PageProps<"/workbook/reading/[slug]">) {
  const { slug } = await params;
  const article = await getWorkbookReading(slug);
  if (!article) notFound();
  const readings = await getWorkbookReadings();
  const related = article.related.map(({ slug: relatedSlug, reason }) => ({
    ...readings.find((entry) => entry.slug === relatedSlug)!,
    reason,
  }));
  return <WorkbookReading article={article} related={related} />;
}

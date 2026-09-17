import { z } from "zod";
import { createCollection, type Entry } from "./collection";

// access는 지금은 전부 public. member/paid는 노출 정책이 확정될 때 쓴다 (자리만 남김).
export const articleFrontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  publishedAt: z.iso.date(),
  // 검증 장치: 다루는 내용을 직접 확인한 날짜와 근거. 없으면 빌드가 실패한다 (AGENTS.md 콘텐츠 발행 워크플로우).
  verifiedAt: z.iso.date(),
  sources: z.array(z.url()),
  tags: z.array(z.string()).default([]),
  access: z.enum(["public", "member", "paid"]).default("public"),
});

export type Article = Entry<z.infer<typeof articleFrontmatterSchema>>;

const collection = createCollection("articles", articleFrontmatterSchema);
const byNewest = (a: Article, b: Article) => b.publishedAt.localeCompare(a.publishedAt);

export const parseArticle = collection.parse;
export const getArticleSlugs = collection.slugs;
export const getArticle = collection.get;
export const getAllArticles = () => collection.all(byNewest);

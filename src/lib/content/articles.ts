import { z } from "zod";
import { createCollection, type Entry } from "./collection";

// access는 지금은 전부 public. member/paid는 노출 정책이 확정될 때 쓴다 (자리만 남김).
export const articleFrontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  publishedAt: z.iso.date(),
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

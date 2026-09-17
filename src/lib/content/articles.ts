import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

export const ARTICLES_DIR = path.join(process.cwd(), "content/articles");

// access는 지금은 전부 public. member/paid는 노출 정책이 확정될 때 쓴다 (자리만 남김).
export const articleFrontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  publishedAt: z.iso.date(),
  tags: z.array(z.string()).default([]),
  access: z.enum(["public", "member", "paid"]).default("public"),
});

export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>;

export type Article = ArticleFrontmatter & {
  slug: string;
  content: string;
};

export function parseArticle(slug: string, raw: string): Article {
  const { data, content } = matter(raw);
  const parsed = articleFrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid frontmatter in ${slug}.mdx: ${parsed.error.message}`);
  }
  return { ...parsed.data, slug, content };
}

export async function getArticleSlugs(dir = ARTICLES_DIR): Promise<string[]> {
  const entries = await fs.readdir(dir);
  return entries.filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, ""));
}

export async function getArticle(slug: string, dir = ARTICLES_DIR): Promise<Article | null> {
  try {
    const raw = await fs.readFile(path.join(dir, `${slug}.mdx`), "utf8");
    return parseArticle(slug, raw);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function getAllArticles(dir = ARTICLES_DIR): Promise<Article[]> {
  const slugs = await getArticleSlugs(dir);
  const articles = await Promise.all(slugs.map((s) => getArticle(s, dir)));
  return articles
    .filter((a): a is Article => a !== null)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

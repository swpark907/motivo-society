import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { z } from "zod";

type Frontmatter = Record<string, unknown>;

// content/<dir>/*.mdx 컬렉션 공용 로더. 각 컬렉션은 스키마만 정의한다.
export type Entry<T> = T & { slug: string; content: string };

export function createCollection<T extends Frontmatter>(dirName: string, schema: z.ZodType<T>) {
  const dir = path.join(process.cwd(), "content", dirName);

  function parse(slug: string, raw: string): Entry<T> {
    const { data, content } = matter(raw);
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      throw new Error(
        `Invalid frontmatter in content/${dirName}/${slug}.mdx: ${parsed.error.message}`,
      );
    }
    return { ...parsed.data, slug, content };
  }

  async function slugs(): Promise<string[]> {
    try {
      const entries = await fs.readdir(dir);
      return entries.filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, ""));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
  }

  async function get(slug: string): Promise<Entry<T> | null> {
    try {
      const raw = await fs.readFile(path.join(dir, `${slug}.mdx`), "utf8");
      return parse(slug, raw);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }

  async function all(sort?: (a: Entry<T>, b: Entry<T>) => number): Promise<Entry<T>[]> {
    const list: (Entry<T> | null)[] = await Promise.all((await slugs()).map(get));
    const entries = list.filter((e): e is Entry<T> => e !== null);
    return sort ? entries.sort(sort) : entries;
  }

  return { dir, parse, slugs, get, all };
}

import { z } from "zod";
import { createCollection, type Entry } from "./collection";

// Library 카테고리 — 홈 Library 섹션의 카드이자 /library 의 묶음 단위.
// ※ 초안. 이름·개수는 콘텐츠가 쌓이면서 조정한다. id는 URL 앵커로 쓰이므로 바꾸지 않는다.
export const LIBRARY_CATEGORIES = [
  {
    id: "ai",
    title: ["AI", "활용법"],
    label: "AI Usage",
    description: "Claude·ChatGPT를 일에 붙이는 법",
  },
  {
    id: "skills",
    title: ["스킬 &", "프롬프트"],
    label: "Skills & Prompts",
    description: "직접 돌려본 스킬과 프롬프트",
  },
  {
    id: "vibe-coding",
    title: ["바이브", "코딩"],
    label: "Vibe Coding",
    description: "말로 만들고 고치는 개발",
  },
  {
    id: "tools",
    title: ["유용한", "웹 & 앱"],
    label: "Web & Apps",
    description: "발견한 도구와 사이트",
  },
] as const;

export type LibraryCategoryId = (typeof LIBRARY_CATEGORIES)[number]["id"];
const categoryIds = LIBRARY_CATEGORIES.map((c) => c.id) as [
  LibraryCategoryId,
  ...LibraryCategoryId[],
];

export const libraryFrontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  publishedAt: z.iso.date(),
  category: z.enum(categoryIds),
  tags: z.array(z.string()).default([]),
  access: z.enum(["public", "member", "paid"]).default("public"),
});

export type LibraryItem = Entry<z.infer<typeof libraryFrontmatterSchema>>;

const collection = createCollection("library", libraryFrontmatterSchema);
const byNewest = (a: LibraryItem, b: LibraryItem) => b.publishedAt.localeCompare(a.publishedAt);

export const parseLibraryItem = collection.parse;
export const getLibrarySlugs = collection.slugs;
export const getLibraryItem = collection.get;
export const getAllLibraryItems = () => collection.all(byNewest);

export function getCategory(id: string) {
  return LIBRARY_CATEGORIES.find((c) => c.id === id) ?? null;
}

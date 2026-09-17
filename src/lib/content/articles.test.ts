import { getAllArticles, parseArticle } from "./articles";

describe("parseArticle", () => {
  it("applies defaults for tags and access", () => {
    const a = parseArticle("x", `---\ntitle: T\nsummary: S\npublishedAt: "2026-09-17"\n---\nbody`);
    expect(a).toMatchObject({ slug: "x", tags: [], access: "public", content: "body" });
  });

  it("rejects missing required fields", () => {
    expect(() => parseArticle("x", `---\ntitle: T\n---\n`)).toThrow(/Invalid frontmatter/);
  });
});

describe("content/articles", () => {
  it("every committed article has valid frontmatter", async () => {
    const all = await getAllArticles();
    expect(all.length).toBeGreaterThan(0);
  });
});

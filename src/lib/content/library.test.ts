import { LIBRARY_CATEGORIES, getAllLibraryItems, parseLibraryItem } from "./library";

describe("parseLibraryItem", () => {
  it("rejects an unknown category", () => {
    expect(() =>
      parseLibraryItem(
        "x",
        `---\ntitle: T\nsummary: S\npublishedAt: "2026-09-17"\ncategory: nope\n---\n`,
      ),
    ).toThrow(/Invalid frontmatter/);
  });

  it("accepts every declared category", () => {
    for (const c of LIBRARY_CATEGORIES) {
      const item = parseLibraryItem(
        "x",
        `---\ntitle: T\nsummary: S\npublishedAt: "2026-09-17"\ncategory: ${c.id}\n---\n`,
      );
      expect(item.category).toBe(c.id);
    }
  });
});

describe("content/library", () => {
  it("every committed item parses (empty collection is fine for now)", async () => {
    await expect(getAllLibraryItems()).resolves.toBeInstanceOf(Array);
  });
});

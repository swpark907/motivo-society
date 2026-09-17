import { expect, test } from "@playwright/test";

test.describe("홈", () => {
  test("히어로와 Yard·Library 섹션이 보이고 각 섹션으로 이동한다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("배우고");

    const yard = page.getByRole("list", { name: "Yard" });
    await expect(yard).toBeVisible();
    await expect(yard.getByRole("link").first()).toBeVisible();

    const library = page.getByRole("list", { name: "Library" });
    await expect(library.getByRole("link")).toHaveCount(4);

    await library.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/library#ai$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/library/i);
  });

  test("GNB로 네 섹션을 오갈 수 있다", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "주 메뉴" });
    for (const [label, path] of [
      ["Yard", "/yard"],
      ["Library", "/library"],
      ["Article", "/article"],
      ["Workbook", "/workbook"],
    ] as const) {
      await nav.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    }
  });
});

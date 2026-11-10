import { expect, test } from "@playwright/test";

test.describe("홈", () => {
  test("비로그인 홈: 히어로 · 곧 열리는 활동 · Library", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("배우고");

    const week = page.getByRole("list", { name: "곧 열리는 활동" });
    await expect(week.getByRole("link").first()).toBeVisible();

    const library = page.getByRole("list", { name: "Library" });
    await expect(library.getByRole("link")).toHaveCount(4);

    await library.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/library#ai$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/library/i);
  });

  test("GNB의 다섯 메뉴로 오갈 수 있다", async ({ page, isMobile }) => {
    await page.goto("/learn");
    // 넓은 화면은 상단 GNB, 좁은 화면은 하단 탭 바가 같은 메뉴를 보여 준다.
    const nav = page.getByRole("navigation", { name: isMobile ? "하단 메뉴" : "주 메뉴" });
    for (const [label, path] of [
      ["둘러보기", "/explore"],
      ["클럽", "/clubs"],
      ["클래스", "/learn"],
      ["홈", "/"],
    ] as const) {
      await nav.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path === "/" ? "/" : path}$`));
      await expect(nav.getByRole("link", { name: label, exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
    // "MY"는 로그인이 필요해서 로그인 화면으로 갔다가 돌아온다.
    await nav.getByRole("link", { name: "MY", exact: true }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Fme$/);
  });
});

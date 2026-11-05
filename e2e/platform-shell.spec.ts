import { expect, test } from "@playwright/test";

// 새 정보 구조의 틀(L01): 다섯 메뉴 화면이 열리고, 옛 /yard는 발견으로 간다.
test.describe("플랫폼 화면 틀", () => {
  test("발견에 모집 중인 활동 카드가 보인다", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.getByRole("heading", { level: 1, name: "발견" })).toBeVisible();
    await expect(page.getByRole("region", { name: "모집 중인 활동" })).toBeVisible();
    await expect(page.getByText("오늘 저녁 온라인 모각코")).toBeVisible();
  });

  test("클럽 목록과 배우기 입구가 열린다", async ({ page }) => {
    await page.goto("/clubs");
    await expect(page.getByRole("list", { name: "클럽 목록" })).toContainText(
      "주말 바이브코딩 클럽",
    );
    await page.goto("/learn");
    await page.getByRole("link", { name: /라이브러리/ }).click();
    await expect(page).toHaveURL(/\/library$/);
  });

  test("옛 Yard 목록 주소는 발견으로 이어진다", async ({ page }) => {
    await page.goto("/yard");
    await expect(page).toHaveURL(/\/explore$/);
  });

  test("워크북에서는 하단 탭 바를 숨긴다", async ({ page, isMobile }) => {
    test.skip(!isMobile, "하단 탭 바는 좁은 화면에서만");
    await page.goto("/explore");
    await expect(page.getByRole("navigation", { name: "하단 메뉴" })).toBeVisible();
    await page.goto("/workbook");
    await expect(page.getByRole("navigation", { name: "하단 메뉴" })).toHaveCount(0);
  });
});

import { expect, test } from "@playwright/test";

// DM 링크로 상세 페이지에 바로 들어온 사람의 여정. 홈을 거치지 않아도 완결되어야 한다.
test.describe("딥링크 직접 진입", () => {
  test("Yard 상세: 무엇인지 알 수 있고 OG 메타가 있다", async ({ page }) => {
    await page.goto("/yard/vibe-web-class-1");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("바이브코딩");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      /바이브코딩/,
    );
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /.+/);
    // 다음으로 갈 곳: GNB가 있다
    await expect(page.getByRole("navigation", { name: "주 메뉴" })).toBeVisible();
  });

  test("Article 상세: 종이 표면에서 본문을 읽는다", async ({ page }) => {
    await page.goto("/article/hello-motivo-society");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("문을 엽니다");
    await expect(page.locator("main.paper")).toBeVisible();
  });

  test("없는 slug는 404", async ({ page }) => {
    const res = await page.goto("/library/does-not-exist");
    expect(res?.status()).toBe(404);
  });
});

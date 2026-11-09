import { expect, test } from "@playwright/test";

// L03 첫 가입 온보딩. 실제 가입 여정은 platform-flows.spec.ts에 있다.
test.describe("첫 가입 온보딩", () => {
  test("로그인하지 않고 온보딩 주소로 오면 로그인부터", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/login/);
  });
});

import { expect, test } from "@playwright/test";

// L02 매직링크 로그인의 오류 갈래. 실제로 가입·로그인하는 여정은 platform-flows.spec.ts에 있다.

test.describe("매직링크 로그인", () => {
  test("잘못된 이메일은 화면에서 바로 알려 준다", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("이메일").fill("not-an-email@x");
    await page.getByRole("button", { name: "로그인 링크 받기" }).click();
    await expect(page.getByText("이메일 주소를 다시 확인해 주세요.")).toBeVisible();
  });

  test("만료된 링크는 로그인 화면에서 다시 받게 한다", async ({ page }) => {
    await page.goto("/auth/callback?code=expired&next=%2Fme");
    await expect(page).toHaveURL(/\/login\?error=link&next=%2Fme$/);
    await expect(page.getByText(/메일을 다시 받아 주세요/)).toBeVisible();
  });

  test("다른 사이트로 돌려보내는 주소는 무시한다", async ({ page }) => {
    await page.goto("/auth/callback?code=x&next=%2F%2Fevil.example");
    await expect(page).toHaveURL(/\/login\?error=link&next=%2F$/);
  });
});

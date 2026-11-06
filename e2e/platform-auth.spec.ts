import { expect, test } from "@playwright/test";

// L02 매직링크 로그인. 로컬 Supabase의 메일은 Mailpit에 도착한다.
import { magicLinkFor, testNickname } from "./platform-helpers";

test.describe("매직링크 로그인", () => {
  test("로그인이 필요한 화면 → 메일 링크 → 원래 화면으로 돌아온다", async ({
    page,
    request,
  }, info) => {
    const email = `e2e-${info.project.name}-${Date.now()}@example.test`;

    await page.goto("/me");
    await expect(page).toHaveURL(/\/login\?next=%2Fme$/);
    await expect(page.getByRole("heading", { level: 1, name: "모쏘에 들어가기" })).toBeVisible();

    await page.getByLabel("이메일").fill(email);
    await page.getByRole("button", { name: "로그인 링크 받기" }).click();
    await expect(page.getByRole("heading", { name: "메일을 보냈어요" })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByRole("button", { name: /다시 보내기 \(\d+초\)/ })).toBeDisabled();

    await page.goto(await magicLinkFor(request, email));
    // 처음 온 사람은 온보딩을 거쳐 원래 화면으로 간다(L03).
    await expect(page).toHaveURL(/\/onboarding\?next=%2Fme$/);
    const nickname = testNickname();
    await page.getByLabel("닉네임").fill(nickname);
    await expect(page.getByText("쓸 수 있는 닉네임이에요.")).toBeVisible();
    await page.getByText("AI 도구", { exact: true }).click();
    await page.getByRole("button", { name: "시작하기" }).click();
    await expect(page).toHaveURL(/\/me$/);
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByRole("main").getByText(nickname, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/me");
    await expect(page).toHaveURL(/\/login/);
  });

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

  test("개발 환경에서는 시험장 사람으로 바로 들어가고, 상단에 계정이 보인다", async ({ page }) => {
    await page.goto("/login?next=%2Fclubs");
    await page.getByText("개발용 · 시험장 사람으로 들어가기").click();
    await page.getByRole("button", { name: /멤버하나/ }).click();
    await expect(page).toHaveURL(/\/clubs$/);
    await expect(page.getByRole("link", { name: "멤버하나 · 나" })).toBeVisible();
  });
});

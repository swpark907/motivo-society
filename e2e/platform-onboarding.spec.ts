import { expect, test } from "@playwright/test";
import { signUpByMail, testEmail, testNickname } from "./platform-helpers";

// L03 첫 가입 온보딩: 닉네임 바로 확인 · 관심사 1~5개 · 마치면 가려던 곳으로.
test.describe("첫 가입 온보딩", () => {
  test("겹치는 닉네임은 바로 알려 주고, 관심사는 다섯 개까지만 고른다", async ({
    page,
    request,
  }, info) => {
    await signUpByMail(page, request, testEmail(info.project.name), "/login?next=%2Fclubs");
    await expect(page).toHaveURL(/\/onboarding\?next=%2Fclubs$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("이름을 정해 주세요");

    const start = page.getByRole("button", { name: "시작하기" });
    await expect(start).toBeDisabled();

    await page.getByLabel("닉네임").fill("멤버하나");
    await expect(page.getByText("이미 누가 쓰고 있는 닉네임이에요.")).toBeVisible();
    await page.getByLabel("닉네임").fill("a!");
    await expect(page.getByText(/2~12자의 한글·영문·숫자·밑줄/)).toBeVisible();

    await page.getByLabel("닉네임").fill(testNickname());
    await expect(page.getByText("쓸 수 있는 닉네임이에요.")).toBeVisible();
    await expect(start).toBeDisabled(); // 관심사가 아직 없다

    for (const name of ["AI 도구", "바이브코딩", "웹 만들기", "디자인", "글쓰기"]) {
      await page.getByText(name, { exact: true }).click();
    }
    await expect(page.getByText("5/5")).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "영상" })).toBeDisabled();

    await start.click();
    await expect(page).toHaveURL(/\/clubs$/);

    // 이미 마친 사람이 온보딩 주소로 오면 바로 보낸다.
    await page.goto("/onboarding?next=%2Fexplore");
    await expect(page).toHaveURL(/\/explore$/);
  });

  test("로그인하지 않고 온보딩 주소로 오면 로그인부터", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/login/);
  });
});

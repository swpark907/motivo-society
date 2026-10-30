import { expect, test } from "@playwright/test";

test("회원 활동 캘린더 목업에서 날짜·월을 바꾸고 글로 이동한다", async ({ page }) => {
  await page.goto("/workbook");
  await page.getByRole("link", { name: "활동 캘린더 · 목업" }).click();
  const calendar = page.getByRole("complementary", { name: "차곡차곡, 나의 시간" });
  await expect(calendar).toContainText("목업 · 예시");
  await expect(calendar.getByRole("region", { name: "선택한 날의 활동" })).toContainText(
    "3개의 활동",
  );
  await calendar.getByRole("button", { name: "10월 15일, 활동 없음", exact: true }).click();
  await expect(calendar).toContainText("이 날에는 예시 활동이 없어요.");
  await calendar.getByRole("button", { name: "이전 달", exact: true }).click();
  await expect(calendar.getByRole("heading", { name: "2026년 9월" })).toBeVisible();
  await expect(calendar.getByRole("button", { name: "이전 달", exact: true })).toBeDisabled();
  await calendar.getByRole("button", { name: "9월 29일, 활동 1건", exact: true }).click();
  await expect(calendar).toContainText("열람 5분");
  await calendar.getByRole("button", { name: "다음 달", exact: true }).click();
  await calendar.getByRole("button", { name: "10월 16일, 활동 3건", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    calendar.getByRole("button", { name: "10월 16일, 활동 3건", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(calendar).toContainText("실제 기록을 수집·저장하지 않아요.");
  await page.screenshot({ path: `/tmp/workbook-calendar-${test.info().project.name}.png` });
  await calendar.getByRole("link", { name: /화면을 보여주고 질문하기.*열람 4분/ }).click();
  await expect(page).toHaveURL(/\/workbook\/reading\/show-the-screen$/);
});

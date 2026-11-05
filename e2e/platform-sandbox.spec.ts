import { expect, test } from "@playwright/test";

// 플랫폼 시험장 연기 테스트: 로컬 Supabase(`supabase start`)가 떠 있어야 한다.
// 사람을 바꿔 오늘 모각코의 마지막 자리에 신청하면 확정되고 화상 링크가 열린다.
test("시험장에서 사람을 바꿔 남은 자리에 신청한다", async ({ page }) => {
  await page.goto("/demo/platform/activities/00000000-0000-4000-c000-000000000001");
  await page.getByRole("button", { name: /처음 상태로/ }).click();
  await page.getByRole("button", { name: /처음온사람/ }).click();
  await expect(page.getByRole("button", { name: "신청하기" })).toBeVisible();
  await page.getByRole("button", { name: "신청하기" }).click();
  await expect(page.getByText("참가가 확정됐어요.")).toBeVisible();
  await expect(page.getByText("https://meet.example.test/tonight-mogakco")).toBeVisible();
});

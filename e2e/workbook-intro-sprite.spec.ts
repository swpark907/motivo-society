import { expect, test } from "@playwright/test";

const SEATED = "선글라스를 쓴 카피바라가 책상에 앉아 노트북으로 공부하는 모습";

test("인트로 카피바라 장면은 재생 중 멈추면 앉은 자세로 정지하고 처음부터 다시 볼 수 있다", async ({
  page,
}) => {
  await page.goto("/demo/workbook-intro-sprite");
  const scene = page.getByRole("img", { name: /카피바라가 인사하고/ });
  await expect(scene).toBeVisible();

  await page.getByRole("button", { name: "움직임 멈추기", exact: true }).click();
  await expect(page.getByRole("img", { name: SEATED, exact: true })).toBeVisible();

  await page.getByRole("button", { name: "처음부터 보기", exact: true }).click();
  await expect(page.getByRole("button", { name: "움직임 멈추기", exact: true })).toBeVisible();
  await expect(scene).toBeVisible();
});

test("모션 줄이기 설정이면 인트로 카피바라 장면이 자동 재생되지 않는다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo/workbook-intro-sprite");
  await expect(page.getByRole("img", { name: SEATED, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "움직임 보기", exact: true })).toBeVisible();
});

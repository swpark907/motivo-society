import { expect, test } from "@playwright/test";

test("GNB 임시 목록에서 현재 검토 중인 완료 화면으로 이동하면 목록이 닫힌다", async ({ page }) => {
  await page.goto("/workbook");
  const trigger = page.getByRole("button", { name: "테스트 화면 열기", exact: true });
  const menu = page.getByRole("dialog", { name: "테스트 화면", exact: true });
  await trigger.click();
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "단원 완료·결과물 미리보기", exact: true }).click();
  await expect(page).toHaveURL(/\/demo\/workbook-completion$/);
  await expect(
    page.getByRole("heading", { name: "단원 완료 화면 테스트", exact: true }),
  ).toBeVisible();
  await expect(menu).not.toBeVisible();
  await trigger.click();
  await expect(menu.getByRole("link")).toHaveCount(3);
  await expect(
    menu.getByRole("link", { name: "인트로 카피바라 스프라이트", exact: true }),
  ).toHaveAttribute("href", "/demo/workbook-intro-sprite");
  await expect(menu.getByRole("link", { name: "아티클 편집기", exact: true })).toHaveCount(0);
});

test("GNB 테스트 목록은 Escape·바깥 클릭·닫기 버튼으로 닫힌다", async ({ page }) => {
  await page.goto("/demo/workbook-completion");
  const trigger = page.getByRole("button", { name: "테스트 화면 열기", exact: true });
  const menu = page.getByRole("dialog", { name: "테스트 화면", exact: true });
  await trigger.click();
  await expect(menu).toBeVisible();
  await trigger.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.mouse.click(2, 80);
  await expect(menu).not.toBeVisible();
  await trigger.click();
  await menu.getByRole("button", { name: "테스트 화면 닫기", exact: true }).click();
  await expect(menu).not.toBeVisible();
});

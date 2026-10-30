import { test as base, type Page } from "@playwright/test";

async function startCoverWhenShown(page: Page) {
  const cover = page.getByRole("region", { name: "강의 시작 표지", exact: true });
  await page.addLocatorHandler(cover, async () => {
    await cover.getByRole("button", { name: "시작하기", exact: true }).click();
  });
}

// 첫 설명 → 제목 표지 → 이전 강의라는 실제 경로를 따라 기록 편집으로 돌아간다.
export async function goToPreviousLesson(page: Page) {
  const cover = page.getByRole("region", { name: "강의 시작 표지", exact: true });
  await page.removeLocatorHandler(cover);
  await page
    .getByRole("navigation", { name: "수업 진행", exact: true })
    .getByRole("button", { name: "이전 설명", exact: true })
    .click();
  await cover.getByRole("button", { name: "이전 강의로", exact: true }).click();
  await startCoverWhenShown(page);
}

// 기존 본문 여정 검사는 표지에서도 실제 시작 버튼을 누른다. 완료·진도를 주입하지 않는다.
// 표지 자체의 노출·시작·왕복 검사는 원래 Playwright test를 쓰는 별도 spec에서 검증한다.
export const test = base.extend({
  page: async ({ page }, runTest) => {
    await startCoverWhenShown(page);
    await runTest(page);
  },
});
export { expect } from "@playwright/test";
export type { Page, Locator } from "@playwright/test";

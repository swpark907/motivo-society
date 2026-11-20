import { test as base, expect, type Page } from "@playwright/test";

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
// 2단원 기획 네 수업(2-1~2-4)을 고르기만으로 마친다. 2-1 화면 1(표지 다음)에서 시작해 2-4 정리에서 멈추고,
// toRequest면 2-5로 넘어간다. title을 주면 2-4 정리의 "직접 고쳐 쓰기"에서 제목만 바꾼다.
// 고르는 것: 채용 담당자 · 인스타 · 휴대폰 · 30초 · 연락하기 · 첫 기준 / 첫 화면 버튼 가져오기 /
// 카드 모두 "지금" · 한 줄로 쌓기 / 또렷한 제목 · 구체적인 버튼 문구 · 차분한.
export async function fillPlanWithExample(
  page: Page,
  { title, toRequest = false }: { title?: string; toRequest?: boolean } = {},
) {
  const next = page.getByRole("button", { name: /^다음으로/ });
  const progress = page.getByLabel("현재 학습 단계", { exact: true });
  // 2-1
  await page.getByRole("button", { name: /^채용 담당자/ }).click();
  await next.click();
  await page.getByRole("button", { name: "인스타그램 링크", exact: true }).click();
  await page.getByRole("button", { name: "휴대폰", exact: true }).click();
  await page.getByRole("button", { name: "30초 훑어보기", exact: true }).click();
  await next.click();
  await page.getByRole("button", { name: /^연락하기/ }).click();
  await next.click();
  await page.getByRole("button", { name: /^3초 안에 무슨 페이지인지/ }).click();
  await next.click();
  await page.getByRole("button", { name: /^다음 수업 2-2/ }).click();
  // 2-2
  await next.click();
  await next.click();
  await page.getByRole("button", { name: "첫 화면 버튼 가져오기", exact: true }).click();
  await next.click();
  await next.click();
  await page.getByRole("button", { name: /^다음 수업 2-3/ }).click();
  // 2-3 (첫 클릭이 표지를 넘긴다. isVisible만으로는 표지 처리기가 돌지 않는다.)
  const now = page.getByRole("button", { name: "지금 넣기 →", exact: true });
  await now.click();
  while (await now.isVisible()) await now.click();
  await next.click();
  await next.click();
  await page.getByRole("button", { name: /한 줄로 쌓기/ }).click();
  await next.click();
  await page.getByRole("button", { name: /^다음 수업 2-4/ }).click();
  // 2-4
  await page.getByRole("button", { name: "AI와 함께 만든 작업들", exact: true }).click();
  await page.getByRole("button", { name: /^작업 의뢰 문의하기/ }).click();
  await next.click();
  await page.getByRole("button", { name: /^차분한/ }).click();
  await next.click();
  await next.click();
  await expect(progress).toHaveText(/4 \/ 4$/);
  if (title) {
    await page.getByText("제목이나 소개 글을 직접 고쳐 쓰고 싶다면").click();
    await page.getByRole("textbox", { name: "제목", exact: true }).fill(title);
  }
  if (toRequest) await page.getByRole("button", { name: /^다음 수업 2-5/ }).click();
}

export const test = base.extend({
  page: async ({ page }, runTest) => {
    await startCoverWhenShown(page);
    await runTest(page);
  },
});
export { expect } from "@playwright/test";
export type { Page, Locator } from "@playwright/test";

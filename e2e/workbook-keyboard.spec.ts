import { expect, test, type Locator, type Page } from "./workbook-test";
async function tabTo(page: Page, target: Locator) {
  for (let i = 0; i < 60; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) {
      await expect(target).toBeInViewport({ ratio: 1 });
      return;
    }
    await page.keyboard.press("Tab");
  }
  throw new Error("Tab으로 목적 조작에 도달하지 못했어요");
}

test("키보드로 시작·전체 과정·지도·표지·수업을 오가며 포커스를 유지한다", async ({
  page,
}, info) => {
  if (info.project.name === "mobile") await page.setViewportSize({ width: 320, height: 640 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  // 표지도 키보드로 넘기는지 보려고 자동 시작 처리기를 끈다.
  const cover = page.getByRole("region", { name: "강의 시작 표지", exact: true });
  await page.removeLocatorHandler(cover);
  await page.goto("/workbook/classes/vibe-web");
  await tabTo(page, page.getByRole("button", { name: "강의 시작하기 ↗", exact: true }));
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/view=map/);
  const overview = page.getByRole("button", { name: "전체 과정 보기", exact: true });
  await tabTo(page, overview);
  await page.keyboard.press("Enter");
  await tabTo(page, page.getByRole("button", { name: "전체 과정 닫기", exact: true }));
  await page.keyboard.press("Enter");
  await expect(overview).toBeFocused();
  const point = page.getByRole("button", {
    name: /^1-1 AI란 무엇인가 (장소로 이동|학습 패널 열기)$/,
  });
  await tabTo(page, point);
  await page.keyboard.press("Enter");
  const start = page.getByRole("button", { name: "AI란 무엇인가 수업 시작", exact: true });
  await expect(start).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(cover.getByRole("heading", { level: 1 })).toBeFocused();
  await tabTo(page, cover.getByRole("button", { name: "시작하기", exact: true }));
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "AI란 무엇인가", exact: true, level: 1 }),
  ).toBeFocused();
  const next = page.getByRole("button", { name: /^다음으로/ });
  await tabTo(page, next);
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText("2 / 6");
  await tabTo(page, page.getByRole("button", { name: /^←?이전 설명$/ }));
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText("1 / 6");
  await tabTo(page, page.getByRole("button", { name: "단원 지도 보기", exact: true }));
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "AI 도구 준비하기", level: 1, exact: true }),
  ).toBeFocused();
});

import { expect, test, type Page } from "./workbook-test";
const base = "/workbook/classes/vibe-web";
async function start(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base);
  await page.getByRole("button", { name: "강의 시작하기 ↗", exact: true }).click();
  await page.getByRole("button", { name: "기초강의 시작하기 →", exact: true }).click();
}

test("선택 수업·전체 과정·이야기를 왕복해도 수업 화면을 보존한다", async ({ page }) => {
  await start(page);
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await page.getByRole("button", { name: "단원 지도 보기", exact: true }).click();
  const panel = page.getByRole("complementary", { name: "학습 패널", exact: true });
  await expect(panel.getByRole("region", { name: "선택한 학습 장소", exact: true })).toContainText(
    "AI 이해하기",
  );
  await page.getByRole("button", { name: "전체 과정 보기", exact: true }).click();
  await page.getByRole("button", { name: "전체 과정 닫기", exact: true }).click();
  await panel.getByText("이용 안내", { exact: true }).click();
  await panel.getByRole("button", { name: "카피바라 이야기 더 보기 · 선택", exact: true }).click();
  await page.getByRole("button", { name: "이야기 건너뛰고 학습 지도로 →", exact: true }).click();
  await page.getByRole("button", { name: "AI 이해하기 수업 시작", exact: true }).click();
  await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText("화면 2 / 5");
});

test("예시 결과와 확인 문제를 거쳐 마치면 다음 수업을 안내한다", async ({ page }) => {
  await start(page);
  const next = page.getByRole("button", { name: "다음으로", exact: true });
  for (let i = 0; i < 3; i++) await next.click();
  await expect(next).toBeDisabled();
  await expect(page.locator("#workbook-lesson-next-action")).toHaveText(
    "요청을 읽었다면 결과를 열어 비교해보세요.",
  );
  await page.getByRole("button", { name: "예시 결과 보기", exact: true }).click();
  await page.getByRole("button", { name: "이미 1만 명이 선택했다는 내용", exact: true }).click();
  await next.click();
  await page.getByRole("button", { name: "학습 마치고 단원 지도로 →", exact: true }).click();
  await expect(page.getByRole("button", { name: /^다음 수업 시작 · 1-2/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "AI 이해하기 다시 보기", exact: true }),
  ).toBeVisible();
});

test("제작 예시 전환은 미리보기만 바꾸고 같은 첫 수업으로 들어간다", async ({ page }) => {
  await page.goto(base);
  await page.getByRole("button", { name: "강의 시작하기 ↗", exact: true }).click();
  for (const label of ["서비스 소개", "포트폴리오", "좋아하는 것 모음"]) {
    await page
      .getByLabel("만들 수 있는 페이지 예시", { exact: true })
      .getByRole("button", { name: new RegExp("^" + label) })
      .click();
    await expect(page).toHaveURL(/view=examples/);
    await expect(
      page.getByRole("complementary", { name: "페이지 예시 미리보기", exact: true }),
    ).toContainText(label);
    await page.getByRole("button", { name: label + " 예시 크게 보기", exact: true }).click();
    const modal = page.getByRole("dialog", { name: label + " · 페이지 예시", exact: true });
    await expect(modal).toContainText("디자인 참고 이미지");
    await modal.getByRole("button", { name: "닫기 ×", exact: true }).click();
  }
  await page.getByRole("button", { name: "기초강의 시작하기 →", exact: true }).click();
  await expect(page).toHaveURL(/lessons\/ai-understanding$/);
});

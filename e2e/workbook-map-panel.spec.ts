import { expect, test, type Page } from "./workbook-test";
const base = "/workbook/classes/vibe-web";
async function start(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base);
  await page.getByRole("button", { name: "강의 시작하기 ↗", exact: true }).click();
  await page
    .getByRole("button", { name: /^1-1 AI란 무엇인가 (장소로 이동|학습 패널 열기)$/ })
    .click();
  await page.getByRole("button", { name: "AI란 무엇인가 수업 시작", exact: true }).click();
}

test("선택 수업·전체 과정·이야기를 왕복해도 수업 화면을 보존한다", async ({ page }) => {
  await start(page);
  await page.getByRole("button", { name: /^다음으로/ }).click();
  await page.getByRole("button", { name: "단원 지도 보기", exact: true }).click();
  const panel = page.getByRole("complementary", { name: "학습 패널", exact: true });
  await expect(panel.getByRole("region", { name: "선택한 학습 장소", exact: true })).toContainText(
    "AI란 무엇인가",
  );
  await page.getByRole("button", { name: "전체 과정 보기", exact: true }).click();
  await page.getByRole("button", { name: "전체 과정 닫기", exact: true }).click();
  await panel.getByText("이용 안내", { exact: true }).click();
  await panel.getByRole("button", { name: "카피바라 이야기 더 보기 · 선택", exact: true }).click();
  await page.getByRole("button", { name: "이야기 건너뛰고 학습 지도로 →", exact: true }).click();
  await page.getByRole("button", { name: "AI란 무엇인가 수업 시작", exact: true }).click();
  await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText("2 / 6");
});

test("마지막 화면까지 마치고 단원 지도로 가면 다음 수업이 열린다", async ({ page }) => {
  await start(page);
  const next = page.getByRole("button", { name: /^다음으로/ });
  const progress = page.getByLabel("현재 학습 단계", { exact: true });
  await expect(progress).toHaveText(/^1 \/ \d+$/);
  const total = Number((await progress.textContent())!.split("/")[1]);
  for (let i = 1; i < total; i++) await next.click();
  await expect(page.getByRole("button", { name: /^다음 수업 1-2 어떤 AI를 쓸까/ })).toBeVisible();
  await page.getByRole("button", { name: "단원 지도로", exact: true }).click();
  await expect(page).toHaveURL(/view=map/);
  await expect(page.getByText("1 / 6 학습 확인", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "AI란 무엇인가 다시 보기", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^1-2 어떤 AI를 쓸까/ }).first()).toBeEnabled();
});

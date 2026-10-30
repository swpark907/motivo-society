import { expect, test } from "./workbook-test";
const base = "/workbook/classes/vibe-web";
test("수업 URL 직접 진입·새로고침·뒤로 가기와 내부 설명 전환", async ({ page }) => {
  await page.goto(base);
  await page.getByRole("button", { name: "강의 시작하기 ↗" }).click();
  await page.getByRole("button", { name: "기초강의 시작하기 →" }).click();
  await expect(page).toHaveURL(`${base}/lessons/ai-understanding`);
  await expect(page.getByRole("button", { name: "현재 안내로 돌아가기 ↑" })).toHaveCount(0);
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await expect(page).toHaveURL(`${base}/lessons/ai-understanding`);
  await page.reload();
  await expect(page.getByRole("heading", { name: "AI 이해하기", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "단원 지도 보기", exact: true }).click();
  await expect(page).toHaveURL(`${base}?view=map`);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "AI 이해하기", exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("button", { name: "단원 지도 보기", exact: true })).toHaveCount(0);
  await page.goto(`${base}/lessons/ai-tools`);
  await expect(
    page.getByRole("heading", { name: "AI 종류와 도구 알아보기", exact: true }),
  ).toBeVisible();
});
test("긴 실습의 안내가 화면 밖으로 나간 경우에만 돌아가기 표시", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 320 });
  await page.goto(`${base}/lessons/first-request`);
  const body = page.getByLabel("수업 내용", { exact: true });
  const back = page.getByRole("button", { name: "현재 안내로 돌아가기 ↑" });
  await expect(body).toBeVisible();
  await expect(back).toHaveCount(0);
  // 첫 설명은 짧고 행동 안내가 없다. 실제 요청 작성 화면까지 진행한다.
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await page.getByRole("button", { name: "예시로 복습하기", exact: true }).click();
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await expect(body.locator("[data-current-action]")).toBeVisible();
  await body.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  // 화면 높이에 따라 바깥 문서가 스크롤되는 경우도 같은 조건으로 처리한다.
  await expect(back).toBeVisible();
  await back.click();
  await expect(back).toHaveCount(0);
  await expect(body.locator("[data-current-action]")).toBeFocused();
});

import { expect, test } from "./workbook-test";
test("2강 첫 화면은 결과와 기능을 연결하고 기존 예시로 이어진다", async ({ page }, testInfo) => {
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workbook/classes/vibe-web/lessons/ai-tools");
  await expect(
    page.getByRole("heading", { name: "AI 종류와 도구 알아보기", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /도구 이름보다,.*만들 결과부터 정해요/ }),
  ).toBeVisible();
  const progress = page.getByLabel("현재 학습 단계", { exact: true });
  await expect(progress).toHaveCount(1);
  await expect(progress).toHaveText("화면 1 / 11");
  const table = page.getByRole("table", { name: "만들 결과와 필요한 기능" });
  await expect(table.getByRole("rowheader")).toHaveText(["소개 글", "표지 그림", "웹 화면"]);
  await expect(table).toContainText("파일 반영 · 실행 확인");
  const body = page.getByLabel("수업 내용", { exact: true });
  await expect(body.locator("[data-current-action]")).toHaveCount(0);
  if (testInfo.project.name === "desktop") {
    await expect
      .poll(() => body.evaluate((element) => element.scrollHeight - element.clientHeight))
      .toBeLessThanOrEqual(2);
  }
  await page.screenshot({ path: testInfo.outputPath("tools-opening.png") });
  const next = page.getByRole("button", { name: "다음으로", exact: true });
  await next.click();
  await expect(progress).toHaveText("화면 2 / 11");
  await page.getByRole("button", { name: "표지 그림", exact: true }).click();
  await expect(body.getByRole("img")).toBeVisible();
  await next.click();
  await expect(progress).toHaveText("화면 3 / 11");
  await next.click();
  await expect(
    page.getByRole("heading", { name: /모델은 결과를 만들고,.*도구는 작업을 연결해요/ }),
  ).toBeVisible();
  await expect(progress).toHaveCount(1);
  await expect(page).toHaveURL(/\/lessons\/ai-tools$/);
});

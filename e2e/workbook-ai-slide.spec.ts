import { expect, test } from "./workbook-test";
test("생성형 AI와 LLM의 관계를 짧은 화면에서 읽는다", async ({ page }, testInfo) => {
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workbook/classes/vibe-web/lessons/ai-understanding");
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await expect(page.getByRole("heading", { name: "LLM · 대규모 언어 모델" })).toBeVisible();
  await expect(page.getByText("그중 언어를 다루는 모델 ↓", { exact: true })).toBeVisible();
  await expect(page.getByRole("table")).toHaveAccessibleName("생성형 AI가 만드는 결과 예시");
  await expect(page.getByRole("columnheader")).toHaveCount(3);
  await expect(page.getByRole("cell")).toHaveCount(3);
  await page.screenshot({ path: testInfo.outputPath("ai-concepts.png") });
  if (testInfo.project.name === "desktop") {
    const body = page.getByLabel("수업 내용", { exact: true });
    await expect
      .poll(() => body.evaluate((element) => element.scrollHeight - element.clientHeight))
      .toBeLessThanOrEqual(2);
  }
});

test("3/3은 결과 확인과 최소 코드 설명만 보여준다", async ({ page }, testInfo) => {
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workbook/classes/vibe-web/lessons/ai-understanding");
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await expect(page.getByRole("heading", { name: "자연스러운 답변 ≠ 확인된 사실" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "자연스러운 답변 ≠ 확인된 사실" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "참고 · 코드란?" })).toBeVisible();
  await expect(page.getByText("코드는 무엇인가요?", { exact: true })).toHaveCount(0);
  const table = page.getByRole("table", { name: "AI 결과 확인 기준" });
  await expect(table.getByRole("rowheader")).toHaveText(["사실 확인", "요청 확인"]);
  await expect(table.getByRole("columnheader")).toHaveText(["확인할 것", "스스로 물어볼 질문"]);
  await page.screenshot({ path: testInfo.outputPath("ai-checks.png") });
  if (testInfo.project.name === "desktop") {
    const body = page.getByLabel("수업 내용", { exact: true });
    await expect
      .poll(() => body.evaluate((element) => element.scrollHeight - element.clientHeight))
      .toBeLessThanOrEqual(2);
  }
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await expect(page.getByRole("heading", { name: "그럴듯한 문장도 확인해봐요" })).toBeVisible();
});

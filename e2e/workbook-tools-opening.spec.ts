import { expect, test } from "./workbook-test";
test("1-2 첫 두 화면은 AI 종류에서 코드 에이전트로 이어진다", async ({ page }, testInfo) => {
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workbook/classes/vibe-web/lessons/ai-tools");
  await expect(page.getByRole("heading", { name: "어떤 AI를 쓸까", exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "무엇을 만들지에 따라 AI가 달라요" }),
  ).toBeVisible();
  const progress = page.getByLabel("현재 학습 단계", { exact: true });
  await expect(progress).toHaveCount(1);
  await expect(progress).toHaveText("1 / 6");
  const body = page.getByLabel("수업 내용", { exact: true });
  const cards = body.getByRole("listitem");
  await expect(cards).toHaveCount(6);
  await expect(cards.last()).toContainText("코드 에이전트");
  await expect(cards.last()).toContainText("Claude Code");
  await expect(body).toContainText("2026년 11월 기준");
  await expect(body.locator("[data-current-action]")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("tools-kinds.png") });
  const next = page.getByRole("button", { name: /^다음으로/ });
  await next.click();
  await expect(progress).toHaveText("2 / 6");
  await expect(page.getByRole("heading", { name: /그럼 코드 에이전트는.*뭘까요/ })).toBeVisible();
  await expect(body).toContainText("챗봇은 대화창에서 답을 글로 돌려줍니다.");
  await expect(body).toContainText("코드 에이전트는 내 컴퓨터의 폴더를 직접 열고");
  await page.screenshot({ path: testInfo.outputPath("tools-agent.png") });
  await next.click();
  await expect(progress).toHaveText("3 / 6");
  await expect(page.getByRole("heading", { name: "코드 에이전트, 이렇게 써요" })).toBeVisible();
  await expect(progress).toHaveCount(1);
  await expect(page).toHaveURL(/\/lessons\/ai-tools$/);
});

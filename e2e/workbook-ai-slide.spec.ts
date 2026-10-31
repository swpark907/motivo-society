import { expect, test } from "./workbook-test";

// 1-1 재기획 흐름: 생성형 AI(콜라주) → 코드도 글자 → 대화로 완성 → LLM.
test("1-1은 생성형 AI에서 LLM까지 차례로 이어진다", async ({ page }, testInfo) => {
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workbook/classes/vibe-web/lessons/ai-understanding");
  const next = page.getByRole("button", { name: /^다음으로/ });

  await expect(page.getByRole("heading", { name: "AI가 하는 일이 달라졌어요" })).toBeVisible();

  await next.click();
  await expect(page.getByRole("heading", { name: "코드도 결국 글자예요" })).toBeVisible();
  const show = page.getByRole("button", { name: "화면으로 보기" });
  await show.click();
  await expect(page.getByRole("button", { name: "화면 접기" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );

  await next.click();
  await expect(page.getByRole("heading", { name: "다만, 한 번에 완성되지 않아요" })).toBeVisible();
  // 첫 요청은 들어오자마자 재생된다: AI가 쓰는 중 → 답 → 결과 화면.
  const chat = page.getByRole("list", { name: "카피바라와 AI의 대화" });
  await expect(chat.getByRole("status", { name: "AI가 답을 쓰고 있어요" })).toBeVisible();
  await expect(chat.getByText("제목과 소개 한 줄로 만들었어요.")).toBeVisible();
  const more = page.getByRole("button", { name: /다음 요청 보기/ });
  await more.click();
  await expect(page.getByText("평일 오전 10시 ~ 밤 9시")).toBeVisible();
  await more.click();
  await expect(page.getByRole("button", { name: "처음부터 다시 보기" })).toBeVisible();
  await expect(chat.getByRole("listitem")).toHaveCount(3);

  await next.click();
  await expect(page.getByRole("heading", { name: "그럼 LLM은 뭘까요" })).toBeVisible();
  for (const name of ["AI", "생성형 AI", "LLM"])
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("ai-llm.png") });

  await next.click();
  await expect(page.getByRole("heading", { name: "많이 쓰는 대표적인 LLM" })).toBeVisible();
  const models = page.getByRole("figure", { name: "많이 쓰는 대표적인 LLM" }).getByRole("listitem");
  await expect(models).toHaveCount(3);
  await expect(models.nth(0)).toContainText("OpenAI");

  await next.click();
  await expect(page.getByRole("heading", { name: "오늘 알게 된 것" })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "1단원에서 이어서 배울 것" }).getByRole("listitem"),
  ).toHaveCount(5);
  await page.getByRole("button", { name: /학습 마치고 단원 지도로/ }).click();
  await expect(page).toHaveURL(/\?view=map$/);
});

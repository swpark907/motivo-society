import { expect, test } from "./workbook-test";

test("1강 헤더·설명·정오답·학습 정리를 같은 디자인 체계로 진행한다", async ({ page }, testInfo) => {
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workbook/classes/vibe-web/lessons/ai-understanding");
  const header = page.getByRole("heading", { name: "AI 이해하기", exact: true }).locator("../..");
  const progress = page.getByLabel("현재 학습 단계", { exact: true });
  await expect(progress).toHaveCount(1);
  await expect(progress).toHaveText("화면 1 / 5");
  await expect(header).not.toContainText("LESSON 01");
  await page.screenshot({ path: testInfo.outputPath("lesson-opening.png") });
  const next = page.getByRole("button", { name: "다음으로", exact: true });
  await next.click();
  await next.click();
  await next.click();
  await expect(progress).toHaveText("화면 4 / 5");
  await expect(next).toBeDisabled();
  const request = page.getByRole("region", { name: "보낸 요청", exact: true });
  const result = page.getByRole("region", { name: "AI 결과 예시", exact: true });
  const question = page.getByRole("region", {
    name: "알려준 내용으로 확인할 수 없는 부분은?",
    exact: true,
  });
  await expect(request).toContainText("소개문 두 문장을 써줘");
  await expect(result.getByRole("button", { name: "예시 결과 보기", exact: true })).toBeVisible();
  await expect(question).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("lesson-request.png") });
  await page.getByRole("button", { name: "예시 결과 보기", exact: true }).click();
  await expect(request).toBeVisible();
  await expect(result).toContainText("이미 1만 명이 선택한 공간");
  await expect(question).toBeVisible();
  await expect(question.getByRole("button")).toHaveCount(3);
  await page.getByRole("button", { name: "창가 자리와 혼자 책 읽기", exact: true }).click();
  await expect(next).toBeDisabled();
  await expect(page.locator('button[data-answer="incorrect"]')).toContainText("오답");
  await page.getByRole("button", { name: "이미 1만 명이 선택했다는 내용", exact: true }).click();
  await expect(page.locator('button[data-answer="correct"]')).toContainText("정답");
  await expect(next).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath("lesson-quiz.png") });
  await next.click();
  await expect(progress).toHaveText("화면 5 / 5");
  await expect(page.getByRole("heading", { name: "배운 핵심" })).toBeVisible();
  await expect(page.getByRole("region", { name: "배운 핵심" }).locator("dt")).toHaveText([
    "생성형 AI",
    "LLM",
    "결과 확인",
  ]);
  await expect(page.getByRole("region", { name: "AI 종류와 도구 알아보기" })).toContainText(
    "단원 지도에서 다음 수업을 시작해요",
  );
  await page.screenshot({ path: testInfo.outputPath("lesson-recap.png") });
  await page.getByRole("button", { name: "학습 마치고 단원 지도로 →", exact: true }).click();
  await expect(page).toHaveURL(/\?view=map$/);
});

import { expect, test } from "./workbook-test";

test("2강은 예시 비교→모델·도구→접속·에이전트→확인→정리로 이어진다", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workbook/classes/vibe-web/lessons/ai-tools");
  const next = page.getByRole("button", { name: "다음으로", exact: true });
  const progress = page.getByLabel("현재 학습 단계", { exact: true });
  const body = page.getByLabel("수업 내용", { exact: true });
  let screen = 1;
  await expect(progress).toHaveText("화면 1 / 11");
  async function advance() {
    await next.click();
    screen += 1;
    await expect(progress).toHaveText(new RegExp(`화면 ${screen} / 11$`));
  }

  async function capture(name: string) {
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
    if (testInfo.project.name === "desktop") {
      await expect
        .poll(() => body.evaluate((element) => element.scrollHeight - element.clientHeight))
        .toBeLessThanOrEqual(2);
    }
  }
  await advance();
  const comparison = page.getByRole("region", { name: "결과 예시 비교" });
  for (const [name, feature] of [
    ["소개 글", "초안 쓰기 · 문장 고치기"],
    ["표지 그림", "이미지 생성 · 파일로 저장"],
    ["웹 화면", "코드 작성 · 파일 반영 · 실행 확인"],
  ]) {
    const button = comparison.getByRole("button", { name, exact: true });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(progress).toHaveText("화면 2 / 11");
    await expect(comparison.locator("dt")).toHaveText(["필요한 기능", "확인할 점"]);
    await expect(comparison.locator("dd").first()).toHaveText(feature);
    if (name === "표지 그림") {
      await expect(comparison.getByRole("img")).toHaveAttribute("src", /reading-places-cover\.svg/);
    }
    if (name === "웹 화면") {
      await expect(comparison.getByRole("img")).toHaveAttribute("src", /reading-places-cover\.svg/);
      await expect(
        comparison.getByText(
          "창가 자리가 있어 혼자 책을 읽으며 쉬어가기 좋은 공간입니다. 주말에는 사람이 많으니 방문 시간을 참고해주세요.",
        ),
      ).toBeVisible();
    }
    await capture(`example-${name}`);
  }
  await advance();
  await expect(body.getByRole("listitem")).toHaveCount(3);
  await capture("decision-order");
  await advance();
  await expect(page.getByRole("table", { name: "모델과 도구의 역할" })).toBeVisible();
  await capture("model-tool");
  await advance();
  await page.getByRole("button", { name: "모델 살펴보기", exact: true }).click();
  await expect(body.locator('[data-active="true"] > strong')).toHaveText("AI 모델");
  await capture("model-diagram");
  await advance();
  await expect(page.getByRole("table", { name: "모델과 도구의 조합" })).toBeVisible();
  await advance();
  await expect(page.getByRole("table", { name: "웹과 데스크톱 앱의 접속 방식" })).toBeVisible();
  await capture("web-desktop");
  await advance();
  await expect(page.getByRole("table", { name: "코드 답변과 실제 파일 작업" })).toBeVisible();
  await capture("agent-work");
  await advance();
  await expect(next).toBeDisabled();
  await page
    .getByRole("button", { name: "설치했으니 파일을 자동으로 고칠 수 있어요", exact: true })
    .click();
  await expect(next).toBeDisabled();
  await page
    .getByRole("button", { name: "파일 작업 기능과 연결된 폴더·권한을 확인해야 해요", exact: true })
    .click();
  await expect(next).toBeEnabled();
  await capture("setup-check");
  await advance();
  const review = page.getByRole("button", { name: "학습 정리 보기", exact: true });
  await expect(review).toBeDisabled();
  await expect(page.getByRole("heading", { name: "배운 핵심", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "가장 최신 모델 이름", exact: true }).click();
  await expect(review).toBeDisabled();
  await page.getByRole("button", { name: "이미지를 생성하고 저장하는 기능", exact: true }).click();
  await expect(review).toBeDisabled();
  await page.getByRole("button", { name: "반드시 따로 써야 해요", exact: true }).click();
  await expect(review).toBeDisabled();
  await page.getByRole("button", { name: "그럴 수 있어요", exact: true }).click();
  await expect(review).toBeEnabled();
  await capture("function-check");
  await review.click();
  await expect(progress).toHaveText("화면 11 / 11");
  await expect(page.getByRole("heading", { name: "배운 핵심", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "1-3 도구 준비하기", exact: true })).toBeVisible();
  await capture("lesson-recap");
  await page.getByRole("button", { name: "학습 마치고 단원 지도로 →", exact: true }).click();
  await expect(page).toHaveURL(/\?view=map$/);
});

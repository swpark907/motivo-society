import { expect, test } from "@playwright/test";

test("홈 홍보에서 짧은 글을 목차 없이 읽고 관련 글·홈으로 이어간다", async ({ page }) => {
  await page.goto("/workbook");
  await expect(page.locator("#spotlight-title")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "워크북 소개 보기", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "추천 글 보기", exact: true }).click();
  await expect(page.getByRole("button", { name: "추천 글 보기", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("link", { name: "화면으로 질문하는 법 읽기 →", exact: true }).click();
  await expect(page).toHaveURL(/\/workbook\/reading\/show-the-screen$/);
  await expect(page.locator("figure img").first()).toHaveAttribute("src", /show-the-screen-v1/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/어디가[\s\S]*이상한가요/);
  await expect(
    page.getByText("화면 검토용 임시 발행 · 실사용 검증 전", { exact: false }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    /화면을 보여주고/,
  );
  await expect(page.getByRole("navigation", { name: "글 목차" })).toHaveCount(0);
  await expect(page.getByText("이 글의 흐름 보기", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("article", { name: "아티클 본문" }).getByRole("link", { name: "Vision 안내" }),
  ).toHaveAttribute("href", "https://platform.claude.com/docs/en/build-with-claude/vision");
  await page.getByRole("link", { name: "다른 힌트 살펴보기 →", exact: true }).click();
  await expect(page).toHaveURL(/\/workbook#reading$/);
  const reading = page.locator("#reading");
  await expect(reading.getByRole("link")).toHaveCount(6);
  await expect(reading.getByRole("img")).toHaveCount(6);
  const links = await reading
    .getByRole("link")
    .evaluateAll((elements) => elements.map((element) => element.getAttribute("href")!));
  for (const href of links) {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator("figure img")
          .first()
          .evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
      )
      .toBe(true);
    await expect(page.getByRole("article", { name: "아티클 본문" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "글 목차" })).toHaveCount(0);
    await expect(
      page.getByRole("region", { name: "같이 보면 좋은 글들" }).getByRole("link"),
    ).toHaveCount(2);
  }
  await page.goto("/workbook/reading/not-a-real-note");
  await expect(page.getByRole("heading", { name: "404", exact: true })).toBeVisible();
});

test("테스트 댓글은 글별로 유지되고 삭제와 새로고침으로 초기화된다", async ({ page }) => {
  await page.goto("/workbook/reading/show-the-screen");
  await page.getByRole("link", { name: "내 질문을 댓글로 남겨보기 ↗" }).click();
  await page.getByLabel("이름", { exact: true }).fill("테스트 독자");
  await page.getByLabel("댓글", { exact: true }).fill("버튼의 위치를 함께 살펴보고 싶어요.");
  await page.getByRole("button", { name: "댓글 남기기 ↗" }).click();
  const list = page.getByRole("list", { name: "이 글의 테스트 댓글" });
  await expect(list).toContainText("버튼의 위치를 함께 살펴보고 싶어요.");
  const related = page.getByRole("region", { name: "같이 보면 좋은 글들" });
  await expect(related).toContainText("질문에 원하는 결과의 모양까지 덧붙이고 싶다면.");
  await related.getByRole("link").first().click();
  await expect(page).toHaveURL(/\/reading\/describe-the-result$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("원하는 결과");
  await expect(page.getByRole("list", { name: "이 글의 테스트 댓글" })).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/reading\/show-the-screen/);
  await expect(list).toContainText("버튼의 위치를 함께 살펴보고 싶어요.");
  await page.getByRole("button", { name: "테스트 독자 댓글 삭제" }).click();
  await expect(list).toHaveCount(0);
  await page.getByLabel("이름", { exact: true }).fill("테스트 독자");
  await page.getByLabel("댓글", { exact: true }).fill("새로고침 초기화 확인");
  await page.getByRole("button", { name: "댓글 남기기 ↗" }).click();
  await expect(list).toContainText("새로고침 초기화 확인");
  await page.reload();
  await expect(list).toHaveCount(0);
});

test("여섯 번째 실습 가이드를 목차·예문·여러 레이아웃으로 읽는다", async ({ page }) => {
  await page.goto("/workbook/reading/test-the-awkward-cases");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("잘되는 예시만넣고 있나요?");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /test-the-awkward-cases-v1/,
  );
  const article = page.getByRole("article", { name: "아티클 본문" });
  await expect(article.locator("#three-cards")).toHaveAttribute("data-layout", "table");
  await expect(article.locator("#small-loop")).toHaveAttribute("data-layout", "timeline");
  await expect(article.locator("#questions-before-expanding")).toHaveAttribute(
    "data-layout",
    "columns",
  );
  await expect(article.locator("#your-own-cases")).toContainText(
    "수정 뒤에는 이전 예시도 다시 넣고",
  );
  await expect(article.locator("#before-you-call-it-done")).toHaveCount(0);
  await expect(article.locator("#ready-to-use-request")).toContainText("원문·분류·판단 근거");
  await expect(article.getByRole("link", { name: "AI 에이전트 평가 해설" })).toHaveAttribute(
    "href",
    "https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents",
  );
  const toc = page.getByRole("navigation", { name: "글 목차" });
  if (!(await toc.isVisible())) await page.getByText("이 글의 흐름 보기", { exact: true }).click();
  await expect(toc.getByRole("link")).toHaveCount(4);
  await toc.getByRole("link", { name: "한 번 고쳤다면, 세 개를 다시" }).click();
  await expect(page).toHaveURL(/#try-and-compare$/);
  await expect
    .poll(() => page.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth))
    .toBe(true);
});

test("사진과 글의 캡션을 해당 사진에 묶어 읽고 다음 내용으로 이어간다", async ({ page }) => {
  await page.goto("/workbook/reading/test-the-awkward-cases");
  const split = page.locator("#desk-and-boundary");
  const photo = split.getByRole("figure");
  await expect(photo).toHaveCount(1);
  await expect(photo.getByRole("img")).toHaveAttribute(
    "alt",
    "서로 다른 표시가 있는 세 장의 종이 카드를 살펴보는 작업 장면",
  );
  await expect(photo.locator("figcaption")).toContainText("AI 생성 사진");
  await expect(photo.locator("blockquote")).toHaveCount(0);
  await expect(split.locator("blockquote")).toContainText("분류와 근거만 적어줘");
  await expect(page.locator("#closing-photo")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "같이 보면 좋은 글들" }).getByRole("link"),
  ).toHaveCount(2);
});

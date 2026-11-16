import { expect, test } from "./workbook-test";

test("1-3은 토큰→컨텍스트→계량컵→요금표→습관→정리로 이어진다", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workbook/classes/vibe-web/lessons/ai-usage");
  const next = page.getByRole("button", { name: /^다음으로/ });
  const progress = page.getByLabel("현재 학습 단계", { exact: true });
  const body = page.getByLabel("수업 내용", { exact: true });
  let screen = 1;
  await expect(progress).toHaveText("1 / 6");
  async function advance() {
    await next.click();
    screen += 1;
    await expect(progress).toHaveText(new RegExp(`^${screen} / 6$`));
  }
  // 짧은 설명 화면은 PC에서 본문과 이동 버튼이 한 화면에 보여야 한다.
  async function capture(name: string) {
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
    if (testInfo.project.name === "desktop") {
      await expect
        .poll(() => body.evaluate((element) => element.scrollHeight - element.clientHeight))
        .toBeLessThanOrEqual(2);
    }
  }

  await expect(page.getByRole("heading", { name: "AI는 글을 조각으로 나눠 읽어요" })).toBeVisible();
  await page.getByRole("button", { name: "코드 한 줄", exact: true }).click();
  await page.getByRole("button", { name: "가위로 자르기" }).click();
  await expect(body).toContainText("8조각으로 나뉘었어요.");
  await capture("1-tokens");

  await advance();
  await expect(
    page.getByRole("heading", { name: "한 번에 볼 수 있는 범위가 있어요" }),
  ).toBeVisible();
  const add = page.getByRole("button", { name: "쪽지 올리기", exact: true });
  for (let i = 0; i < 4; i++) await add.click();
  await expect(body).toContainText("책상이 가득 찼어요");
  await add.click();
  await expect(body).toContainText("가장 오래된 쪽지가 책상에서 밀려났어요");
  await expect(body).toContainText("제목 색 이야기는 지금 책상 위에 없어요.");
  await capture("2-context-desk");

  await advance();
  await expect(page.getByRole("heading", { name: "에이전트는 더 많이 읽어요" })).toBeVisible();
  await expect(page.getByRole("img", { name: "코드 에이전트가 쓴 양: 많이" })).toBeVisible();
  await expect(body).toContainText("바뀐 화면 다시 확인");
  await capture("3-cups");

  await advance();
  await expect(page.getByRole("heading", { name: "그래서 요금제가 나뉘어요" })).toBeVisible();
  await expect(body).toContainText("2026년 11월 기준");
  await expect(body.getByText("Claude Code는 못 써요")).toHaveCount(1);
  await expect(body.getByText("Claude Code 쓸 수 있어요")).toHaveCount(3);
  await capture("4-plans");

  await advance();
  await expect(page.getByRole("heading", { name: "아껴 쓰는 세 가지 습관" })).toBeVisible();
  const switches = page.getByRole("switch");
  await expect(switches).toHaveCount(3);
  await switches.nth(1).click();
  await expect(switches.nth(1)).toHaveAttribute("aria-checked", "true");
  await expect(body).toContainText("습관 1개를 켰어요");
  await capture("5-habits");

  // 조작한 것은 다른 화면에 다녀와도 남는다.
  await page.getByRole("button", { name: /이전 설명/ }).click();
  await next.click();
  await expect(switches.nth(1)).toHaveAttribute("aria-checked", "true");

  await advance();
  await expect(page.getByRole("heading", { name: "오늘 알게 된 것" })).toBeVisible();
  await expect(body.getByRole("listitem")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: /1-4\s*도구와 작업 공간 준비/ })).toBeVisible();
  await capture("6-recap");
  await page.getByRole("button", { name: "학습 마치고 단원 지도로 →", exact: true }).click();
  await expect(page).toHaveURL(/\?view=map$/);
  await expect(page.getByText("1 / 6 학습 확인")).toBeVisible();
});

import { expect, test } from "./workbook-test";

test("1-4는 도장 카드→설치→둘러보기→폴더→확인→정리로 이어진다", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workbook/classes/vibe-web/lessons/tool-setup");
  const next = page.getByRole("button", { name: /^다음으로/ });
  const progress = page.getByLabel("현재 학습 단계", { exact: true });
  const body = page.getByLabel("수업 내용", { exact: true });
  const card = page.getByRole("region", { name: "준비 도장 카드" });
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

  await expect(page.getByRole("heading", { name: "오늘 준비할 네 가지" })).toBeVisible();
  await expect(body).toContainText("유료 요금제");
  // 첫 화면은 순서만 보여주고 누르는 도장은 없다.
  await expect(page.getByRole("heading", { name: "오늘의 순서" })).toBeVisible();
  await expect(card).toHaveCount(0);
  await capture("1-start");

  await advance();
  await expect(page.getByRole("heading", { name: "Claude를 설치해요" })).toBeVisible();
  await page.getByRole("button", { name: "Mac", exact: true }).click();
  await expect(body).toContainText("응용 프로그램 폴더에서 Claude를 찾아 열어요.");
  await card.getByRole("button", { name: "Claude 앱을 설치했어요" }).click();
  await card.getByRole("button", { name: "로그인했어요" }).click();
  await expect(card).toContainText("2 / 4");
  await capture("2-install");

  await advance();
  await expect(page.getByRole("heading", { name: "화면을 둘러봐요" })).toBeVisible();
  await page.getByRole("button", { name: "4. 승인을 묻는 창" }).click();
  await expect(body).toContainText("파일을 만들거나 고치기 전에 대화 중간에 물어봐요.");
  await card.getByRole("button", { name: "Code 탭을 열었어요" }).click();
  await capture("3-tour");

  await advance();
  await expect(page.getByRole("heading", { name: "작업할 폴더를 정해요" })).toBeVisible();
  // 설치 화면에서 고른 컴퓨터가 이어진다.
  await expect(page.getByRole("button", { name: "Mac", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(body).toContainText("이름을 my-first-web 로 적어요.");
  await capture("4-folder");

  await advance();
  await expect(page.getByRole("heading", { name: "준비됐는지 확인해요" })).toBeVisible();
  await expect(body).toContainText("남은 것 1가지");
  await card.getByRole("button", { name: "작업 폴더를 정했어요" }).click();
  await expect(body).toContainText("준비가 끝났어요");
  await expect(card).toContainText("4 / 4");
  await capture("5-check");

  await advance();
  await expect(page.getByRole("heading", { name: "오늘 알게 된 것" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /1-5\s*요청 잘하기/ })).toBeVisible();
  await capture("6-recap");
  await page.getByRole("button", { name: "학습 마치고 단원 지도로 →", exact: true }).click();
  await expect(page).toHaveURL(/\?view=map$/);
  // 네 도장을 다 찍으면 지도에 본인 확인으로 남는다.
  await expect(page.getByText("컴퓨터 준비 확인 · 본인 확인").first()).toBeAttached();
});

test("1-4는 도장을 찍지 않아도 마칠 수 있다", async ({ page }) => {
  await page.goto("/workbook/classes/vibe-web/lessons/tool-setup");
  const next = page.getByRole("button", { name: /^다음으로/ });
  for (let i = 0; i < 4; i++) await next.click();
  await expect(page.getByLabel("수업 내용", { exact: true })).toContainText("남은 것 4가지");
  await next.click();
  await page.getByRole("button", { name: "학습 마치고 단원 지도로 →", exact: true }).click();
  await expect(page).toHaveURL(/\?view=map$/);
  await expect(page.getByText("1 / 6 학습 확인")).toBeVisible();
});

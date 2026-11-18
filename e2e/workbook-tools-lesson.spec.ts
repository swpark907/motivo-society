import { expect, test } from "./workbook-test";

test("1-2는 종류→4컷 만화→연습 창→비교표→이름표와 흐름→정리로 이어진다", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workbook/classes/vibe-web/lessons/ai-tools");
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

  await expect(body.getByRole("listitem")).toHaveCount(6);
  await capture("1-ai-kinds");

  await advance();
  await expect(page.getByRole("heading", { name: "그럼 코드 에이전트는 뭘까요" })).toBeVisible();
  await capture("2-agent-comic");

  await advance();
  await expect(page.getByRole("heading", { name: "코드 에이전트, 이렇게 써요" })).toBeVisible();
  const tryout = page.getByRole("region", { name: "연습용 코드 에이전트 창" });
  await tryout.getByRole("button", { name: "my-first-web" }).click();
  await expect(tryout).toContainText("index.html 파일을 만들어도 될까요?");
  await tryout.getByRole("button", { name: "거절", exact: true }).click();
  await expect(tryout).toContainText("파일을 만들지 않았어요.");
  await tryout.getByRole("button", { name: "다시 물어보기", exact: true }).click();
  await tryout.getByRole("button", { name: "승인", exact: true }).click();
  await expect(tryout).toContainText("새 파일");
  await capture("3-tryout-done");

  await advance();
  await expect(page.getByRole("heading", { name: "왜 코드 에이전트일까요" })).toBeVisible();
  const table = page.getByRole("table", { name: "웹사이트 빌더와 코드 에이전트 비교" });
  await expect(table.getByRole("columnheader")).toHaveText(["웹사이트 빌더", "코드 에이전트"]);
  await expect(table.getByRole("rowheader")).toHaveCount(4);
  await capture("4-why-agent");

  await advance();
  await expect(page.getByRole("heading", { name: "요즘 많이 쓰는 코드 에이전트" })).toBeVisible();
  await expect(body.getByText("Claude Code", { exact: true }).first()).toBeVisible();
  await expect(body).toContainText("이 클래스에서 써요");
  await expect(body).toContainText("2026년 11월 기준");
  await capture("5-agent-names");

  // 연습 창에서 한 일은 다른 화면에 다녀와도 남는다.
  await page.getByRole("button", { name: /이전 설명/ }).click();
  await page.getByRole("button", { name: /이전 설명/ }).click();
  await expect(tryout).toContainText("새 파일");
  await next.click();
  await next.click();
  await expect(progress).toHaveText("5 / 6");

  await advance();
  await expect(page.getByRole("heading", { name: "오늘 알게 된 것" })).toBeVisible();
  await expect(body.getByRole("listitem")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: /1-3\s*AI를 쓰는 만큼/ })).toBeVisible();
  await capture("6-recap");
  await page.getByRole("button", { name: "학습 마치고 단원 지도로 →", exact: true }).click();
  await expect(page).toHaveURL(/\?view=map$/);
});

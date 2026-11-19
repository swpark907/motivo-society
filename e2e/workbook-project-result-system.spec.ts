import { expect, test, fillPlanWithExample, type Page } from "./workbook-test";
import { workbookCourse } from "../src/lib/workbook-course";

const [, unitTwo, unitThree] = workbookCourse;

/** 2-1을 예시로 채우고 2-2를 "예시로 따라가기"로 마친 뒤 2-3에 들어간다. */
async function reachResult(page: Page) {
  await page.goto("/workbook/classes/vibe-web/lessons/page-planning");
  await fillPlanWithExample(page, { toRequest: true });
  const next = page.getByRole("button", { name: /^다음으로/ });
  await page.getByRole("button", { name: "메모로 옮기기 →", exact: true }).click();
  await next.click();
  await next.click();
  await page.getByRole("button", { name: /예시로 따라갈게요$/ }).click();
  await next.click();
  await next.click();
  await page.getByRole("button", { name: /^다음 수업 2-3/ }).click();
  await expect(page).toHaveURL(/page-building$/);
}

test("2-3은 설계도와 대조하고, 버튼을 알고, 한 곳만 고치고, 전후를 비교한 뒤 3단원으로 간다", async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await reachResult(page);
  const body = page.getByLabel("수업 내용", { exact: true });
  const next = page.getByRole("button", { name: /^다음으로/ });
  async function capture(name: string) {
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
    if (testInfo.project.name === "desktop")
      await expect
        .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
        .toBeLessThanOrEqual(2);
  }

  // 1. 설계도 조각을 하나씩 대조한다. 연습 화면은 내용 순서가 일부러 다르다.
  await expect(
    page.getByRole("heading", { name: "설계도와 화면을 나란히 놓고 봐요" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "제목 있어요" }).click();
  await page.getByRole("button", { name: "소개 글 있어요" }).click();
  await page.getByRole("button", { name: "맨 아래 버튼 있어요" }).click();
  await page.getByRole("button", { name: "넣을 내용 순서 있어요" }).click();
  await expect(body).toContainText("다시 보세요");
  await page.getByRole("button", { name: "넣을 내용 순서 달라요" }).click();
  await expect(body).toContainText("찾았어요");
  await capture("result-1");

  // 2. 맨 아래 버튼을 눌러도 아무 일이 없고, 버튼은 모양과 하는 일로 나뉜다.
  await next.click();
  await page.getByRole("button", { name: "연락하기", exact: true }).click();
  await expect(body).toContainText("아무 일도 안 일어나네");
  await expect(body).toContainText(`${unitThree.number + 1}단원`);
  await capture("result-2");

  // 3. '달라요'로 표시한 곳 하나로 바꿀 것 / 그대로 둘 것 요청이 만들어진다.
  await next.click();
  await page.getByRole("button", { name: "넣을 내용 순서", exact: true }).click();
  const slip = page.getByRole("region", { name: "고쳐 달라는 요청" });
  await expect(slip).toContainText("내용 순서가 설계도와 달라. 위에서부터");
  await expect(slip).toContainText("index.html만 고쳐줘");
  await capture("result-3");

  // 4. 전후 비교. 예시로 따라가면 도장 대신 나중에 해 볼 순서를 알려 준다.
  await next.click();
  await expect(page.getByRole("slider", { name: "고치기 전과 고친 뒤 비교" })).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(body).toContainText("컴퓨터가 준비되면");
  await capture("result-4");

  // 5. 오늘 알게 된 것 + 2단원 한 장 → 3단원 지도에 도착.
  await next.click();
  await expect(
    page.getByRole("list", { name: "오늘 알게 된 것" }).getByRole("listitem"),
  ).toHaveCount(4);
  await expect(page.getByRole("list", { name: `${unitTwo.number}단원 한 장 정리` })).toContainText(
    "AI와 함께 만든 작업들",
  );
  await capture("result-5");
  await page
    .getByRole("button", { name: `${unitThree.number}단원 시작하기 →`, exact: true })
    .click();
  await expect(page.getByText(`${unitTwo.number}단원을 마쳤어요.`)).toBeVisible();
  const start = page.getByRole("button", { name: `${unitThree.lessons[0].title} 수업 시작` });
  await expect(start).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath("unit-3-arrival.png") });
});

import { expect, test, fillPlanWithExample } from "./workbook-test";
import { workbookCourse } from "../src/lib/workbook-course";

const plan = workbookCourse[1].lessons[0];

test("2-2는 기획을 메모로 옮기고, 고쳐 달라고 하고, 답하는 법과 바뀌는 부분 읽기를 배운다", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workbook/classes/vibe-web/lessons/page-planning");
  await fillPlanWithExample(page, { toRequest: true });
  await expect(page).toHaveURL(/page-request$/);
  const body = page.getByLabel("수업 내용", { exact: true });
  const next = page.getByRole("button", { name: /^다음으로/ });
  const progress = page.getByLabel("현재 학습 단계", { exact: true });
  async function capture(name: string) {
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
    if (testInfo.project.name === "desktop")
      await expect
        .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
        .toBeLessThanOrEqual(2);
  }

  // 1. 기획을 네 칸 메모로 옮긴다. 입력 칸은 없다.
  await expect(body.getByRole("textbox")).toHaveCount(0);
  const memo = page.getByRole("region", { name: "기획을 옮긴 메모" });
  await expect(memo).not.toContainText("AI와 함께 만든 작업들");
  await page.getByRole("button", { name: "메모로 옮기기 →", exact: true }).click();
  await expect(memo).toContainText("“AI와 함께 만든 작업들”");
  await expect(memo).toContainText(`← ${plan.number} 제목`);
  await expect(memo).toContainText("나에게 하나씩 물어보고 채워줘");
  await capture("request-1");

  // 2. "새 폴더나 새 파일은 만들지 마"를 켜면 같은 index.html이 고쳐진다.
  await next.click();
  await expect(progress).toHaveText(/2 \/ 5$/);
  const tree = page.getByRole("list", { name: "작업 폴더 안" });
  await expect(tree).toContainText("my-first-web-2");
  await page.getByRole("switch").click();
  await expect(tree).not.toContainText("my-first-web-2");
  await expect(tree).toContainText("고쳐졌어요");
  await capture("request-2");

  // 3. 보낼 메모와, AI의 질문에 아는 만큼만 답하는 예시. 실습 방식을 고른다.
  await next.click();
  await expect(body).toContainText("‘해 본 작업’에는 구체적으로 어떤 내용을 적을까요?");
  await expect(body).toContainText("아직 정하지 않았어. 버튼만 두고, 누르면 갈 곳은 비워 둬.");
  await expect(body).toContainText("아는 것만 답하고, 없으면 없다고");
  await page.getByRole("button", { name: /예시로 따라갈게요$/ }).click();
  await capture("request-3");

  // 4. 연습용 승인 창에서 부탁하지 않은 줄을 찾는다.
  await next.click();
  await page.getByRole("button", { name: /제목: AI와 함께 만든 작업들/ }).click();
  await expect(body).toContainText("부탁하지 않은 줄이 하나 더 있어요");
  await page.getByRole("button", { name: /웹 개발 경력 3년/ }).click();
  await expect(body).toContainText("찾았어요. 이럴 땐 승인하지 말고 거절한 뒤");
  await capture("request-4");

  // 5. 오늘 알게 된 것 + 보낸 메모 → 다음 수업 2-3.
  await next.click();
  await expect(
    page.getByRole("list", { name: "오늘 알게 된 것" }).getByRole("listitem"),
  ).toHaveCount(4);
  await expect(body).toContainText("예시로 따라왔어요");
  await capture("request-5");
  await page.getByRole("button", { name: /^다음 수업 2-3/ }).click();
  await expect(page).toHaveURL(/page-building$/);
});

test("2-2에서 실습 방식을 고르지 않았으면 다음 수업 대신 보내기 화면을 알려 준다", async ({
  page,
}) => {
  await page.goto("/workbook/classes/vibe-web/lessons/page-planning");
  await fillPlanWithExample(page, { toRequest: true });
  const next = page.getByRole("button", { name: /^다음으로/ });
  for (let i = 0; i < 4; i++) await next.click();
  await page.getByRole("button", { name: /^다음 수업 2-3/ }).click();
  await expect(page).toHaveURL(/page-request$/);
  await expect(
    page.getByRole("alert").filter({ hasText: "메모를 보냈는지 예시로 따라갈지" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "보내기 화면으로 가기", exact: true }).click();
  await expect(page.getByRole("heading", { name: /메모를 보내고/ })).toBeVisible();
});

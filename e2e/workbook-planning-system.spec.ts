import { expect, test } from "./workbook-test";
import { workbookCourse } from "../src/lib/workbook-course";

test("수업 정리에서 다음 수업으로 바로 넘어가고, 1단원을 마치면 2단원 지도로 간다", async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  const [unitOne, unitTwo] = workbookCourse;
  const next = page.getByRole("button", { name: /^다음으로/ });
  await page.goto(`/workbook/classes/vibe-web/lessons/${unitOne.lessons[0].slug}`);

  // 1-1~1-5: 정리 화면의 "다음 수업" 버튼으로 바로 다음 수업(표지)으로 간다. 옆에는 "단원 지도로".
  for (const [index, lesson] of unitOne.lessons.slice(0, -1).entries()) {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(lesson.title);
    for (let i = 0; i < 5; i++) await next.click();
    const following = unitOne.lessons[index + 1];
    await expect(page.getByRole("button", { name: "단원 지도로", exact: true })).toBeVisible();
    if (index === 0) await page.screenshot({ path: testInfo.outputPath("1-1-finish.png") });
    await page
      .getByRole("button", { name: `다음 수업 ${following.number} ${following.title} 시작` })
      .click();
  }

  // 1-6: 소개 글을 붙여 넣고 정리까지. 1단원을 다 마쳤으니 주 버튼은 "2단원 시작하기".
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(unitOne.lessons[5].title);
  await next.click();
  await page
    .getByRole("textbox", { name: /지난 수업에서 받은 소개 글/ })
    .fill("안녕하세요, 저는 박모쏘예요.");
  for (let i = 0; i < 4; i++) await next.click();
  await expect(page.getByRole("complementary", { name: unitTwo.title })).toContainText(
    "1단원을 마쳤어요",
  );
  await page.getByRole("button", { name: `${unitTwo.number}단원 시작하기 →`, exact: true }).click();

  // 2단원 지도: 마침 줄과 2-1 카드, 시작 버튼에 포커스.
  await expect(page.getByRole("region", { name: `${unitTwo.title} 지도` })).toBeVisible();
  await expect(page.getByText("1단원을 마쳤어요.")).toBeVisible();
  const start = page.getByRole("button", { name: `${unitTwo.lessons[0].title} 수업 시작` });
  await expect(start).toBeFocused();
  await start.click();

  // 2-1: 1-6의 첫 화면(제목과 붙여 넣은 소개 글)을 이어받는다.
  await expect(page).toHaveURL(new RegExp(`/lessons/${unitTwo.lessons[0].slug}$`));
  const body = page.getByLabel("수업 내용", { exact: true });
  await expect(body).toContainText("내 소개");
  await expect(body).toContainText("안녕하세요, 저는 박모쏘예요.");
  await page.getByRole("button", { name: /^채용 담당자/ }).click();
  for (let i = 0; i < 5; i++) await next.click();
  await expect(page.getByRole("article", { name: "내 페이지 설계도" })).toContainText(
    "안녕하세요, 저는 박모쏘예요.",
  );
});

test("2-1은 쓰지 않고 고르며 기획의 다섯 가지를 배운다", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workbook/classes/vibe-web/lessons/page-planning");
  const progress = page.getByLabel("현재 학습 단계", { exact: true });
  const body = page.getByLabel("수업 내용", { exact: true });
  const next = page.getByRole("button", { name: /^다음으로/ });
  async function capture(name: string) {
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
    if (testInfo.project.name === "desktop")
      await expect
        .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
        .toBeLessThanOrEqual(2);
  }

  // 1. 같은 페이지, 다른 눈. 입력 칸이 없다.
  await expect(page.getByRole("heading", { name: "이 페이지는 누가 보게 될까요" })).toBeVisible();
  await expect(body.getByRole("textbox")).toHaveCount(0);
  await page.getByRole("button", { name: /^처음 온 손님/ }).click();
  await expect(body).toContainText(
    "무엇을 해 주는지, 어떻게 신청하는지 알고 싶은데, 이 페이지엔 아직 그 내용이 없네요",
  );
  await capture("plan-1");

  // 2. 간판과 출구: 제목 스티커에 카피바라가 반응하고, 버튼 조각이 맨 아래에 끼워진다.
  await next.click();
  await expect(progress).toHaveText(/2 \/ 6$/);
  await page.getByRole("button", { name: "내 소개", exact: true }).click();
  await expect(body).toContainText("무엇을 소개하는 페이지인지 모르겠어요");
  await page.getByRole("button", { name: "처음 오신 분을 위한 안내", exact: true }).click();
  await expect(body).toContainText("바로 알겠어요");
  await expect(page.getByRole("button", { name: /^신청하기/ })).toContainText("추천");
  await page.getByRole("button", { name: /^신청하기/ }).click();
  await expect(body).toContainText("‘신청하기’ 버튼을 누르면 되겠네요");
  await capture("plan-2");

  // 3. 지금과 나중: 한 장씩 보내고, 상자의 카드는 눌러서 되돌린다.
  await next.click();
  const nowPile = page.getByRole("region", { name: "지금 넣을 내용" });
  const laterPile = page.getByRole("region", { name: "나중에 채울 내용" });
  await page.getByRole("button", { name: "지금 넣기 →", exact: true }).click();
  await page.getByRole("button", { name: "← 나중에 채우기", exact: true }).click();
  await expect(laterPile).toContainText("요일과 장소");
  await page.getByRole("button", { name: "요일과 장소 카드 다시 가져오기" }).click();
  await expect(laterPile).not.toContainText("요일과 장소");
  await page.getByRole("button", { name: "지금 넣기 →", exact: true }).click();
  await page.getByRole("button", { name: "지금 넣기 →", exact: true }).click();
  await expect(nowPile).toContainText("신청 방법");
  await capture("plan-3");

  // 4. 위에서부터: 카드를 위로 올리면 첫 화면 선 위로 간다.
  await next.click();
  const cards = page
    .getByRole("list")
    .filter({ hasText: "여기까지가 첫 화면" })
    .getByRole("listitem");
  await expect(cards.nth(2)).toContainText("신청 방법");
  await page.getByRole("button", { name: "신청 방법 위로" }).click();
  await expect(cards.nth(1)).toContainText("신청 방법");
  await capture("plan-4");

  // 5. 캐묻기: 질문이 내 설계도에서 나오고, 스킬을 짧게 소개한다.
  await next.click();
  await page.getByRole("button", { name: "질문 받기", exact: true }).click();
  await expect(body).toContainText("‘무엇을 해 주는지’에는");
  await page.getByRole("button", { name: "질문 하나 더 받기", exact: true }).click();
  await expect(body).toContainText("‘신청하기’ 버튼을 누르면 어떤 화면으로 가야 하나요?");
  await expect(body).toContainText("grill-me");
  await expect(body).toContainText("심화 강의에서");
  await capture("plan-5");

  // 6. 오늘 알게 된 것 + 조립된 설계도 → 다음 수업 2-2.
  await next.click();
  await expect(
    page.getByRole("list", { name: "오늘 알게 된 것" }).getByRole("listitem"),
  ).toHaveCount(5);
  const sheet = page.getByRole("article", { name: "내 페이지 설계도" });
  await expect(sheet).toContainText("처음 오신 분을 위한 안내");
  await expect(sheet).toContainText("신청하기");
  await expect(sheet).toContainText("AI가 물어보고 함께 채워요");
  await capture("plan-6");
  await page.getByRole("button", { name: /^다음 수업 2-2/ }).click();
  await expect(page).toHaveURL(/page-request$/);
  await page.getByRole("button", { name: "내 기획으로 요청 초안 만들기", exact: true }).click();
  await next.click();
  const request = page.getByRole("textbox", { name: "내 제작 요청", exact: true });
  await expect(request).toHaveValue(/처음 오신 분을 위한 안내/);
  await expect(request).toHaveValue(/신청 방법\n무엇을 해 주는지|무엇을 해 주는지\n신청 방법/);
  await expect(request).toHaveValue(/나에게 하나씩 물어보고 채워줘/);
});

test("비어 있는 곳이 있으면 다음 수업 대신 고르러 갈 곳을 알려 준다", async ({ page }) => {
  await page.goto("/workbook/classes/vibe-web/lessons/page-planning");
  const next = page.getByRole("button", { name: /^다음으로/ });
  for (let i = 0; i < 5; i++) await next.click();
  await page.getByRole("button", { name: /^다음 수업 2-2/ }).click();
  await expect(page).toHaveURL(/page-planning$/);
  await expect(
    page.getByRole("alert").filter({ hasText: "아직 비어 있는 곳을 먼저 골라 주세요" }),
  ).toContainText("읽을 사람 고르러 가기");
  await page.getByRole("button", { name: "읽을 사람 고르러 가기", exact: true }).click();
  await expect(page.getByRole("heading", { name: "이 페이지는 누가 보게 될까요" })).toBeVisible();
});

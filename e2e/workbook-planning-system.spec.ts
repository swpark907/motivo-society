import { expect, test, fillPlanWithExample, type Page } from "./workbook-test";
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
  await expect(
    page
      .getByRole("region", { name: `${unitTwo.title} 지도` })
      .getByRole("button", { name: /^2-\d / }),
  ).toHaveCount(unitTwo.lessons.length);
  await page.screenshot({ path: testInfo.outputPath("unit-2-arrival.png") });
  await start.click();

  // 2-1: 1-6의 첫 화면(제목과 붙여 넣은 소개 글)을 이어받는다.
  await expect(page).toHaveURL(new RegExp(`/lessons/${unitTwo.lessons[0].slug}$`));
  const body = page.getByLabel("수업 내용", { exact: true });
  await expect(body).toContainText("내 소개");
  await expect(body).toContainText("안녕하세요, 저는 박모쏘예요.");
});

type Capture = (name: string) => Promise<void>;
function captureFor(
  page: Page,
  testInfo: { project: { name: string }; outputPath: (name: string) => string },
): Capture {
  const body = page.getByLabel("수업 내용", { exact: true });
  return async (name) => {
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
    if (testInfo.project.name === "desktop")
      await expect
        .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
        .toBeLessThanOrEqual(2);
  };
}

test("2-1은 읽을 사람 · 상황 · 목적 · 기준을 고르고 2-2로 간다", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  const capture = captureFor(page, testInfo);
  await page.goto("/workbook/classes/vibe-web/lessons/page-planning");
  const body = page.getByLabel("수업 내용", { exact: true });
  const next = page.getByRole("button", { name: /^다음으로/ });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("누구를 위한 페이지인가");
  await expect(body.getByRole("textbox")).toHaveCount(0);

  // 1. 같은 페이지, 다른 눈
  await page.getByRole("button", { name: /^처음 온 손님/ }).click();
  await expect(body).toContainText("알고 싶은데, 이 페이지엔 아직 그 내용이 없네요");
  await capture("audience-1");

  // 2. 상황: 고를 때마다 첫 화면에 먼저 보여야 할 것이 적힌다.
  await next.click();
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await page.getByRole("button", { name: "컴퓨터", exact: true }).click();
  await page.getByRole("button", { name: "차분히 읽기", exact: true }).click();
  const needs = page.getByRole("figure", { name: "첫 화면에 먼저 보여야 할 것" });
  await expect(needs).toContainText("검색한 말이 제목이나 첫 문장에 보이기");
  await expect(needs).toContainText("컴퓨터로 볼 때");
  await capture("audience-2");

  // 3. 목적 = 맨 아래 버튼
  await next.click();
  await expect(page.getByRole("button", { name: /^신청하기/ })).toContainText("추천");
  await page.getByRole("button", { name: /^신청하기/ }).click();
  await expect(body).toContainText("‘신청하기’ 버튼을 누르면 되겠네요");
  await capture("audience-3");

  // 4. 잘 됐다는 기준
  await next.click();
  await page.getByRole("button", { name: /^3초 안에 무슨 페이지인지/ }).click();
  await page.getByRole("button", { name: /^읽을 사람이 찾는 내용이/ }).click();
  await expect(body).toContainText("2개 골랐어요");
  await expect(page.getByRole("button", { name: /^읽을 사람이 찾는 내용이/ })).toContainText(
    "내 상황에 맞아요",
  );
  await capture("audience-4");

  // 정리 → 2-2
  await next.click();
  const decided = page.getByRole("definition").filter({ hasText: "검색 · 컴퓨터 · 차분히 읽기" });
  await expect(decided).toBeVisible();
  await capture("audience-5");
  await page.getByRole("button", { name: /^다음 수업 2-2/ }).click();
  await expect(page).toHaveURL(/page-references$/);
});

test("2-2는 예시 페이지를 뜯어보고 가져올 것과 뺄 것을 고른다", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  const capture = captureFor(page, testInfo);
  await page.goto("/workbook/classes/vibe-web/lessons/page-references");
  const body = page.getByLabel("수업 내용", { exact: true });
  const next = page.getByRole("button", { name: /^다음으로/ });
  await expect(page.getByRole("figure", { name: /^예시 [ABC]/ })).toHaveCount(3);
  await capture("references-1");

  await next.click();
  await page.getByRole("button", { name: /^맨 위 큰 사진/ }).click();
  await expect(body).toContainText("첫눈에 분위기와 주제를 보여 줘요");
  await expect(body).toContainText("1 / 9개 찾았어요");
  await capture("references-2");

  await next.click();
  await page.getByRole("button", { name: "카드 목록 가져오기", exact: true }).click();
  await page.getByRole("button", { name: "화면을 채우는 한 문장 빼기", exact: true }).click();
  await expect(body).toContainText("가져올 것 1개를 골랐어요");
  await capture("references-3");

  await next.click();
  await expect(body).toContainText("구조와 순서만");
  await expect(body).toContainText("세 가지 유형으로 알려줘");
  await capture("references-4");

  await next.click();
  await expect(page.getByRole("definition").filter({ hasText: "카드 목록" })).toBeVisible();
  await page.getByRole("button", { name: /^다음 수업 2-3/ }).click();
  await expect(page).toHaveURL(/page-structure$/);
});

test("2-3은 내용을 고르고 순서를 정하고 칸을 그린다", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  const capture = captureFor(page, testInfo);
  await page.goto("/workbook/classes/vibe-web/lessons/page-structure");
  const next = page.getByRole("button", { name: /^다음으로/ });
  const now = page.getByRole("button", { name: "지금 넣기 →", exact: true });
  await now.click();
  await now.click();
  await page.getByRole("button", { name: "← 나중에 채우기", exact: true }).click();
  await expect(page.getByRole("region", { name: "나중에 채울 내용" })).toContainText(
    "자주 쓰는 도구",
  );
  await now.click();
  await capture("structure-1");
  await next.click();
  await expect(page.getByText("여기까지가 첫 화면")).toBeVisible();
  await capture("structure-2");
  await next.click();
  await page.getByRole("button", { name: /두 칸으로 나누기/ }).click();
  await expect(page.getByText(/두 칸으로 나누기 · 실제 종이와 펜으로/)).toBeVisible();
  await capture("structure-3");
  await next.click();
  await expect(page.getByRole("definition").filter({ hasText: "두 칸으로 나누기" })).toBeVisible();
  await capture("structure-4");
  await page.getByRole("button", { name: /^다음 수업 2-4/ }).click();
  await expect(page).toHaveURL(/page-brief$/);
});

test("2-4는 제목 · 버튼 문구 · 분위기를 정하고 기획서 한 장으로 모은다", async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  const capture = captureFor(page, testInfo);
  await page.goto("/workbook/classes/vibe-web/lessons/page-planning");
  await fillPlanWithExample(page);
  const sheet = page.getByRole("article", { name: "내 페이지 설계도" });
  await expect(sheet).toContainText("AI와 함께 만든 작업들");
  await expect(sheet).toContainText("작업 의뢰 문의하기");
  await expect(sheet).toContainText("인스타그램 링크 · 휴대폰 · 30초 훑어보기");
  await expect(sheet).toContainText("한 줄로 쌓기 · 차분한");
  await capture("brief-4");
  // 앞 화면들도 한 화면에 들어오는지 본다.
  const back = page.getByRole("button", { name: /이전 설명$/ });
  await back.click();
  await capture("brief-3");
  await back.click();
  await capture("brief-2");
  await back.click();
  await capture("brief-1");
  await page.getByRole("button", { name: /^다음으로/ }).click();
  await page.getByRole("button", { name: /^다음으로/ }).click();
  await page.getByRole("button", { name: /^다음으로/ }).click();
  await page.getByRole("button", { name: /^다음 수업 2-5/ }).click();
  await expect(page).toHaveURL(/page-request$/);
  await page.getByRole("button", { name: "메모로 옮기기 →", exact: true }).click();
  const memo = page.getByRole("region", { name: "기획을 옮긴 메모" });
  await expect(memo).toContainText("이 사람은 인스타그램 링크를 타고 들어와요.");
  await expect(memo).toContainText("‘작업 의뢰 문의하기’ 버튼");
  await expect(memo).toContainText("분위기는 차분하게.");
});

test("기획 칸이 비어 있으면 2-4를 마치는 대신 채우러 갈 수업을 알려 준다", async ({ page }) => {
  await page.goto("/workbook/classes/vibe-web/lessons/page-brief");
  const next = page.getByRole("button", { name: /^다음으로/ });
  for (let i = 0; i < 3; i++) await next.click();
  await page.getByRole("button", { name: /^다음 수업 2-5/ }).click();
  await expect(page).toHaveURL(/page-brief$/);
  await expect(
    page.getByRole("alert").filter({ hasText: "아직 비어 있는 곳을 먼저 골라 주세요" }),
  ).toContainText("읽을 사람 고르러 가기");
  await page.getByRole("button", { name: "읽을 사람 고르러 가기", exact: true }).click();
  await expect(page).toHaveURL(/page-planning$/);
});

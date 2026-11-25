import { expect, test } from "./workbook-test";
const base = "/workbook/classes/vibe-web";
test("지도 우측은 선택 수업·시작 중심이며 이용 안내는 패널 안에서 연다", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${base}?view=map`);
  const panel = page.getByRole("complementary", { name: "학습 패널" });
  await expect(panel).toBeVisible();
  await expect(panel.getByText("내 목표", { exact: true })).toHaveCount(0);
  await expect(panel.getByRole("button", { name: "목적 바꾸기" })).toHaveCount(0);
  const journey = page.getByRole("button", { name: "전체 과정 보기", exact: true });
  await journey.click();
  await expect(
    page.getByRole("dialog", { name: "배우고, 내 웹페이지를 만드는 다섯 과정" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "전체 과정 닫기", exact: true }).click();
  await expect(journey).toBeFocused();
  await page
    .getByRole("button", { name: /^1-1 AI란 무엇인가 (장소로 이동|학습 패널 열기)$/ })
    .click();
  const card = panel.getByRole("region", { name: "선택한 학습 장소", exact: true });
  await expect(card.getByRole("heading")).toHaveText("AI란 무엇인가");
  const start = card.getByRole("button", { name: "AI란 무엇인가 수업 시작", exact: true });
  await expect(start).toBeEnabled();
  await expect(start).toBeFocused();
  await expect(card.getByRole("heading")).toHaveCount(1);
  await expect(panel.getByRole("button", { name: "선택 접기", exact: true })).toHaveCount(0);
  // 수업에서 배울 내용은 접지 않고 카드 안에서 바로 보인다.
  const topics = card.getByRole("list", { name: "수업에서 배울 내용", exact: true });
  await expect(topics.getByRole("listitem")).toHaveCount(1);
  await expect(topics.getByRole("listitem").locator("strong")).toHaveText("생성형 AI");
  await expect(topics.getByRole("listitem")).toContainText("초안과 사실 확인");
  await page.screenshot({ path: testInfo.outputPath("map-sidebar.png") });
  await start.click();
  await expect(page).toHaveURL(`${base}/lessons/ai-understanding`);
  await page.getByRole("button", { name: "단원 지도 보기", exact: true }).click();
  await panel.getByText("이용 안내", { exact: true }).click();
  await expect(panel).toContainText("새로고침하면 초기화");
  await expect(panel.locator("dt")).toHaveText([
    "지도 사용",
    "실습 환경",
    "학습 기록",
    "계정 저장",
  ]);
  await page.screenshot({ path: testInfo.outputPath("map-info-open.png") });
  await panel.getByRole("button", { name: "카피바라 이야기 더 보기 · 선택", exact: true }).click();
  await expect(page.getByRole("heading", { name: "작은 작업실에서 시작된 여행" })).toBeVisible();
});

for (const [route, name, unit] of [
  ["page-planning", "누구를 위한 페이지인가", "기획하고 첫 화면 만들기"],
  ["screen-observation", "두 화면에서 문제 찾기", "반응형 화면 만들기"],
  ["interaction", "입력과 화면 변화", "기능과 데이터 저장"],
  ["publish-check", "공개 전 점검", "배포하고 고치기"],
]) {
  test(`${name} 지도도 공통 선택 수업 카드를 사용한다`, async ({ page }) => {
    await page.goto(`${base}/lessons/${route}`);
    await page.getByRole("button", { name: "단원 지도 보기", exact: true }).click();
    await page.getByRole("button", { name: new RegExp(`^\\d-\\d ${name} 선택$`) }).click();
    const panel = page.getByRole("complementary", { name: "학습 패널" });
    const card = panel.getByRole("region", { name: "선택한 학습 장소", exact: true });
    await expect(card.getByRole("heading")).toHaveText(name);
    await expect(
      card.getByRole("button", { name: `${name} 수업 시작`, exact: true }),
    ).toBeEnabled();
    await expect(card.getByRole("button", { name: "선택 접기", exact: true })).toHaveCount(0);
    const overview = page.getByRole("button", { name: "전체 과정 보기", exact: true });
    const before = await overview.boundingBox();
    const map = page.getByRole("region", { name: `${unit} 지도`, exact: true });
    await map.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    expect((await overview.boundingBox())!.x).toBeCloseTo(before!.x, 0);
  });
}

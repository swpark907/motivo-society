import { expect, test } from "./workbook-test";
const base = "/workbook/classes/vibe-web";
test("지도 우측은 선택 수업·시작 중심이며 도움말은 맵 위에서 연다", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${base}?view=map`);
  const panel = page.getByRole("complementary", { name: "학습 패널" });
  await expect(panel).toBeVisible();
  await expect(panel.getByText("내 목표", { exact: true })).toHaveCount(0);
  await expect(panel.getByRole("button", { name: "목적 바꾸기" })).toHaveCount(0);
  await expect(panel.getByText("지도 도움말", { exact: true })).toHaveCount(0);
  const help = page.getByRole("button", { name: "지도 도움말", exact: true });
  await help.focus();
  const helpBox = await help.boundingBox();
  const canvasBox = await help.locator("../..").boundingBox();
  expect(helpBox!.width).toBe(28);
  expect(helpBox!.height).toBe(28);
  await expect(help).toHaveCSS("border-radius", "4px");
  const journey = page.getByRole("button", { name: "전체 과정 보기", exact: true });
  const journeyBox = await journey.boundingBox();
  expect(journeyBox!.height).toBe(28);
  expect(journeyBox!.x - canvasBox!.x).toBeLessThan(24);
  expect(journeyBox!.y - canvasBox!.y).toBeLessThan(24);
  expect(helpBox!.y - canvasBox!.y).toBeLessThan(24);
  expect(canvasBox!.x + canvasBox!.width - helpBox!.x - helpBox!.width).toBeLessThan(24);
  const tooltipBox = await page.getByRole("tooltip").boundingBox();
  expect(tooltipBox!.x + tooltipBox!.width).toBeLessThanOrEqual(helpBox!.x);
  await page.screenshot({ path: testInfo.outputPath("map-help-open.png") });
  await expect(page.getByRole("tooltip")).toBeVisible();
  await help.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await journey.click();
  await expect(
    page.getByRole("dialog", { name: "배우고, 내 웹페이지를 만드는 다섯 과정" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "전체 과정 닫기", exact: true }).click();
  await expect(journey).toBeFocused();
  await help.click();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page
    .getByRole("button", { name: /^1-1 AI 이해하기 (장소로 이동|학습 패널 열기)$/ })
    .click();
  const card = panel.getByRole("region", { name: "선택한 학습 장소", exact: true });
  await expect(card.getByRole("heading")).toHaveText("AI 이해하기");
  const start = card.getByRole("button", { name: "AI 이해하기 수업 시작", exact: true });
  await expect(start).toBeEnabled();
  await expect(start).toBeFocused();
  await expect(card.getByRole("heading")).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath("map-sidebar.png") });
  await expect(panel.getByRole("button", { name: "선택 접기", exact: true })).toHaveCount(0);
  await card.locator("summary").filter({ hasText: "수업에서 배울 내용" }).click();
  await expect(card.getByRole("listitem")).toHaveCount(1);
  await expect(card.getByRole("listitem").locator("strong")).toHaveText("생성형 AI");
  await expect(card.getByRole("listitem").locator("span")).toHaveText("초안과 사실 확인");
  await page.screenshot({ path: testInfo.outputPath("map-topics-open.png") });
  await start.click();
  await expect(page).toHaveURL(`${base}/lessons/ai-understanding`);
  await page.getByRole("button", { name: "단원 지도 보기", exact: true }).click();
  await panel.getByText("이용 안내", { exact: true }).click();
  await expect(panel).toContainText("새로고침하면 초기화");
  await expect(panel.locator("dt")).toHaveText([
    "선택 심화",
    "실습 환경",
    "학습 기록",
    "계정 저장",
  ]);
  await page.screenshot({ path: testInfo.outputPath("map-info-open.png") });
  await panel.getByRole("button", { name: "카피바라 이야기 더 보기 · 선택", exact: true }).click();
  await expect(page.getByRole("heading", { name: "작은 작업실에서 시작된 여행" })).toBeVisible();
});

for (const [route, name] of [
  ["page-planning", "홈페이지 기획하기"],
  ["screen-observation", "두 화면에서 문제 찾기"],
  ["interaction", "입력과 화면 변화"],
  ["publish-check", "공개 전 점검"],
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
    await card.locator("summary").filter({ hasText: "수업에서 배울 내용" }).click();
    await expect(card.getByRole("listitem").first()).toBeVisible();
    const overview = page.getByRole("button", { name: "전체 과정 보기", exact: true });
    const before = await overview.boundingBox();
    const map = page.getByRole("region", {
      name: `${name === "홈페이지 기획하기" ? "기획하고 첫 화면 만들기" : name === "두 화면에서 문제 찾기" ? "반응형 화면 만들기" : name === "입력과 화면 변화" ? "기능과 데이터 저장" : "배포하고 고치기"} 지도`,
      exact: true,
    });
    await map.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    expect((await overview.boundingBox())!.x).toBeCloseTo(before!.x, 0);
    await expect(page.getByRole("button", { name: "지도 도움말", exact: true })).toBeVisible();
  });
}

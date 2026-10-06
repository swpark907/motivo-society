import { expect, test } from "@playwright/test";

test("책상 실험에서 힌트를 받고 배치를 완성한 뒤 AI 요청으로 연결한다", async ({ page }) => {
  await page.goto("/demo/workbook-desk");
  const desk = page.getByRole("group", { name: "책상 위 물건" });
  await expect(desk).toHaveCSS("flex-direction", "row");
  await page.getByRole("button", { name: "배치 확인하기" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "물건 사이에 조금 더 여유를 줘볼까요?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "↔ 가로", exact: true }).click();
  const slider = page.getByRole("slider", { name: /얼마나 떨어뜨릴까요/ });
  await slider.focus();
  await page.keyboard.press("Home");
  for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "가운데", exact: true }).click();
  await page.getByRole("button", { name: "배치 확인하기" }).click();
  await expect(page.getByText("도전 성공!", { exact: false })).toBeVisible();
  await expect(desk).toHaveCSS("gap", "24px");
  await expect(desk).toHaveCSS("justify-content", "center");
  await expect(page.locator("pre")).toContainText("flex-direction: row");
  await expect(page.getByRole("textbox", { name: "현재 설정으로 만든 요청 문장" })).toHaveValue(
    /간격은 24px/,
  );
  await page.getByRole("button", { name: "웹 카드에 적용하기", exact: true }).click();
  const cards = page.getByRole("group", { name: "웹 카드 미리보기" });
  await expect(cards).toHaveCSS("flex-direction", "row");
  await expect(cards).toHaveCSS("gap", "24px");
  await expect(page.getByRole("textbox", { name: "현재 설정으로 만든 요청 문장" })).toHaveValue(
    /소개, 작업, 기록/,
  );
  await page.getByRole("button", { name: "↕ 세로", exact: true }).click();
  await expect(cards).toHaveCSS("flex-direction", "column");
  await expect(page.getByText("도전 성공!", { exact: false })).toHaveCount(0);
  await expect(page.locator("pre")).toContainText("flex-direction: column");
  await page.getByRole("button", { name: "↔ 가로", exact: true }).click();
  await slider.focus();
  await page.keyboard.press("Home");
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "배치 확인하기" }).click();
  await expect(page.getByText("도전 성공!", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "영역·간격 보기" }).click();
  await expect(page.getByRole("button", { name: "영역·간격 숨기기" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "영역·간격 숨기기" }).click();
  await expect(page.getByRole("button", { name: "영역·간격 보기" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.getByRole("button", { name: "처음으로", exact: true }).click();
  await expect(page.getByRole("button", { name: "웹 카드에 적용하기", exact: true })).toBeVisible();
  await expect(cards).toHaveCSS("flex-direction", "column");
  await expect(slider).toHaveValue("8");
  await expect(page.getByRole("button", { name: "원리 먼저 살펴보기" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page.getByRole("link", { name: "워크북 홈" }).click();
  await expect(page).toHaveURL(/\/workbook$/);
});

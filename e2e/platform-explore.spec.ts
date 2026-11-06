import { expect, test } from "@playwright/test";

// L04 발견: 비로그인도 보고, 필터는 URL에 담겨 공유·새로고침에서 그대로다.
test.describe("발견", () => {
  test("필터 없이 오면 이번 주 → 합류 가능 → 전체 순서로 보인다", async ({ page }) => {
    await page.goto("/explore");
    const sections = page.locator("main section h2");
    await expect(sections).toHaveText([
      "이번 주에 열리는 것",
      "지금 합류할 수 있어요",
      "전체 활동",
    ]);
    const all = page.getByRole("region", { name: "전체 활동" });
    await expect(all.getByText("오늘 저녁 온라인 모각코")).toBeVisible();
    await expect(all.getByText("4주 바이브코딩 시즌")).toBeVisible();
    // 초안·끝난 활동·회차는 따로 보이지 않는다
    await expect(page.getByText("(작성 중) 밤 산책 회고")).toHaveCount(0);
    await expect(page.getByText("지난주 온라인 모각코")).toHaveCount(0);
    await expect(page.getByText(/시즌 1회차/)).toHaveCount(0);
  });

  test("칩을 누르면 URL에 담기고, 다시 누르면 풀린다", async ({ page }) => {
    await page.goto("/explore");
    const filters = page.getByRole("navigation", { name: "활동 거르기" });
    await filters.getByRole("link", { name: "모임", exact: true }).click();
    await expect(page).toHaveURL(/\/explore\?kind=gathering$/);
    await filters.getByRole("link", { name: "오프라인", exact: true }).click();
    await expect(page).toHaveURL(/kind=gathering&format=offline$/);
    await expect(page.getByRole("heading", { name: /개 찾았어요/ })).toBeVisible();
    await expect(page.getByText("카피바라 카페에서 AI 수다")).toBeVisible();
    await expect(page.getByText("오늘 저녁 온라인 모각코")).toHaveCount(0);

    await filters.getByRole("link", { name: "오프라인, 선택됨" }).click();
    await expect(page).toHaveURL(/\/explore\?kind=gathering$/);
    await page.getByRole("link", { name: "필터 지우기" }).click();
    await expect(page).toHaveURL(/\/explore$/);
  });

  test("공유받은 필터 주소가 그대로 열리고, 맞는 게 없으면 넓히는 방법을 알려 준다", async ({
    page,
  }) => {
    await page.goto("/explore?kind=challenge&free=1");
    await expect(page.getByRole("link", { name: "챌린지, 선택됨" })).toBeVisible();
    await expect(page.getByRole("link", { name: "무료, 선택됨" })).toBeVisible();
    await expect(page.getByText("2주 매일 하나씩 만들기")).toBeVisible();

    await page.goto("/explore?kind=challenge&format=offline");
    await expect(page.getByRole("heading", { name: "조건에 맞는 활동이 없어요" })).toBeVisible();
    await page.getByRole("link", { name: "전체 활동 보기" }).click();
    await expect(page).toHaveURL(/\/explore$/);
  });

  test("카드에 남은 자리·가격·주최가 보인다", async ({ page }) => {
    await page.goto("/explore?kind=gathering");
    const card = page.locator("article", { hasText: "AI 도구 실습 워크숍" });
    await expect(card).toContainText("15,000원");
    await expect(card).toContainText("바라호스트");
    await expect(card).toContainText(/자리 남음|대기 신청 가능/);
  });
});

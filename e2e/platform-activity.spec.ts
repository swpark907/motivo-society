import { expect, test, type Page } from "@playwright/test";

// L05 활동 상세: DM 링크로 바로 들어와도 완결. 상태마다 신청 버튼 문구가 다르다.
// 신청 영역은 넓은 화면은 오른쪽 카드, 좁은 화면은 하단 고정 바에 있다.
function applyArea(page: Page, isMobile: boolean) {
  return isMobile
    ? page.locator("[class*=mobileBar]")
    : page.getByRole("complementary", { name: "신청" });
}

async function signInAs(page: Page, nickname: string, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByText("개발용 · 시험장 사람으로 들어가기").click();
  await page.getByRole("button", { name: new RegExp(nickname) }).click();
  await expect(page).toHaveURL(new RegExp(`${next}$`));
}

test.describe("활동 상세", () => {
  test("비로그인 직진입: 무엇·누가·언제·어디·자리·가격과 로그인하고 신청", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/activities/vibe-season-4w");
    await expect(
      page.getByRole("heading", { level: 1, name: "4주 바이브코딩 시즌" }),
    ).toBeVisible();
    await expect(page.getByText("진행 중 · 중간에 합류할 수 있어요")).toBeVisible();
    await expect(page.getByRole("heading", { name: "회차" })).toBeVisible();
    await expect(page.locator("#sessions li")).toHaveCount(4);
    await expect(page.getByRole("heading", { name: "여는 사람" })).toBeVisible();
    await expect(page.getByText(/7일 전까지 전액/)).toBeVisible();
    // 참가자 전용 정보는 보이지 않는다
    await expect(page.getByRole("heading", { name: "참가 정보" })).toHaveCount(0);

    const area = applyArea(page, isMobile);
    await expect(area.getByText("40,000원")).toBeVisible();
    await area.getByRole("link", { name: "로그인하고 신청" }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Factivities%2Fvibe-season-4w%2Fapply$/);
  });

  test("OG 메타가 있고 미리보기 이미지가 만들어진다", async ({ page, request }) => {
    await page.goto("/activities/capybara-cafe");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "카피바라 카페에서 AI 수다",
    );
    const image = await page.locator('meta[property="og:image"]').getAttribute("content");
    const res = await request.get(image!);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
  });

  test("회차 주소는 시즌으로, 없는 주소는 친절한 404", async ({ page }) => {
    await page.goto("/activities/vibe-season-4w-3");
    await expect(page).toHaveURL(/\/activities\/vibe-season-4w#sessions$/);
    const res = await page.goto("/activities/no-such-thing");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "이 활동을 찾을 수 없어요" })).toBeVisible();
    await page.getByRole("link", { name: "다른 활동 둘러보기" }).click();
    await expect(page).toHaveURL(/\/explore$/);
  });

  test("작성 중인 활동은 밖에서 보이지 않는다", async ({ page }) => {
    const res = await page.goto("/activities/draft-night-walk");
    expect(res?.status()).toBe(404);
  });

  test("확정된 참가자는 참가 확정과 상세 주소를 본다", async ({ page, isMobile }) => {
    await signInAs(page, "멤버하나", "/activities/capybara-cafe");
    await expect(applyArea(page, isMobile).getByRole("link", { name: /참가 확정/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "참가 정보" })).toBeVisible();
    await expect(page.getByText(/가짜 주소/)).toBeVisible();
  });

  test("클럽 밖 사람에게 멤버 전용 모임은 멤버 전용이라고 알린다", async ({ page, isMobile }) => {
    await signInAs(page, "처음온사람", "/activities/members-retro");
    await expect(applyArea(page, isMobile).getByRole("status")).toHaveText("클럽 멤버 전용");
  });

  test("발견 카드에서 상세로 들어간다", async ({ page }) => {
    await page.goto("/explore?kind=gathering&format=offline");
    await page.getByRole("link", { name: /AI 도구 실습 워크숍/ }).click();
    await expect(page).toHaveURL(/\/activities\/ai-tools-workshop$/);
  });
});

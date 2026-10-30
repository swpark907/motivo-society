import { expect, test } from "@playwright/test";

test("워크북 홈에서 웹페이지 클래스로 이동하고 앱·게임·영상은 준비 중으로 안내한다", async ({
  page,
}) => {
  await page.goto("/workbook");
  const classes = page.locator("#classes");
  await expect(classes.getByRole("heading", { level: 3 })).toHaveText([
    "AI와 만드는 나의 첫 웹페이지",
    "바이브코딩으로 만드는 나의 첫 앱",
    "바이브코딩으로 만드는 나의 첫 게임",
    "AI로 만드는 나의 첫 영상",
  ]);
  await expect(classes.getByRole("article")).toHaveCount(3);
  for (const title of [
    "바이브코딩으로 만드는 나의 첫 앱",
    "바이브코딩으로 만드는 나의 첫 게임",
    "AI로 만드는 나의 첫 영상",
  ]) {
    const upcoming = classes.getByRole("article", { name: title, exact: true });
    await expect(upcoming).toContainText("COMING SOON");
    await expect(upcoming).toContainText("기획 중");
    await expect(upcoming.getByRole("link")).toHaveCount(0);
    await expect(upcoming.getByRole("img")).toBeVisible();
  }
  await expect(classes.getByRole("list").getByRole("link").getByRole("img")).toHaveAttribute(
    "src",
    /vibe-web-cover-v2/,
  );
  await expect(page.locator("#results")).toHaveCount(0);
  await classes.getByRole("list").getByRole("link").click();
  await expect(page).toHaveURL(/\/workbook\/classes\/vibe-web$/);
  await expect(page.locator("#class-results-title")).toBeVisible();
});

test("작은 클래스 캐러셀에서 전체 격자 목록으로 이동하고 홈으로 돌아온다", async ({ page }) => {
  await page.goto("/workbook");
  const classes = page.locator("#classes");
  const track = classes.getByRole("list", { name: "클래스 목록" });
  await expect(classes.getByRole("button", { name: "이전 클래스", exact: true })).toBeDisabled();
  await classes.getByRole("button", { name: "다음 클래스", exact: true }).click();
  await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await classes.getByRole("button", { name: "이전 클래스", exact: true }).click();
  await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBe(0);
  await classes.getByRole("link", { name: "목록 더보기 →", exact: true }).click();
  await expect(page).toHaveURL(/\/workbook\/classes$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("만들면서 익히는 클래스");
  const list = page.getByRole("list", { name: "클래스 목록" });
  await expect(list.getByRole("listitem")).toHaveCount(4);
  await expect(list.getByRole("article")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "다음 클래스", exact: true })).toHaveCount(0);
  await list.getByRole("link").click();
  await expect(page).toHaveURL(/\/workbook\/classes\/vibe-web$/);
  await page.goBack();
  await page.getByRole("link", { name: "← 워크북 홈", exact: true }).click();
  await expect(page).toHaveURL(/\/workbook#classes$/);
  await expect(
    page.locator("#classes").getByRole("link", { name: "목록 더보기 →", exact: true }),
  ).toBeVisible();
});

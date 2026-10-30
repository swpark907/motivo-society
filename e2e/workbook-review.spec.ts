import { expect, test } from "@playwright/test";

test("격리 여정 비교안은 동일한 정보와 키보드·뒤로 가기를 유지한다", async ({ page }) => {
  await page.goto("/demo/workbook-journey-review?view=a");
  const choices = page.getByRole("navigation", { name: "여정 비교안" });
  const titles = [
    "AI 도구 준비하기",
    "기획하고 첫 화면 만들기",
    "반응형 화면 만들기",
    "기능과 데이터 저장",
    "배포하고 고치기",
  ];
  for (const view of ["b", "c"]) {
    await choices
      .getByRole("link", {
        name: view === "b" ? "B · 단계가 펼쳐지는 여정" : "C · 내 결과물 중심",
        exact: true,
      })
      .press("Enter");
    await expect(page).toHaveURL(new RegExp(`view=${view}`));
    await expect(page.getByRole("article")).toHaveCount(5);
    for (const title of titles)
      await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(
      page.getByText("2/5 학습 확인 · 실제 파일 적용 전", { exact: true }),
    ).toBeVisible();
    const summary = page.getByText("AI 도구 준비하기에서 배울 것 살펴보기", { exact: true });
    await summary.press("Enter");
    await expect(
      page.getByText("AI의 도움과 확인할 일을 구분해요", { exact: false }),
    ).toBeVisible();
    await summary.press("Space");
  }
  await page.goBack();
  await expect(page).toHaveURL(/view=b/);
  await expect(
    choices.getByRole("link", { name: "B · 단계가 펼쳐지는 여정", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("작은 여정 카드는 목표·상태와 반복 펼치기·접기·탐색을 유지한다", async ({ page }) => {
  await page.goto("/demo/workbook-journey-review?view=compact");
  await expect(page.getByRole("article")).toHaveCount(5);
  const first = page.getByRole("article", { name: "1. AI 도구 준비하기", exact: true });
  await expect(first.getByText("AI의 도움과 확인할 일을 구분해요", { exact: true })).toBeVisible();
  await expect(first.getByText("학습 중 · 2/5 확인", { exact: true })).toBeVisible();
  const summary = first.locator("summary");
  const result = first.getByText("남길 결과", { exact: true });
  for (let repeat = 0; repeat < 3; repeat++) {
    await summary.click();
    await expect(result).toBeVisible();
    await summary.click();
    await expect(result).toBeHidden();
  }
  await summary.press("Enter");
  await expect(result).toBeVisible();
  await summary.press("Space");
  await expect(result).toBeHidden();
  const final = page.getByRole("article", { name: "5. 배포하고 고치기", exact: true });
  await final.locator("summary").press("Enter");
  await expect(final.getByText("남길 결과", { exact: true })).toBeVisible();
  await summary.press("Enter");
  await expect(result).toBeVisible();
  await expect(final.getByText("남길 결과", { exact: true })).toBeHidden();
  await summary.press("Space");
  await page.getByRole("link", { name: "다음 행동 · 도구 준비하기 →", exact: true }).click();
  await expect(page.locator("#next")).toBeInViewport();
  await page.goBack();
  await expect(page).toHaveURL(/view=compact$/);
  await page.getByRole("link", { name: "A · 지도 전체 탐색", exact: true }).click();
  await expect(page).toHaveURL(/view=a$/);
  await page.goBack();
  await expect(page).toHaveURL(/view=compact$/);
  await expect(
    page.getByRole("link", { name: "A+B · 펼쳐진 지도 여정", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

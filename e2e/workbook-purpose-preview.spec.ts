import { expect, test } from "./workbook-test";

const headingText = "배우고 나면 이런 페이지를 만들 수 있어요";

test("예시를 둘러보고 큰 모달을 닫아도 강의로 이동하지 않는다", async ({ page }) => {
  await page.goto("/workbook/classes/vibe-web");
  await page.getByRole("button", { name: "강의 시작하기 ↗" }).click();
  const heading = page.getByRole("heading", { name: headingText });
  const preview = page.getByRole("complementary", { name: "페이지 예시 미리보기" });
  const start = page.getByRole("button", { name: "기초강의 시작하기 →" });
  await expect(start).toBeEnabled();
  await expect(preview.getByRole("heading")).toHaveText("서비스 소개");
  for (const [label, image] of [
    ["서비스 소개", "service"],
    ["포트폴리오", "portfolio"],
    ["좋아하는 것 모음", "personal"],
  ]) {
    const choice = page.getByRole("button", { name: new RegExp(`^${label} .*만들기$`) });
    await choice.click();
    await expect(choice).toHaveAttribute("aria-pressed", "true");
    await expect(heading).toBeVisible();
    await expect(preview.getByRole("img")).toHaveAttribute(
      "src",
      new RegExp(`${image}-website-v2`),
    );
    const trigger = preview.getByRole("button", { name: `${label} 예시 크게 보기` });
    await trigger.click();
    const modal = page.getByRole("dialog", { name: `${label} · 페이지 예시` });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("img")).toBeVisible();
    await expect(modal).toContainText("버튼과 링크는 동작하지 않아요");
    await expect(modal.getByRole("button", { name: "닫기 ×" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await modal.getByRole("button", { name: "닫기 ×" }).click();
    await expect(modal).not.toBeVisible();
    await expect(heading).toBeVisible();
  }
  await page.getByRole("button", { name: "← 클래스 소개로 돌아가기" }).click();
  await page.getByRole("button", { name: "강의 시작하기 ↗" }).click();
  await expect(heading).toBeVisible();
});

for (const example of [null, "서비스 소개", "포트폴리오", "좋아하는 것 모음"]) {
  test(`예시 ${example ?? "조작 없이"} 살펴본 후 같은 첫 강의를 시작한다`, async ({ page }) => {
    await page.goto("/workbook/classes/vibe-web");
    await page.getByRole("button", { name: "강의 시작하기 ↗" }).click();
    if (example)
      await page.getByRole("button", { name: new RegExp(`^${example} .*만들기$`) }).click();
    await page.getByRole("button", { name: "기초강의 시작하기 →" }).click();
    await expect(page.getByRole("heading", { name: headingText })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "단원 지도 보기", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "AI 이해하기", exact: true })).toBeVisible();
    await expect(page.getByText("내 목적과 연결하기", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "AI = 인공지능" })).toBeVisible();
    await expect(
      page.getByRole("region", { name: "메모에서 소개 문장으로", exact: true }),
    ).toContainText("창가 자리");
    await expect(
      page.getByRole("button", { name: "소개 문장으로 정리해보기", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "다음으로", exact: true }).click();
    await expect(page.getByRole("heading", { name: "생성형 AI", exact: true })).toBeVisible();
  });
}

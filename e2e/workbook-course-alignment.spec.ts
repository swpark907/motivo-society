import { expect, test } from "./workbook-test";
import { workbookCourse } from "../src/lib/workbook-course";
const base = "/workbook/classes/vibe-web";
const totals: Record<string, number> = {
  "ai-understanding": 5,
  "ai-tools": 11,
  "tool-setup": 12,
  "first-request": 8,
  "first-file": 10,
  "page-planning": 5,
  "page-request": 5,
  "page-building": 5,
  "screen-observation": 4,
  "screen-improvement": 4,
  "screen-check": 6,
  interaction: 5,
  "browser-storage": 6,
  "shared-data": 6,
  "publish-check": 6,
  "publish-address": 5,
  "publish-debug": 8,
};

for (const unit of workbookCourse) {
  test(`${unit.number}단원 소개·지도·수업 번호와 이름이 일치한다`, async ({ page }, testInfo) => {
    test.setTimeout(60000);
    if (testInfo.project.name === "desktop")
      await page.setViewportSize({ width: 1280, height: 720 });
    for (const lesson of unit.lessons) {
      await page.goto(`${base}/lessons/${lesson.slug}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(lesson.title);
      await expect(page.getByLabel("전체 과정 위치", { exact: true })).toHaveText(
        `${unit.number}단원 ${unit.title} › ${lesson.number}`,
      );
      await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText(
        `화면 1 / ${totals[lesson.slug] ?? 1}`,
      );
      const header = page.locator("[data-lesson-header]");
      await expect(header.getByRole("heading", { level: 1 })).toHaveCSS("font-size", "18px");
    }
    const first = unit.lessons[0];
    await page.goto(`${base}/lessons/${first.slug}`);
    await page.getByRole("button", { name: "단원 지도 보기", exact: true }).click();
    await expect(page).toHaveURL(/\?view=map$/);
    await page.getByRole("button", { name: new RegExp(`^${first.number} ${first.title}`) }).click();
    const card = page.getByRole("region", { name: "선택한 학습 장소", exact: true });
    await expect(card.getByRole("heading")).toHaveText(first.title);
    await expect(card).toContainText(`${unit.number}단원 ${unit.title} · ${first.number}`);
    await page.screenshot({ path: testInfo.outputPath(`unit-${unit.number}-map.png`) });
    const start = card.getByRole("button", { name: `${first.title} 수업 시작`, exact: true });
    await expect(start).toBeVisible();
    // 3~5단원의 기존 선행 완료 조건은 이 명칭 검수에서 우회하지 않는다.
    if (unit.number <= 2) {
      await start.click();
      await expect(page).toHaveURL(`${base}/lessons/${first.slug}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(first.title);
    }
  });
}

test("소개 페이지는 17개 실제 수업과 번호 없는 선택 심화를 구분한다", async ({
  page,
}, testInfo) => {
  await page.goto(base);
  for (const unit of workbookCourse) {
    const details = page.locator("details").filter({
      has: page.locator("summary").filter({ hasText: `${unit.number}단원${unit.title}` }),
    });
    await details.locator("summary").click();
    const list = page.getByRole("list", { name: `${unit.number}단원 기본 수업`, exact: true });
    await expect(list.getByRole("listitem")).toHaveCount(unit.lessons.length);
    for (const lesson of unit.lessons)
      await expect(list).toContainText(`${lesson.number}${lesson.title}`);
    await expect(list).not.toContainText("선택 심화");
    const optional = page.getByLabel(`${unit.number}단원 선택 심화`, { exact: true });
    await expect(optional).toContainText(unit.optionalTitle);
    await expect(optional).toContainText("기본 수업 완료 조건에 포함되지 않아요.");
  }
  await page
    .locator("#class-curriculum-title")
    .locator("..")
    .screenshot({ path: testInfo.outputPath("course-outline.png") });
});

for (const unit of workbookCourse) {
  test(`${unit.number}단원 심화는 기본 수업 번호와 별도다`, async ({ page }) => {
    await page.goto("/demo/workbook-map-points");
    await page
      .getByRole("navigation", { name: "검토할 지도" })
      .getByRole("button", { name: unit.title, exact: true })
      .click();
    await page.getByRole("button", { name: "선택 활동 화면 검토", exact: true }).click();
    await expect(page.getByLabel("전체 과정 위치", { exact: true })).toHaveText(
      `${unit.number}단원 ${unit.title} › 선택 심화`,
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(unit.optionalTitle);
    await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveCount(0);
    await expect(page.getByText("선택 과정 · 기본 수업과 별도", { exact: true })).toBeVisible();
  });
}

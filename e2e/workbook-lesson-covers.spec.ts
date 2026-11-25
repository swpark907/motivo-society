import { expect, test } from "@playwright/test";
import { workbookCourse } from "../src/lib/workbook-course";
import { workbookLessonCovers } from "../src/lib/workbook-lesson-covers";

const base = "/workbook/classes/vibe-web";
for (const unit of workbookCourse) {
  test(`${unit.number}단원의 모든 강의는 독립 표지 뒤 기존 본문으로 시작한다`, async ({
    page,
  }, info) => {
    test.setTimeout(120000);
    await page.setViewportSize(
      info.project.name === "desktop" ? { width: 1280, height: 720 } : { width: 320, height: 740 },
    );
    for (const lesson of unit.lessons) {
      await page.goto(`${base}/lessons/${lesson.slug}`);
      const cover = page.getByRole("region", { name: "강의 시작 표지", exact: true });
      await expect(cover).toBeVisible();
      await expect(cover.getByRole("heading", { level: 1 })).toHaveText(lesson.title);
      await expect(cover.getByRole("heading", { level: 1 })).toBeFocused();
      await expect(
        cover.getByRole("region", { name: "이번 강의의 목표" }).getByRole("listitem"),
      ).toHaveText(workbookLessonCovers[lesson.slug].goals);
      await expect(cover.getByRole("listitem")).toHaveCount(3);
      await expect(cover).toContainText(workbookLessonCovers[lesson.slug].summary);
      await expect(cover.getByText(/볼까요\?/)).toHaveCount(1);
      await expect(page.getByLabel("학습 안내", { exact: true })).toHaveCount(0);
      await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveCount(0);
      await expect(page.getByLabel("수업 내용", { exact: true })).toHaveCount(0);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          ),
        )
        .toBeLessThanOrEqual(2);
      await page.screenshot({ path: info.outputPath(`${lesson.slug}-cover.png`) });
      await cover.getByRole("button", { name: "시작하기", exact: true }).press("Enter");
      await expect(cover).toHaveCount(0);
      await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText(/^1 \//);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(lesson.title);
      await expect(page.getByRole("button", { name: "단원 지도 보기", exact: true })).toBeVisible();
      await expect(page.locator("[data-lesson-header]").getByRole("button")).toHaveCount(1);
      await page
        .getByLabel("학습 안내", { exact: true })
        .getByRole("button", { name: "← 표지로", exact: true })
        .click();
      await expect(cover).toBeVisible();
      await expect(page.getByLabel("학습 안내", { exact: true })).toHaveCount(0);
      await cover.getByRole("button", { name: "시작하기", exact: true }).click();
      await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText(/^1 \//);
    }
  });
}

test("표지를 닫아도 완료하지 않으며 시작 뒤 설명 위치는 지도 왕복에 남는다", async ({ page }) => {
  await page.goto(`${base}/lessons/ai-understanding`);
  const cover = page.getByRole("region", { name: "강의 시작 표지", exact: true });
  await expect(cover).toBeVisible();
  await cover.getByRole("button", { name: "단원 지도 보기", exact: true }).click();
  await expect(page.getByRole("region", { name: "배포하고 고치기 지도" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^1-2 어떤 AI를 쓸까/ }).first()).toBeDisabled();
  const resume = page.getByRole("button", { name: "AI란 무엇인가 수업 시작", exact: true });
  await resume.click();
  await expect(cover).toBeVisible();
  await cover.getByRole("button", { name: "시작하기", exact: true }).press("Space");
  const next = page.getByRole("button", { name: /^다음으로/ });
  await expect(next).toBeEnabled();
  await next.click();
  await next.click();
  await next.click();
  await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText("4 / 6");
  await page.getByRole("button", { name: "단원 지도 보기", exact: true }).click();
  await expect(page.getByRole("button", { name: /^1-2 어떤 AI를 쓸까/ }).first()).toBeDisabled();
  await resume.click();
  await expect(cover).toHaveCount(0);
  await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText("4 / 6");
});

test("제목 표지로 돌아갔다 시작해도 기획 선택을 보존한다", async ({ page }) => {
  await page.goto(`${base}/lessons/page-planning`);
  await page.getByRole("button", { name: "시작하기", exact: true }).click();
  const reader = page.getByRole("button", { name: /^채용 담당자/ });
  await reader.click();
  await expect(reader).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "← 표지로", exact: true }).press("Enter");
  await expect(page.getByRole("region", { name: "강의 시작 표지", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "시작하기", exact: true }).press("Space");
  await expect(reader).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /^다음으로/ })).toBeEnabled();
});

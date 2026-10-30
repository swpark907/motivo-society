import { expect, test } from "@playwright/test";
import { workbookCourse } from "../src/lib/workbook-course";
import { workbookLessonCovers } from "../src/lib/workbook-lesson-covers";

const base = "/workbook/classes/vibe-web";
for (const unit of workbookCourse) {
  test(`${unit.number}단원의 모든 강의는 독립 표지 뒤 기존 본문으로 시작한다`, async ({
    page,
  }, info) => {
    test.setTimeout(60000);
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
      await expect(page.getByLabel("현재 학습 단계", { exact: true })).toContainText("화면 1 /");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(lesson.title);
      await expect(page.getByRole("button", { name: "단원 지도 보기", exact: true })).toBeVisible();
      await expect(page.locator("[data-lesson-header]").getByRole("button")).toHaveCount(1);
      await page
        .getByLabel("학습 안내", { exact: true })
        .getByRole("button", { name: "이전 설명", exact: true })
        .click();
      await expect(cover).toBeVisible();
      await expect(page.getByLabel("학습 안내", { exact: true })).toHaveCount(0);
      await cover.getByRole("button", { name: "시작하기", exact: true }).click();
      await expect(page.getByLabel("현재 학습 단계", { exact: true })).toContainText("화면 1 /");
    }
  });
}

test("표지를 닫아도 완료하지 않으며 시작 뒤 설명 위치와 기존 조건은 지도 왕복에 남는다", async ({
  page,
}) => {
  await page.goto(`${base}/lessons/ai-understanding`);
  const cover = page.getByRole("region", { name: "강의 시작 표지", exact: true });
  await expect(cover).toBeVisible();
  await cover.getByRole("button", { name: "단원 지도 보기", exact: true }).click();
  await expect(page.getByRole("region", { name: "배포하고 고치기 지도" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /1-2 AI 종류와 도구 알아보기/ })).toBeDisabled();
  await page
    .getByRole("button", { name: "다음 수업 시작 · 1-1 AI 이해하기 →", exact: true })
    .click();
  await expect(cover).toBeVisible();
  await cover.getByRole("button", { name: "시작하기", exact: true }).press("Space");
  const next = page.getByRole("button", { name: "다음으로", exact: true });
  await expect(next).toBeEnabled();
  await next.click();
  await next.click();
  await next.click();
  await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText("화면 4 / 5");
  await expect(next).toBeDisabled();
  await page.getByRole("button", { name: "단원 지도 보기", exact: true }).click();
  await page
    .getByRole("button", { name: "다음 수업 시작 · 1-1 AI 이해하기 →", exact: true })
    .click();
  await expect(cover).toHaveCount(0);
  await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText("화면 4 / 5");
  await expect(next).toBeDisabled();
});

test("제목 표지로 돌아갔다 시작해도 기획 입력을 보존한다", async ({ page }) => {
  await page.goto(`${base}/lessons/page-planning`);
  await page.getByRole("button", { name: "시작하기", exact: true }).click();
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await page.getByRole("textbox", { name: "누가 읽나요?", exact: true }).fill("책을 좋아하는 친구");
  await page
    .getByRole("textbox", { name: "읽은 뒤 무엇을 하길 바라나요?", exact: true })
    .fill("다음 주에 갈 곳 고르기");
  await page.getByRole("button", { name: "이전 설명", exact: true }).click();
  await page.getByRole("button", { name: "이전 설명", exact: true }).press("Enter");
  await expect(page.getByRole("region", { name: "강의 시작 표지", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "시작하기", exact: true }).press("Space");
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "누가 읽나요?", exact: true })).toHaveValue(
    "책을 좋아하는 친구",
  );
  await expect(
    page.getByRole("textbox", { name: "읽은 뒤 무엇을 하길 바라나요?", exact: true }),
  ).toHaveValue("다음 주에 갈 곳 고르기");
});

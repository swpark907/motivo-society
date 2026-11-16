// 표지를 직접 확인하므로 표지를 자동으로 넘기는 workbook-test 대신 기본 test를 쓴다.
import { expect, test } from "@playwright/test";
import { workbookCourse } from "../src/lib/workbook-course";

const base = "/workbook/classes/vibe-web";

test("1단원은 여섯 수업이고 수업 주소가 제 번호와 제목으로 열린다", async ({ page }) => {
  const unit = workbookCourse[0];
  expect(unit.lessons.map((lesson) => lesson.number)).toEqual([
    "1-1",
    "1-2",
    "1-3",
    "1-4",
    "1-5",
    "1-6",
  ]);
  for (const lesson of unit.lessons) {
    await page.goto(`${base}/lessons/${lesson.slug}`);
    await expect(page.getByRole("heading", { name: lesson.title, exact: true })).toBeVisible();
    await expect(page.getByText(`LESSON ${lesson.number}`, { exact: true })).toBeVisible();
  }
  // 2단원 첫 수업도 번호가 밀리지 않고 제 수업으로 열린다.
  const next = workbookCourse[1].lessons[0];
  await page.goto(`${base}/lessons/${next.slug}`);
  await expect(page.getByRole("heading", { name: next.title, exact: true })).toBeVisible();
  await expect(page.getByText(`LESSON ${next.number}`, { exact: true })).toBeVisible();
});

import { expect, test } from "./workbook-test";
test("단원 지도·전체 과정·소개 왕복은 목적지가 분명하고 학습 위치를 보존한다", async ({ page }) => {
  await page.goto("/workbook/classes/vibe-web/lessons/ai-understanding");
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await page.getByRole("button", { name: "단원 지도 보기", exact: true }).click();
  await expect(page).toHaveURL(/view=map/);
  await page.getByRole("button", { name: "전체 과정 보기", exact: true }).click();
  const overview = page.getByRole("dialog", { name: "배우고, 내 웹페이지를 만드는 다섯 과정" });
  await expect(overview).toBeVisible();
  await overview.getByRole("button", { name: "전체 과정 닫기", exact: true }).click();
  await page.getByRole("button", { name: "클래스 소개 보기", exact: true }).click();
  await page.getByRole("button", { name: "학습으로 돌아가기 ↗", exact: true }).click();
  await expect(page).toHaveURL(/view=map/);
  await page.getByRole("button", { name: "AI 이해하기 수업 시작", exact: true }).click();
  await expect(page).toHaveURL(/ai-understanding$/);
  await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText("화면 2 / 5");
});

test("1단원 완료 뒤 다음 수업을 직접 시작하고 소개 왕복 후에도 다음 단원에 머문다", async ({
  page,
}, info) => {
  if (info.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/demo/workbook-navigation");
  await page.getByRole("button", { name: "1단원 완료 후 이동 검토", exact: true }).click();
  const handoff = page.getByRole("region", { name: "단원 학습 완료와 다음 학습", exact: true });
  await expect(handoff).toContainText("다음은 2단원 · 기획하고 첫 화면 만들기");
  await page.screenshot({ path: info.outputPath("unit-handoff.png") });
  await handoff.getByRole("button", { name: "2-1 홈페이지 기획하기 시작 →", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("홈페이지 기획하기");
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText("화면 2 / 5");
  await page.getByRole("button", { name: "단원 지도 보기", exact: true }).click();
  await page.getByRole("button", { name: "클래스 소개 보기", exact: true }).click();
  await page.getByRole("button", { name: "학습으로 돌아가기 ↗", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("기획하고 첫 화면 만들기");
  await page.getByRole("button", { name: /^다음 수업 시작 · 2-1/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("홈페이지 기획하기");
  await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText("화면 2 / 5");
});

test("전체 과정의 지도 아래 버튼은 해당 단원 지도만 열고 잠긴 단원은 이유를 표시한다", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/workbook/classes/vibe-web?view=map");
  await page.getByRole("button", { name: "전체 과정 보기", exact: true }).click();
  const second = page.getByRole("region", { name: "2단원 기획하고 첫 화면 만들기", exact: true });
  const entry = second.getByRole("button", { name: "기획하고 첫 화면 만들기 지도로", exact: true });
  await expect(entry).toBeDisabled();
  await expect(second).toContainText("AI 도구 준비하기의 다섯 수업을 마치면 열려요");
  await expect(second.getByRole("button")).toHaveCount(1);
  await page.screenshot({ path: info.outputPath("overview-locked.png") });
  await page.getByRole("button", { name: "AI 도구 준비하기 지도로", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("AI 도구 준비하기");
  await page.goto("/demo/workbook-navigation");
  await page.getByRole("button", { name: "1단원 완료 후 이동 검토", exact: true }).click();
  await page.getByRole("button", { name: "전체 과정 보기", exact: true }).click();
  await expect(entry).toBeEnabled();
  await expect(second).toContainText("진입 가능");
  await page.screenshot({ path: info.outputPath("overview-unlocked.png") });
  await entry.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("기획하고 첫 화면 만들기");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: /^다음 수업 시작 · 2-1/ })).toBeVisible();
});

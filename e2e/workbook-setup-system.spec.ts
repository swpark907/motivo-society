import { expect, test } from "./workbook-test";

for (const mode of ["ready", "pending", "review"] as const) {
  test(`3강은 전체 화면 번호와 실제 준비·복습 상태를 구분한다: ${mode}`, async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name === "desktop")
      await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/workbook/classes/vibe-web/lessons/tool-setup");
    const progress = page.getByLabel("현재 학습 단계", { exact: true });
    const body = page.getByLabel("수업 내용", { exact: true });
    const next = page.getByRole("button", { name: "다음으로", exact: true });
    for (let screen = 1; screen <= 9; screen++) {
      await expect(progress).toHaveText(new RegExp(`화면 ${screen} / 12$`));
      await expect(body.getByRole("heading", { level: 2 })).toHaveCount(1);
      await expect(body.getByText("내 목적과 연결하기", { exact: true })).toHaveCount(0);
      if (screen === 3) {
        await expect(next).toBeDisabled();
        await page
          .getByRole("button", {
            name: mode === "review" ? "모바일에서 복습하기" : "컴퓨터에서 준비하기",
            exact: true,
          })
          .click();
      }
      if (screen === 4) {
        await page.getByRole("button", { name: "Mac 안내", exact: true }).click();
        await expect(progress).toContainText("4 / 12");
        await expect(body.getByRole("link", { name: "공식 데스크톱 설치 안내 ↗" })).toHaveAttribute(
          "href",
          "https://learn.chatgpt.com/docs/app",
        );
        await page.getByRole("button", { name: "Windows 안내", exact: true }).click();
      }
      if (testInfo.project.name === "desktop") {
        await expect
          .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
          .toBeLessThanOrEqual(2);
      }
      if (mode === "ready")
        await page.screenshot({ path: testInfo.outputPath(`setup-${screen}.png`) });
      await next.click();
    }
    await expect(progress).toHaveText("화면 10 / 12");
    await expect(next).toBeDisabled();
    await page
      .getByRole("button", { name: "버튼의 정확한 위치와 모든 이용 조건", exact: true })
      .click();
    await expect(next).toBeDisabled();
    await expect(body.locator('[data-answer="incorrect"]')).toContainText("오답");
    await page
      .getByRole("button", {
        name: "작업 폴더 → 요청 → 파일 변경 → 실행·확인 → 수정 요청",
        exact: true,
      })
      .click();
    await next.click();
    await expect(progress).toHaveText("화면 11 / 12");
    const review = page.getByRole("button", { name: "학습 정리 보기", exact: true });
    if (mode !== "review") {
      await expect(review).toBeDisabled();
      const ready = page.getByRole("button", { name: "컴퓨터 준비 확인", exact: true });
      await expect(ready).toBeDisabled();
      if (mode === "ready") {
        for (const checkbox of await body.getByRole("checkbox").all()) await checkbox.check();
        await ready.click();
        await expect(review).toBeEnabled();
        const lastCheck = body.getByRole("checkbox").last();
        await lastCheck.uncheck();
        await expect(review).toBeDisabled();
        await lastCheck.check();
        await ready.click();
      } else await page.getByRole("button", { name: "아직 준비가 필요해요", exact: true }).click();
    } else await expect(body.getByRole("checkbox")).toHaveCount(0);
    await review.click();
    await expect(progress).toHaveText("화면 12 / 12");
    await expect(body).toContainText(
      mode === "ready"
        ? "컴퓨터 준비 확인 · 본인 확인"
        : mode === "pending"
          ? "설명 확인 · 컴퓨터 준비 필요"
          : "복습 확인 · 컴퓨터 준비 필요",
    );
    if (mode === "ready") await page.screenshot({ path: testInfo.outputPath("setup-recap.png") });
    await page.getByRole("button", { name: "학습 마치고 단원 지도로 →", exact: true }).click();
    await expect(page).toHaveURL(/\?view=map$/);
  });
}

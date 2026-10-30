import { expect, test } from "./workbook-test";

for (const mode of ["example", "computer"] as const) {
  test(`4강은 요청→확인→수정→비교를 단계별로 진행한다: ${mode}`, async ({ page }, testInfo) => {
    if (testInfo.project.name === "desktop")
      await page.setViewportSize({ width: 1280, height: 720 });
    if (mode === "computer") {
      await page.goto("/workbook/classes/vibe-web/lessons/tool-setup");
      const next = page.getByRole("button", { name: "다음으로", exact: true });
      for (let screen = 1; screen <= 9; screen++) {
        if (screen === 3)
          await page.getByRole("button", { name: "컴퓨터에서 준비하기", exact: true }).click();
        await next.click();
      }
      await page
        .getByRole("button", {
          name: "작업 폴더 → 요청 → 파일 변경 → 실행·확인 → 수정 요청",
          exact: true,
        })
        .click();
      await next.click();
      for (const check of await page.getByRole("checkbox").all()) await check.check();
      await page.getByRole("button", { name: "컴퓨터 준비 확인", exact: true }).click();
      await page.getByRole("button", { name: "학습 정리 보기", exact: true }).click();
      await page.getByRole("button", { name: "학습 마치고 단원 지도로 →", exact: true }).click();
      // 같은 방문의 준비 상태를 유지하며 기존 URL 복원으로 4강을 연다.
      await page.evaluate(() => {
        history.pushState(null, "", "/workbook/classes/vibe-web/lessons/first-request");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
    } else await page.goto("/workbook/classes/vibe-web/lessons/first-request");
    const progress = page.getByLabel("현재 학습 단계", { exact: true });
    const body = page.getByLabel("수업 내용", { exact: true });
    const next = page.getByRole("button", { name: "다음으로", exact: true });
    async function capture(screen: number) {
      await expect(progress).toHaveText(new RegExp(`화면 ${screen} / 8$`));
      if (testInfo.project.name === "desktop")
        await expect
          .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
          .toBeLessThanOrEqual(2);
      await page.screenshot({ path: testInfo.outputPath(`conversation-${screen}.png`) });
    }
    await capture(1);
    await next.click();
    await expect(next).toBeDisabled();
    if (mode === "example")
      await expect(
        page.getByRole("button", { name: "내 컴퓨터에서 실습하기", exact: true }),
      ).toBeDisabled();
    await page
      .getByRole("button", {
        name: mode === "computer" ? "내 컴퓨터에서 실습하기" : "예시로 복습하기",
        exact: true,
      })
      .click();
    await capture(2);
    await next.click();
    await expect(next).toBeDisabled();
    await page.getByRole("button", { name: "예시 요청 가져오기", exact: true }).click();
    await expect(body.getByRole("textbox", { name: "첫 요청", exact: true })).toHaveValue(
      /지금은 답변만 하고 파일은 만들거나 수정하지 마\./,
    );
    await capture(3);
    await next.click();
    await expect(next).toBeDisabled();
    if (mode === "example")
      await page.getByRole("button", { name: "미리 만든 결과 살펴보기", exact: true }).click();
    await page
      .getByRole("textbox", { name: "확인한 점 하나", exact: true })
      .fill("두 문장이고 세 작업도 있지만 첫 문장이 길어요.");
    await capture(4);
    await next.click();
    await expect(next).toBeDisabled();
    await page.getByRole("button", { name: "수정 예시 가져오기", exact: true }).click();
    await capture(5);
    await page.getByRole("button", { name: "이전 설명", exact: true }).click();
    await expect(progress).toHaveText("화면 4 / 8");
    await expect(page.getByRole("textbox", { name: "확인한 점 하나", exact: true })).toHaveValue(
      "두 문장이고 세 작업도 있지만 첫 문장이 길어요.",
    );
    await next.click();
    await expect(page.getByRole("textbox", { name: "수정 요청", exact: true })).toHaveValue(
      /첫 문장을 더 짧게/,
    );
    await next.click();
    if (mode === "example") {
      await expect(next).toBeDisabled();
      await page.getByRole("button", { name: "미리 만든 수정 결과 보기", exact: true }).click();
      await expect(body.getByRole("heading", { name: "수정 전", exact: true })).toBeVisible();
      await expect(body.getByRole("heading", { name: "수정 후", exact: true })).toBeVisible();
    }
    await capture(6);
    await next.click();
    const review = page.getByRole("button", { name: "학습 정리 보기", exact: true });
    await expect(review).toBeDisabled();
    await page
      .getByRole("button", { name: "마음에 안 들어. 알아서 다시 해줘", exact: true })
      .click();
    await expect(review).toBeDisabled();
    await page
      .getByRole("button", { name: "첫 문장은 짧게 바꾸고 장소의 특징은 유지해줘", exact: true })
      .click();
    if (mode === "computer") {
      await expect(review).toBeDisabled();
      for (const check of await body.getByRole("checkbox").all()) await check.check();
    } else await expect(body.getByRole("checkbox")).toHaveCount(0);
    await capture(7);
    await review.click();
    await capture(8);
    await expect(body).toContainText(
      mode === "computer" ? "외부 도구 실습 · 본인 확인" : "사전 제작 예시 복습",
    );
    await page.getByText("내 대화 기록 보기", { exact: true }).click();
    await expect(body).toContainText("두 문장이고 세 작업도 있지만 첫 문장이 길어요.");
    await page.getByRole("button", { name: "학습 마치고 단원 지도로 →", exact: true }).click();
    await expect(page).toHaveURL(/\?view=map$/);
  });
}

test("5강의 파일 제작 진입은 유지한다", async ({ page }) => {
  await page.goto("/workbook/classes/vibe-web/lessons/first-file");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("첫 파일 만들기");
  await expect(page.getByRole("button", { name: "다음으로", exact: true })).toBeEnabled();
  await expect(
    page.getByRole("heading", { name: "코드 답변에서 실제 파일 작업으로", exact: true }),
  ).toBeVisible();
});

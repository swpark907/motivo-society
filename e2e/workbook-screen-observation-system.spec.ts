import { expect, test, goToPreviousLesson } from "./workbook-test";

for (const ownPlan of [false, true]) {
  test(`3-1은 두 폭을 비교하고 관찰을 다음 요청으로 잇는다: ${ownPlan ? "내 기획" : "준비된 예시"}`, async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name === "desktop")
      await page.setViewportSize({ width: 1280, height: 720 });
    const next = page.getByRole("button", { name: "다음으로", exact: true });
    if (ownPlan) {
      await page.goto("/workbook/classes/vibe-web/lessons/page-planning");
      await next.click();
      await page.getByRole("button", { name: "빈 항목에 구성 예시 넣기", exact: true }).click();
      await next.click();
      await page
        .getByRole("textbox", { name: "홈페이지 제목", exact: true })
        .fill("직접 써본 도구 기록");
      await page.evaluate(() => {
        history.pushState(null, "", "/workbook/classes/vibe-web/lessons/screen-observation");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
    } else await page.goto("/workbook/classes/vibe-web/lessons/screen-observation");
    const body = page.getByLabel("수업 내용", { exact: true });
    const progress = page.getByLabel("현재 학습 단계", { exact: true });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("두 화면에서 문제 찾기");
    await expect(body).toContainText(ownPlan ? "직접 써본 도구 기록" : "혼자 책 읽기 좋은 세 곳");
    await expect(body).toContainText("내 실제 파일에도 같은 문제가 있다는 뜻은 아니에요");
    await capture(1);
    await next.click();
    await expect(next).toBeDisabled();
    const preview = page.getByRole("region", { name: "두 화면 비교 연습", exact: true });
    await expect(preview).toContainText(
      ownPlan ? "직접 써본 도구 기록" : "혼자 책 읽기 좋은 세 곳",
    );
    await expect(preview).toHaveCSS("width", "560px");
    await expect
      .poll(() => preview.evaluate((el) => el.scrollWidth - el.clientWidth))
      .toBeLessThanOrEqual(1);
    await page.getByRole("button", { name: "이 화면 확인했어요", exact: true }).click();
    await expect(next).toBeDisabled();
    const mobile = page.getByRole("button", { name: "모바일 폭 280px · 확인 전", exact: true });
    await mobile.click();
    await expect(mobile).toHaveAttribute("aria-pressed", "true");
    await expect(preview).toHaveCSS("width", "280px");
    await expect
      .poll(() => preview.evaluate((el) => el.scrollWidth - el.clientWidth))
      .toBeGreaterThan(200);
    await page.getByRole("button", { name: "이 화면 확인했어요", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "모바일 폭 280px · 확인 완료", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await capture(2);
    await next.click();
    await expect(next).toBeDisabled();
    await page
      .getByRole("textbox", { name: "예시의 작은 화면에서 불편한 한 가지", exact: true })
      .fill("모바일 폭에서는 목록 오른쪽이 잘려 좌우로 밀어야 읽을 수 있어요.");
    await capture(3);
    await next.click();
    await capture(4);
    await page.getByRole("button", { name: "개선 요청 쓰기로 →", exact: true }).click();
    await expect(page).toHaveURL(/\/screen-improvement$/);
    await page
      .getByRole("button", { name: "관찰한 점으로 수정 요청 초안 만들기", exact: true })
      .click();
    await captureRequest(1);
    await next.click();
    const request = page.getByRole("textbox", { name: "연습 화면의 개선 요청", exact: true });
    await expect(request).toHaveValue(/목록 오른쪽이 잘려/);
    await request.fill("직접 다듬은 요청: 너비만 고치고 제목과 목록은 유지해줘.");
    await page.getByRole("button", { name: "이전 설명", exact: true }).click();
    await goToPreviousLesson(page);
    await expect(progress).toHaveText("화면 4 / 4");
    await page.getByRole("button", { name: "이전 설명", exact: true }).click();
    await page
      .getByRole("textbox", { name: "예시의 작은 화면에서 불편한 한 가지", exact: true })
      .fill("모바일에서 소개와 목록의 오른쪽이 잘려요.");
    await next.click();
    await page.getByRole("button", { name: "개선 요청 쓰기로 →", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("관찰이 바뀌었어요");
    await next.click();
    await expect(request).toHaveValue("직접 다듬은 요청: 너비만 고치고 제목과 목록은 유지해줘.");
    await captureRequest(2);
    await next.click();
    await captureRequest(3);
    await page.getByText("선택 · 내 파일에 요청을 사용하려면", { exact: true }).click();
    await page.getByRole("button", { name: "개선 요청 복사하기", exact: true }).click();
    await expect(page.getByRole("status")).toBeVisible();
    await page.getByText("선택 · 내 파일에 요청을 사용하려면", { exact: true }).click();
    await next.click();
    await captureRequest(4);
    // 후속 비교의 기존 조작·판정은 그대로 유지한다.
    await page.getByRole("button", { name: "수정 전후 확인으로 →", exact: true }).click();
    await expect(page).toHaveURL(/\/screen-check$/);

    await captureComparison(1);
    await expect(next).toBeDisabled();
    await page.getByRole("button", { name: "너비 수정 예시 준비하기", exact: true }).click();
    await next.click();
    const comparison = page.getByRole("region", { name: "수정 전후 비교 예시", exact: true });
    await expect(comparison).toContainText(
      ownPlan ? "직접 써본 도구 기록" : "혼자 책 읽기 좋은 세 곳",
    );
    for (const screen of [2, 3]) {
      await expect(next).toBeDisabled();
      await page.getByRole("button", { name: "수정 전 보기", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "이 폭의 수정 후 확인했어요", exact: true }),
      ).toBeDisabled();
      await expect(comparison).toHaveCSS("width", screen === 2 ? "280px" : "560px");
      if (screen === 2) {
        await expect
          .poll(() => comparison.evaluate((el) => el.scrollWidth - el.clientWidth))
          .toBeGreaterThan(200);
        await page.getByRole("button", { name: "내용 보기", exact: true }).click();
      }
      await page.getByRole("button", { name: "수정 후 보기", exact: true }).click();
      await expect
        .poll(() => comparison.evaluate((el) => el.scrollWidth - el.clientWidth))
        .toBeLessThanOrEqual(1);
      await page.getByRole("button", { name: "이 폭의 수정 후 확인했어요", exact: true }).click();
      await captureComparison(screen);
      await next.click();
    }
    await expect(next).toBeDisabled(); // 수정 전 버튼 조작은 수정 후 확인이 아니다.
    await page.getByRole("button", { name: "모바일 280px", exact: true }).click();
    await page.getByRole("button", { name: "내용 보기", exact: true }).press("Enter");
    await expect(page.getByRole("status")).toContainText("같은 목록에 도착");
    await captureComparison(4);
    await next.click();
    await expect(next).toBeDisabled();
    await page
      .getByRole("textbox", { name: "예시 수정 전후 달라진 점", exact: true })
      .fill("두 폭에서 내용이 화면 안에 들어가고 목록으로 이동해요.");
    await captureComparison(5);
    await next.click();
    await captureComparison(6);
    await page.getByRole("button", { name: "이전 설명", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: "예시 수정 전후 달라진 점", exact: true }),
    ).toHaveValue("두 폭에서 내용이 화면 안에 들어가고 목록으로 이동해요.");
    await next.click();
    await page.getByRole("button", { name: "단원 마치고 다음 학습 보기 →", exact: true }).click();
    await expect(page).toHaveURL(/view=map/);
    async function captureComparison(screen: number) {
      await expect(progress).toHaveText(`화면 ${screen} / 6`);
      if (testInfo.project.name === "desktop")
        await expect
          .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
          .toBeLessThanOrEqual(2);
      await page.screenshot({ path: testInfo.outputPath(`comparison-${screen}.png`) });
    }
    async function captureRequest(screen: number) {
      await expect(progress).toHaveText(`화면 ${screen} / 4`);
      if (testInfo.project.name === "desktop")
        await expect
          .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
          .toBeLessThanOrEqual(2);
      await page.screenshot({ path: testInfo.outputPath(`improvement-${screen}.png`) });
    }
    async function capture(screen: number) {
      await expect(progress).toHaveText(`화면 ${screen} / 4`);
      if (testInfo.project.name === "desktop")
        await expect
          .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
          .toBeLessThanOrEqual(2);
      await page.screenshot({ path: testInfo.outputPath(`observation-${screen}.png`) });
    }
  });
}

test("관찰 없이 개선 요청 수업에 직접 들어오면 이전 수업을 안내한다", async ({ page }) => {
  await page.goto("/workbook/classes/vibe-web/lessons/screen-improvement");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("개선 요청 쓰기");
  await expect(page.getByRole("button", { name: "다음으로", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "3-1 관찰로 돌아가기", exact: true }).click();
  await expect(page).toHaveURL(/\/screen-observation$/);
});

test("요청 없이 전후 확인에 직접 들어오면 요청 수업을 안내한다", async ({ page }) => {
  await page.goto("/workbook/classes/vibe-web/lessons/screen-check");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("수정 전후 확인");
  await expect(page.getByRole("button", { name: "다음으로", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "3-2 요청으로 돌아가기", exact: true }).click();
  await expect(page).toHaveURL(/\/screen-improvement$/);
});

import { expect, test, goToPreviousLesson } from "./workbook-test";

test("기획에서 요청을 만들고 미리보기로 이어간다", async ({ page }, testInfo) => {
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workbook/classes/vibe-web/lessons/page-request");
  const next = page.getByRole("button", { name: "다음으로", exact: true });
  await expect(next).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "내 기획으로 요청 초안 만들기", exact: true }),
  ).toBeDisabled();
  await goToPreviousLesson(page);
  await next.click();
  await page.getByRole("button", { name: "빈 항목에 구성 예시 넣기", exact: true }).click();
  await next.click();
  await next.click();
  await next.click();
  await page.getByRole("button", { name: "제작 요청 다듬기로 →", exact: true }).click();
  await page.getByRole("button", { name: "내 기획으로 요청 초안 만들기", exact: true }).click();
  for (let screen = 1; screen <= 5; screen++) {
    await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText(
      `화면 ${screen} / 5`,
    );
    if (screen === 2)
      await expect(page.getByRole("textbox", { name: "내 제작 요청", exact: true })).toHaveValue(
        /혼자 책 읽기 좋은 세 곳/,
      );
    if (screen === 3) {
      await expect(next).toBeDisabled();
      await expect(page.getByRole("button", { name: /내 파일로 제작 실습하기/ })).toBeDisabled();
      await page.getByRole("button", { name: /기획 미리보기로 복습하기/ }).click();
      await expect(page.getByRole("button", { name: /기획 미리보기로 복습하기/ })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    }
    if (testInfo.project.name === "desktop")
      await expect
        .poll(() =>
          page
            .getByLabel("수업 내용", { exact: true })
            .evaluate((el) => el.scrollHeight - el.clientHeight),
        )
        .toBeLessThanOrEqual(2);
    await page.screenshot({ path: testInfo.outputPath(`request-${screen}.png`) });
    if (screen < 5) await next.click();
  }
  await page.getByRole("button", { name: "첫 화면 확인하기로 →", exact: true }).click();
  await expect(page).toHaveURL(/\/page-building$/);
  await expect(
    page.getByRole("heading", { name: "내 기획을 화면으로 살펴봐요", exact: true }),
  ).toBeVisible();
  await captureResult(1);
  await next.click();
  await expect(page.getByRole("region", { name: "내 기획 구성 미리보기" })).toContainText(
    "혼자 책 읽기 좋은 세 곳",
  );
  await expect(next).toBeDisabled();
  await page.getByRole("button", { name: "내용 보기", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "기획한 내용과 버튼을 확인해요", exact: true }),
  ).toBeVisible();
  await captureResult(2);
  await next.click();
  await captureResult(3);
  await next.click();
  await expect(next).toBeDisabled();
  await page
    .getByRole("textbox", { name: "내 화면에서 확인한 점", exact: true })
    .fill("제목과 소개가 기획에 맞고 버튼이 목록으로 이동해요.");
  await captureResult(4);
  await next.click();
  await expect(page.getByLabel("수업 내용", { exact: true })).toContainText("예시 복습으로 남겨요");
  await captureResult(5);
  await page.getByRole("button", { name: "2단원 마치고 다음 학습 보기 →", exact: true }).click();
  await expect(page).toHaveURL(/view=map/);
  async function captureResult(screen: number) {
    await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText(
      `화면 ${screen} / 5`,
    );
    if (testInfo.project.name === "desktop")
      await expect
        .poll(() =>
          page
            .getByLabel("수업 내용", { exact: true })
            .evaluate((el) => el.scrollHeight - el.clientHeight),
        )
        .toBeLessThanOrEqual(2);
    await page.screenshot({ path: testInfo.outputPath(`result-example-${screen}.png`) });
  }
});

test("준비된 컴퓨터는 요청 복사 안내에서 실제 파일 확인으로 이어진다", async ({
  page,
}, testInfo) => {
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
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

  await page.evaluate(() => {
    history.pushState(null, "", "/workbook/classes/vibe-web/lessons/page-planning");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  const forward = page.getByRole("button", { name: "다음으로", exact: true });
  await forward.click();
  await page.getByRole("button", { name: "빈 항목에 구성 예시 넣기", exact: true }).click();
  await forward.click();
  await forward.click();
  await forward.click();
  await page.getByRole("button", { name: "제작 요청 다듬기로 →", exact: true }).click();
  await page.getByRole("button", { name: "내 기획으로 요청 초안 만들기", exact: true }).click();
  await forward.click();
  await forward.click();
  await page.getByRole("button", { name: /내 파일로 제작 실습하기/ }).click();
  await forward.click();
  await expect(page.getByLabel("수업 내용", { exact: true })).toContainText(
    "my-first-web을 작업하던 같은 대화",
  );
  await page.getByRole("button", { name: "제작 요청 복사하기", exact: true }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await forward.click();
  await page.getByRole("button", { name: "첫 화면 확인하기로 →", exact: true }).click();
  await expect(page).toHaveURL(/\/page-building$/);
  await captureComputer(1);
  await forward.click();
  await captureComputer(2);
  await expect(
    page.getByRole("checkbox", { name: "index.html만 바뀌었는지 확인했어요" }),
  ).not.toBeChecked();
  for (const check of await page.getByRole("checkbox").all()) await check.check();
  await forward.click();
  await captureComputer(3);
  await page.getByText("수정 요청 작성·복사하기", { exact: true }).click();
  await page.getByRole("button", { name: "수정 예시 가져오기", exact: true }).click();
  await page
    .getByRole("textbox", { name: "내 수정 요청", exact: true })
    .fill("목록으로 이동하지 않는 내용 보기 버튼만 고쳐줘. 나머지 내용은 유지해줘.");
  await page.getByRole("button", { name: "수정 요청 복사하기", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(/복사/);
  await page.getByRole("button", { name: "실제 파일을 수정했어요 · 재확인", exact: true }).click();
  for (const check of await page.getByRole("checkbox").all()) await expect(check).not.toBeChecked();
  // 미확인 결과도 문제 기록과 함께 계속할 수 있다.
  await forward.click();
  await forward.click();
  await page
    .getByRole("textbox", { name: "내 화면에서 확인한 점", exact: true })
    .fill("제목은 맞지만 버튼 이동은 아직 확인하지 못했어요.");
  await forward.click();
  await expect(page.getByLabel("수업 내용", { exact: true })).toContainText(
    "미확인 항목은 실제 결과 대기",
  );
  await page.getByRole("button", { name: "이전 설명", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "내 화면에서 확인한 점", exact: true }),
  ).toHaveValue("제목은 맞지만 버튼 이동은 아직 확인하지 못했어요.");
  await forward.click();
  await captureComputer(5);
  await page.screenshot({ path: testInfo.outputPath("result-computer-summary.png") });
  await page.getByRole("button", { name: "2단원 마치고 다음 학습 보기 →", exact: true }).click();
  await expect(page).toHaveURL(/view=map/);
  async function captureComputer(screen: number) {
    await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText(
      `화면 ${screen} / 5`,
    );
    if (testInfo.project.name === "desktop")
      await expect
        .poll(() =>
          page
            .getByLabel("수업 내용", { exact: true })
            .evaluate((el) => el.scrollHeight - el.clientHeight),
        )
        .toBeLessThanOrEqual(2);
    await page.screenshot({ path: testInfo.outputPath(`result-computer-${screen}.png`) });
  }
});

test("준비 없이 2-3에 직접 들어오면 요청 준비를 안내한다", async ({ page }) => {
  await page.goto("/workbook/classes/vibe-web/lessons/page-building");
  await expect(page.getByRole("button", { name: "다음으로", exact: true })).toBeDisabled();
  await expect(page.getByLabel("수업 내용", { exact: true })).toContainText(
    "먼저 2-2에서 제작 요청과 실습 방식",
  );
  await page
    .getByLabel("수업 내용", { exact: true })
    .getByRole("button", { name: "2-2 제작 요청으로", exact: true })
    .click();
  await expect(page).toHaveURL(/\/page-request$/);
});

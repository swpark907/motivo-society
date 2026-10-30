import { expect, test } from "./workbook-test";

for (const mode of ["example", "ready", "pending"] as const) {
  test(`5강은 제작→실행→확인→수정을 연결하고 실제 결과를 구분한다: ${mode}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    if (testInfo.project.name === "desktop")
      await page.setViewportSize({ width: 1280, height: 720 });
    if (mode !== "example") {
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
        history.pushState(null, "", "/workbook/classes/vibe-web/lessons/first-file");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
    } else await page.goto("/workbook/classes/vibe-web/lessons/first-file");
    const progress = page.getByLabel("현재 학습 단계", { exact: true });
    const body = page.getByLabel("수업 내용", { exact: true });
    const next = page.getByRole("button", { name: "다음으로", exact: true });
    async function capture(screen: number) {
      await expect(progress).toHaveText(new RegExp(`화면 ${screen} / 10$`));
      if (testInfo.project.name === "desktop")
        await expect
          .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
          .toBeLessThanOrEqual(2);
      if (mode !== "pending")
        await page.screenshot({ path: testInfo.outputPath(`first-file-${screen}.png`) });
    }
    const columnHeaders = page
      .getByRole("table", { name: "답변과 파일 작업의 차이", exact: true })
      .getByRole("columnheader");
    await expect(columnHeaders).toHaveCount(2);
    const columns = await columnHeaders.evaluateAll((cells) =>
      cells.map((cell) => cell.getBoundingClientRect().width),
    );
    expect(Math.abs(columns[0] - columns[1])).toBeLessThanOrEqual(2);
    await capture(1);
    await next.click();
    await expect(next).toBeDisabled();
    if (mode === "example")
      await expect(
        page.getByRole("button", { name: "내 컴퓨터에서 실습하기", exact: true }),
      ).toBeDisabled();
    await page
      .getByRole("button", {
        name: mode === "example" ? "예시로 복습하기" : "내 컴퓨터에서 실습하기",
        exact: true,
      })
      .click();
    await capture(2);
    await next.click();
    await expect(next).toBeDisabled();
    await page.getByRole("button", { name: "예시 요청 가져오기", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "제작 요청", exact: true })).toHaveValue(
      /이미 있으면 내용을 먼저 설명/,
    );
    if (mode === "example")
      await expect(
        body.getByRole("heading", { name: "첫 파일 제작 요청을 살펴봐요", exact: true }),
      ).toBeVisible();
    const requestField = page.getByRole("textbox", { name: "제작 요청", exact: true });
    const prompt = await requestField.inputValue();
    expect(prompt.split("\n\n")).toHaveLength(5);
    await requestField.fill(prompt + "\n추가로 확인할 내용을 적었어요.");
    await page.getByRole("button", { name: "이전 설명", exact: true }).click();
    await next.click();
    await expect(requestField).toHaveValue(prompt + "\n추가로 확인할 내용을 적었어요.");
    await capture(3);
    await next.click();
    if (mode === "example") {
      await expect(next).toBeDisabled();
      await page.getByRole("button", { name: "미리 만든 결과 살펴보기", exact: true }).click();
      await expect(
        body.getByRole("heading", { name: "나의 첫 웹페이지", exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "작업 보기", exact: true }).click();
    }
    await capture(4);
    await next.click();
    await expect(next).toBeDisabled();
    await page
      .getByRole("textbox", { name: "확인한 점 하나", exact: true })
      .fill(
        mode === "pending"
          ? "파일은 있지만 브라우저에서 아직 열리지 않아요."
          : "제목과 소개, 목록이 보이고 버튼도 목록으로 이동해요.",
      );
    if (mode === "example")
      await expect(
        body.getByText("AI가 바꾼 파일과 내가 연 파일이 같나요?", { exact: true }),
      ).toHaveCount(0);
    await capture(5);
    await next.click();
    await expect(next).toBeDisabled();
    await page.getByRole("button", { name: "수정 예시 가져오기", exact: true }).click();
    await capture(6);
    await next.click();
    if (mode === "example") {
      await expect(next).toBeDisabled();
      await page.getByRole("button", { name: "미리 만든 수정 결과 보기", exact: true }).click();
      await expect(next).toBeDisabled();
      await page.getByRole("button", { name: "수정된 작업 보기", exact: true }).click();
      await expect(body.getByRole("status")).toContainText(
        "수정 후에도 버튼에 연결된 목록을 확인했어요.",
      );
    }
    await capture(7);
    await next.click();
    await expect(next).toBeDisabled();
    await page
      .getByRole("button", { name: "완료 메시지를 받았으니 화면도 잘 동작해요", exact: true })
      .click();
    await expect(next).toBeDisabled();
    await page
      .getByRole("button", { name: "바뀐 파일과 브라우저 화면·버튼을 직접 확인해요", exact: true })
      .click();
    await capture(8);
    await next.click();
    if (mode === "ready") {
      for (const check of await body.getByRole("checkbox").all()) await check.check();
      await body.getByRole("checkbox").last().uncheck();
      await body.getByRole("checkbox").last().check();
    } else if (mode === "pending") {
      await expect(body.getByRole("checkbox").first()).not.toBeChecked();
      await expect(body).toContainText("미확인 항목은 실제 결과 대기로 남겨요");
    } else await expect(body.getByRole("checkbox")).toHaveCount(0);
    if (mode === "example")
      await expect(
        body.getByText("예시 복습으로 남겨요. 실제 파일 제작 기록은 그대로 보존해요.", {
          exact: true,
        }),
      ).toHaveCount(0);
    await capture(9);
    await page.getByRole("button", { name: "학습 정리 보기", exact: true }).click();
    await capture(10);
    await page.getByRole("button", { name: "이전 설명", exact: true }).click();
    await expect(progress).toHaveText("화면 9 / 10");
    await page.getByRole("button", { name: "학습 정리 보기", exact: true }).click();
    await page.getByText("내 기록·추가 연습 보기", { exact: true }).click();
    await expect(body).toContainText(
      mode === "pending"
        ? "파일은 있지만 브라우저에서 아직 열리지 않아요."
        : "제목과 소개, 목록이 보이고 버튼도 목록으로 이동해요.",
    );
    if (mode === "example") {
      await expect(
        page.getByRole("button", { name: "수업 마치고 단원 지도로 →", exact: true }),
      ).toBeEnabled();
      await body.getByText("AI가 작업을 놓칠 때 다시 이어가기", { exact: false }).click();
      await page
        .getByRole("button", { name: "같은 요청을 더 강하게 반복해요", exact: true })
        .click();
      await expect(body.locator('button[data-answer="incorrect"]')).toContainText("같은 요청");
      await page
        .getByRole("button", { name: "작업 폴더와 열어 본 파일 위치를 비교해요", exact: true })
        .click();
      await expect(body.locator('button[data-answer="correct"]')).toContainText("작업 폴더");
      await expect(progress).toHaveText("화면 10 / 10");
    }
    await page.getByRole("button", { name: "수업 마치고 단원 지도로 →", exact: true }).click();
    await expect(page).toHaveURL(/\?view=map$/);
    await expect(
      page.getByRole("button", { name: /^1-5 첫 파일 만들기 (장소로 이동|학습 패널 열기)$/ }),
    ).toBeEnabled();
    await page.evaluate(() => {
      history.pushState(null, "", "/workbook/classes/vibe-web/lessons/first-file");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await page.getByText("내 기록·추가 연습 보기", { exact: true }).click();
    await page.getByText("저장된 실제 결과 보기", { exact: true }).click();
    await expect(body.getByTestId("first-project-setup-status")).toContainText(
      mode === "ready"
        ? "목표 결과 확인 · 본인 기록"
        : mode === "pending"
          ? "실제 확인 대기"
          : "실제 적용 전",
    );
  });
}

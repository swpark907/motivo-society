import { expect, test } from "./workbook-test";

for (const ownPlan of [false, true]) {
  test(`5-1은 공개할 내용과 두 화면·버튼을 점검한다: ${ownPlan ? "내 기획" : "준비된 예시"}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);
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
        .fill("직접 써본 도구 모음");
      await page.evaluate(() => {
        history.pushState(null, "", "/workbook/classes/vibe-web/lessons/publish-check");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
    } else await page.goto("/workbook/classes/vibe-web/lessons/publish-check");
    const body = page.getByLabel("수업 내용", { exact: true });
    await expect(body).toContainText(ownPlan ? "직접 써본 도구 모음" : "혼자 책 읽기 좋은 세 곳");
    await expect(body).toContainText("실제 파일을 자동으로 검사하거나 공개하지 않아요");
    await capture(1);
    await next.click();
    await expect(next).toBeDisabled();
    const wrong = page.getByRole("button", { name: /^테스트 계정 비밀번호/ });
    await wrong.press("Enter");
    await expect(wrong).toHaveAttribute("data-answer", "incorrect");
    await expect(next).toBeDisabled();
    const right = page.getByRole("button", { name: /^공개 여부를 확인한 제목·소개·작업 목록/ });
    await right.click();
    await expect(right).toHaveAttribute("aria-pressed", "true");
    await capture(2);
    await next.click();
    for (const screen of [3, 4]) {
      const preview = page.getByRole("region", { name: "공개 전 점검 예시", exact: true });
      await expect(preview).toHaveCSS("width", screen === 3 ? "560px" : "280px");
      await expect(preview).toContainText(
        ownPlan ? "직접 써본 도구 모음" : "혼자 책 읽기 좋은 세 곳",
      );
      await expect(next).toBeDisabled();
      await page.getByRole("checkbox").check();
      if (screen === 3) {
        await page.getByRole("checkbox").uncheck();
        await expect(next).toBeDisabled();
        await page.getByRole("checkbox").check();
      }
      await capture(screen);
      await next.click();
    }
    await expect(next).toBeDisabled();
    await page.getByRole("button", { name: "내용 보기", exact: true }).press("Enter");
    await expect(page.getByRole("status")).toContainText("같은 목록에 도착");
    await capture(5);
    await next.click();
    await capture(6);
    await page.getByRole("button", { name: "이전 설명", exact: true }).click();
    await expect(next).toBeEnabled();
    await next.click();
    await page.getByRole("button", { name: "주소와 배포로 →", exact: true }).click();
    await expect(page).toHaveURL(/\/publish-address$/);
    await captureAddress(1);
    await next.click();
    await expect(next).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "접속 예시 확인하기", exact: true }),
    ).toBeDisabled();
    for (const name of [
      "내 컴퓨터 주소 · http://localhost:3211",
      "공개 서버 주소 예시 · https://my-work.example.invalid",
    ]) {
      await page.getByRole("button", { name, exact: true }).click();
      const result = page.getByRole("region", { name: "주소별 접속 결과 예시", exact: true });
      if (name.includes("localhost"))
        await expect(result).toContainText("아직 확인한 주소가 없어요");
      else await expect(result).toContainText("친구의 localhost"); // 선택만으로 결과를 바꾸지 않는다.
      await page.getByRole("button", { name: "접속 예시 확인하기", exact: true }).press("Enter");
      await expect(result).toContainText(
        name.includes("localhost") ? "친구의 localhost" : "실제 접속 확인은 아니에요",
      );
      if (name.includes("localhost")) await expect(next).toBeDisabled();
    }
    await captureAddress(2);
    await next.click();
    await captureAddress(3);
    await next.click();
    await expect(next).toBeDisabled();
    await page
      .getByRole("textbox", { name: "주소와 실제 배포가 다른 이유", exact: true })
      .fill("주소만 적어서는 내 파일이 공개되지 않아요.");
    await captureAddress(4);
    await next.click();
    await captureAddress(5);
    await page.getByRole("button", { name: "이전 설명", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: "주소와 실제 배포가 다른 이유", exact: true }),
    ).toHaveValue("주소만 적어서는 내 파일이 공개되지 않아요.");
    await next.click();
    await page.getByRole("button", { name: "공개 후 문제 해결로 →", exact: true }).click();
    await expect(page).toHaveURL(/\/publish-debug$/);

    await expect(next).toBeDisabled();
    await page.getByRole("button", { name: "추가 내용 보기", exact: true }).press("Enter");
    await expect(page.getByRole("status")).toContainText("추가 목록이 나타나지 않았어요");
    await captureDebug(1);
    await next.click();
    await expect(next).toBeDisabled();
    await page
      .getByRole("textbox", { name: "어느 화면에서 눌렀나요?", exact: true })
      .fill("컴퓨터 브라우저의 연습 예시");
    await page
      .getByRole("textbox", { name: "무엇을 눌렀나요?", exact: true })
      .fill("추가 내용 보기 버튼을 한 번 눌렀어요");
    await captureDebug(2);
    await next.click();
    await expect(next).toBeDisabled();
    await page
      .getByRole("textbox", { name: "무엇이 나타나야 하나요?", exact: true })
      .fill("추가 내용 목록");
    await page
      .getByRole("textbox", { name: "실제로 무엇이 보였나요?", exact: true })
      .fill("목록이 보이지 않았어요");
    await captureDebug(3);
    await next.click();
    await expect(next).toBeDisabled();
    await page.getByRole("button", { name: "문제 기록으로 수정 요청 만들기", exact: true }).click();
    const request = page.getByRole("textbox", { name: "예시 버튼의 수정 요청", exact: true });
    await expect(request).toHaveValue(ownPlan ? /직접 써본 도구 모음/ : /혼자 책 읽기 좋은 세 곳/);
    await request.fill("직접 다듬은 요청: 추가 내용 보기 버튼만 고치고 나머지는 유지해줘.");
    await page.getByRole("button", { name: "이전 설명", exact: true }).click();
    await page
      .getByRole("textbox", { name: "실제로 무엇이 보였나요?", exact: true })
      .fill("버튼은 그대로 있고 추가 목록은 보이지 않았어요");
    await next.click();
    await expect(page.getByRole("status")).toContainText("문제 기록이 바뀌었어요");
    await expect(request).toHaveValue(
      "직접 다듬은 요청: 추가 내용 보기 버튼만 고치고 나머지는 유지해줘.",
    );
    await captureDebug(4);
    await next.click();
    await expect(next).toBeDisabled();
    await page.getByRole("button", { name: "예시 버튼 수정 적용하기", exact: true }).click();
    const scope = page.getByRole("table", { name: "수정 범위 확인", exact: true });
    await expect(scope).toContainText("‘추가 내용 보기’ 버튼 이름");
    await expect(scope).not.toContainText("제목·소개·기존 목록");
    await captureDebug(5);
    await next.click();
    await expect(next).toBeDisabled(); // 적용 메시지만으로 해결 확인이 되지 않는다.
    const issue = page.getByRole("button", { name: "추가 내용 보기", exact: true });
    await expect(issue).toHaveAttribute("aria-expanded", "false");
    await issue.press("Enter");
    await expect(issue).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("region", { name: "운영 오류 예시", exact: true })).toContainText(
      "추가 내용 목록이 나타났어요",
    );
    await captureDebug(6);
    await next.click();
    await expect(next).toBeDisabled();
    const comparison = page.getByRole("textbox", {
      name: "예시 버튼을 다시 눌러 확인한 변화",
      exact: true,
    });
    await comparison.fill("수정 후 같은 버튼으로 추가 목록이 나타났어요.");
    await captureDebug(7);
    await next.click();
    await captureDebug(8);
    if (ownPlan) {
      for (let i = 0; i < 4; i++)
        await page.getByRole("button", { name: "이전 설명", exact: true }).click();
      await request.fill("수정 범위를 다시 다듬은 요청. 버튼만 바꾸고 같은 목록을 보여줘.");
      await next.click();
      await expect(next).toBeDisabled();
      await page.getByRole("button", { name: "예시 버튼 수정 적용하기", exact: true }).click();
      await next.click();
      await expect(next).toBeDisabled();
      await expect(issue).toHaveAttribute("aria-expanded", "false");
      await issue.click();
      await next.click();
      await expect(comparison).toHaveValue("수정 후 같은 버튼으로 추가 목록이 나타났어요.");
      await next.click();
    }
    await page.getByRole("button", { name: "학습 기록하고 클래스 정리로 →", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "배운 것과 내 파일, 다음 할 일", exact: true }),
    ).toBeVisible();
    async function captureDebug(screen: number) {
      await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText(
        `화면 ${screen} / 8`,
      );
      if (testInfo.project.name === "desktop")
        await expect
          .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
          .toBeLessThanOrEqual(2);
      await page.screenshot({ path: testInfo.outputPath(`debug-${screen}.png`) });
    }
    async function captureAddress(screen: number) {
      await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText(
        `화면 ${screen} / 5`,
      );
      if (testInfo.project.name === "desktop")
        await expect
          .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
          .toBeLessThanOrEqual(2);
      await expect
        .poll(() => body.evaluate((el) => el.scrollWidth - el.clientWidth))
        .toBeLessThanOrEqual(2);
      await page.screenshot({ path: testInfo.outputPath(`address-${screen}.png`) });
    }
    async function capture(screen: number) {
      await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText(
        `화면 ${screen} / 6`,
      );
      if (testInfo.project.name === "desktop")
        await expect
          .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
          .toBeLessThanOrEqual(2);
      await page.screenshot({ path: testInfo.outputPath(`preflight-${screen}.png`) });
    }
  });
}

test("공개 전 점검 없이 주소 수업에 들어오면 점검을 안내한다", async ({ page }) => {
  await page.goto("/workbook/classes/vibe-web/lessons/publish-address");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("주소와 배포");
  await expect(page.getByRole("button", { name: "다음으로", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "5-1 점검으로 돌아가기", exact: true }).click();
  await expect(page).toHaveURL(/\/publish-check$/);
});

test("주소 비교 없이 문제 해결 수업에 들어오면 이전 수업을 안내한다", async ({ page }) => {
  await page.goto("/workbook/classes/vibe-web/lessons/publish-debug");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("공개 후 문제 해결");
  await expect(page.getByRole("button", { name: "다음으로", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "5-2 주소 비교로 돌아가기", exact: true }).click();
  await expect(page).toHaveURL(/\/publish-address$/);
});

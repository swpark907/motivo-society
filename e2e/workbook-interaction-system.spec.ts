import { expect, test } from "./workbook-test";

for (const correct of [false, true]) {
  test(`4-1은 입력과 표시를 나누고 다음 저장 실험으로 잇는다: ${correct ? "맞은 예측" : "다른 예측"}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);
    if (testInfo.project.name === "desktop")
      await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/workbook/classes/vibe-web/lessons/interaction");
    const next = page.getByRole("button", { name: "다음으로", exact: true });
    const body = page.getByLabel("수업 내용", { exact: true });
    await capture(1);
    await next.click();
    await expect(next).toBeDisabled();
    const choice = page.getByRole("button", {
      name: correct ? "화면에 표시하기 버튼을 눌러야 나타나요" : "입력하는 즉시 페이지에 나타나요",
      exact: true,
    });
    await choice.click();
    await expect(choice).toHaveAttribute("aria-pressed", "true");
    await capture(2);
    await next.click();
    const field = page.getByRole("textbox", { name: "예시에 표시할 한 줄", exact: true });
    const result = page.getByRole("region", { name: "홈페이지 메모 예시", exact: true });
    await expect(next).toBeDisabled();
    await expect(page.getByRole("button", { name: "화면에 표시하기", exact: true })).toBeDisabled();
    await field.fill("첫 번째 메모");
    await expect(result).toContainText("아직 표시한 메모가 없어요");
    await page.getByRole("button", { name: "화면에 표시하기", exact: true }).press("Enter");
    await expect(result).toContainText("첫 번째 메모");
    await field.fill("버튼 이름을 더 쉽게 바꾸기");
    await expect(result).toContainText("첫 번째 메모");
    await expect(result).not.toContainText("버튼 이름을 더 쉽게 바꾸기");
    await page.getByRole("button", { name: "화면에 표시하기", exact: true }).click();
    await expect(result).toContainText("버튼 이름을 더 쉽게 바꾸기");
    await capture(3);
    await next.click();
    await expect(body).toContainText(correct ? "예측대로" : "처음 예측과 달리");
    await capture(4);
    if (correct) {
      await page.getByText("선택 · 항목을 고르면 화면은 어떻게 바뀔까요?", { exact: true }).click();
      const first = page.getByRole("button", { name: "소개 페이지 · 예시 상세 보기", exact: true });
      await first.press("Enter");
      await expect(first).toHaveAttribute("aria-pressed", "true");
      await expect(body).toContainText("목적·독자·주요 내용을 한 페이지에 배치한 작업");
      await page
        .getByRole("button", { name: "화면 개선 기록 · 예시 상세 보기", exact: true })
        .click();
      await expect(first).toHaveAttribute("aria-pressed", "false");
      await page.getByRole("button", { name: "예시 상세 닫기", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "화면 개선 기록 · 예시 상세 보기", exact: true }),
      ).toBeFocused();
      await page.getByText("선택 · 항목을 고르면 화면은 어떻게 바뀔까요?", { exact: true }).click();
    }
    await next.click();
    await capture(5);
    await page.getByRole("button", { name: "새로고침과 저장으로 →", exact: true }).click();
    await storage("버튼 이름을 더 쉽게 바꾸기", false);
    await shared("버튼 이름을 더 쉽게 바꾸기", false);
    if (correct) {
      await page.evaluate(() => {
        history.pushState(null, "", "/workbook/classes/vibe-web/lessons/interaction");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      await page.getByRole("button", { name: "이전 설명", exact: true }).click();
      await page.getByRole("button", { name: "이전 설명", exact: true }).click();
      await field.fill("새로 표시할 문장");
      await expect(
        page.getByRole("region", { name: "홈페이지 메모 예시", exact: true }),
      ).toContainText("버튼 이름을 더 쉽게 바꾸기");
      await page.getByRole("button", { name: "화면에 표시하기", exact: true }).click();
      await next.click();
      await next.click();
      await page.getByRole("button", { name: "새로고침과 저장으로 →", exact: true }).click();
      await storage("새로 표시할 문장", true);
      await shared("새로 표시할 문장", true);
    }
    await page.getByRole("button", { name: "단원 마치고 다음 학습 보기 →", exact: true }).click();
    await expect(page).toHaveURL(/view=map/);
    async function shared(text: string, repeated: boolean) {
      await expect(page).toHaveURL(/\/shared-data$/);
      await captureShared(1);
      await expect(body).toContainText(text);
      if (!repeated) await expect(next).toBeDisabled();
      await page
        .getByRole("button", {
          name: correct
            ? "그 브라우저에만 있어서 다른 기기에는 없어요"
            : "다른 기기에도 같은 메모가 보여요",
          exact: true,
        })
        .click();
      await next.click();
      await expect(next).toBeDisabled();
      const example = page.getByRole("region", { name: "기기별 메모 예시", exact: true });
      await expect(example).toContainText(text);
      const other = page.getByRole("button", { name: "다른 기기 예시 보기", exact: true });
      await other.press("Enter");
      await expect(other).toHaveAttribute("aria-pressed", "true");
      await expect(example).toContainText("표시할 메모가 없어요");
      await expect(example).not.toContainText(text);
      await expect(page.getByRole("status")).toContainText(
        correct ? "예측대로" : "처음 예측과 달리",
      );
      await page.getByRole("button", { name: "이 브라우저 예시 보기", exact: true }).click();
      await expect(example).toContainText(text);
      await captureShared(2);
      await next.click();
      await captureShared(3);
      await next.click();
      const wrong = page.getByRole("button", {
        name: /^혼자 이 브라우저에서만 다시 읽는 메모/,
      });
      await wrong.click();
      await expect(wrong).toHaveAttribute("data-answer", "incorrect");
      await expect(next).toBeDisabled();
      const right = page.getByRole("button", {
        name: /^친구가 다른 컴퓨터에서 쓴 답장을 함께 읽기/,
      });
      await right.click();
      await expect(right).toHaveAttribute("data-answer", "correct");
      await captureShared(4);
      await next.click();
      const reason = page.getByRole("textbox", { name: "표시·저장·공유가 다른 이유", exact: true });
      if (!repeated) {
        await expect(next).toBeDisabled();
        await reason.fill("화면 표시와 저장은 별개이고 다른 기기는 같은 저장 칸을 쓰지 않아요.");
      } else
        await expect(reason).toHaveValue(
          "화면 표시와 저장은 별개이고 다른 기기는 같은 저장 칸을 쓰지 않아요.",
        );
      await captureShared(5);
      await next.click();
      await captureShared(6);
      await expect(
        page.getByRole("button", { name: "단원 마치고 다음 학습 보기 →", exact: true }),
      ).toBeEnabled();
      async function captureShared(screen: number) {
        await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText(
          `화면 ${screen} / 6`,
        );
        if (testInfo.project.name === "desktop")
          await expect
            .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
            .toBeLessThanOrEqual(2);
        await page.screenshot({
          path: testInfo.outputPath(`shared-${repeated ? "repeated" : "first"}-${screen}.png`),
        });
      }
    }
    async function storage(text: string, repeated: boolean) {
      await expect(page).toHaveURL(/\/browser-storage$/);
      await captureStorage(1);
      await expect(body).toContainText(text);
      await next.click();
      if (!repeated) await expect(next).toBeDisabled();
      await page
        .getByRole("button", {
          name: correct
            ? "저장하지 않았으니 새로고침하면 사라져요"
            : "화면에 보였으니 새로고침해도 남아요",
          exact: true,
        })
        .click();
      await captureStorage(2);
      await next.click();
      await expect(next).toBeDisabled();
      await expect(
        page.getByRole("region", { name: "저장 없는 경우의 화면", exact: true }),
      ).toContainText(text);
      await page
        .getByRole("button", { name: "저장 없이 다시 열기 (예시)", exact: true })
        .press("Enter");
      await expect(
        page.getByRole("region", { name: "저장 없는 경우의 화면", exact: true }),
      ).toContainText("표시할 메모가 없어요");
      await captureStorage(3);
      await next.click();
      await expect(next).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "저장 후 다시 열기 (예시)", exact: true }),
      ).toBeDisabled();
      await page.getByRole("button", { name: "방금 메모 저장하기 (예시)", exact: true }).click();
      await expect(body).toContainText(text);
      await expect(next).toBeDisabled(); // 저장만으로 다시 읽기까지 확인한 것은 아니다.
      await page.getByRole("button", { name: "저장 후 다시 열기 (예시)", exact: true }).click();
      await expect(page.getByRole("status")).toContainText("같은 메모를 읽어");
      await captureStorage(4);
      await next.click();
      await expect(body).toContainText(correct ? "예측대로" : "처음 예측과 달리");
      await captureStorage(5);
      await next.click();
      await captureStorage(6);
      await page.getByRole("button", { name: "이전 설명", exact: true }).click();
      await next.click();
      await expect(body).toContainText(text);
      await page.getByRole("button", { name: "다른 기기와 서버로 →", exact: true }).click();
      async function captureStorage(screen: number) {
        await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText(
          `화면 ${screen} / 6`,
        );
        if (testInfo.project.name === "desktop")
          await expect
            .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
            .toBeLessThanOrEqual(2);
        await page.screenshot({
          path: testInfo.outputPath(`storage-${repeated ? "repeated" : "first"}-${screen}.png`),
        });
      }
    }
    async function capture(screen: number) {
      await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText(
        `화면 ${screen} / 5`,
      );
      if (testInfo.project.name === "desktop")
        await expect
          .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
          .toBeLessThanOrEqual(2);
      await page.screenshot({ path: testInfo.outputPath(`interaction-${screen}.png`) });
    }
  });
}

test("메모 없이 저장 수업에 직접 들어오면 표시 실험을 안내한다", async ({ page }) => {
  await page.goto("/workbook/classes/vibe-web/lessons/browser-storage");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("새로고침과 저장");
  await expect(page.getByRole("button", { name: "다음으로", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "4-1 표시 실험으로 돌아가기", exact: true }).click();
  await expect(page).toHaveURL(/\/interaction$/);
});

test("저장 확인 없이 다른 기기 수업에 들어오면 저장 실험을 안내한다", async ({ page }) => {
  await page.goto("/workbook/classes/vibe-web/lessons/shared-data");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("다른 기기와 서버");
  await expect(page.getByRole("button", { name: "다음으로", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "4-2 저장 실험으로 돌아가기", exact: true }).click();
  await expect(page).toHaveURL(/\/browser-storage$/);
});

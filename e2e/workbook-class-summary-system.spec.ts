import { expect, test } from "@playwright/test";
for (const scenario of [
  "예시 학습만",
  "이전 확인 기록",
  "일부 실제 확인",
  "변경 후 재확인",
  "전체 실제 확인",
]) {
  test(`클래스 정리는 학습과 실제 결과를 구분한다: ${scenario}`, async ({ page }, testInfo) => {
    if (testInfo.project.name === "desktop")
      await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/demo/workbook-class-summary");
    await page.getByRole("button", { name: scenario, exact: true }).click();
    await page.getByRole("button", { name: "정리 화면 열기", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "배운 것과 내 파일, 다음 할 일",
    );
    const body = page.getByLabel("수업 내용", { exact: true });
    const tabs = page.getByRole("group", { name: "정리할 기록", exact: true });
    await expect(body).toContainText("기본 5/5단원");
    await expect(body.getByRole("row")).toHaveCount(6);
    await capture("learned");
    await tabs.getByRole("button", { name: "실제 결과", exact: true }).press("Enter");
    const actual = page.getByRole("region", { name: "내 프로젝트에서 확인한 것", exact: true });
    if (scenario === "예시 학습만") {
      await expect(actual).toContainText(
        "이번에는 예시로 학습했어요. 내 컴퓨터에서 만든 결과를 확인하면 여기에 남길 수 있어요.",
      );
      await expect(actual.getByText("이전에 남긴 내 파일 기록", { exact: true })).toHaveCount(0);
      await expect(actual).not.toContainText("최종 프로젝트 완료는 아직");
    } else {
      await expect(actual).toContainText(
        scenario === "일부 실제 확인"
          ? "2개 목표"
          : scenario === "변경 후 재확인"
            ? "1개 목표"
            : scenario === "전체 실제 확인"
              ? "5개 목표"
              : "0개 목표",
      );
      await expect(actual).toContainText(
        scenario === "전체 실제 확인"
          ? "최종 프로젝트 확인 기록이 있어요"
          : "최종 프로젝트 완료는 아직 확인되지 않았어요",
      );
    }
    if (scenario === "이전 확인 기록") {
      await page.getByText("이전에 남긴 내 파일 기록", { exact: true }).click();
      await expect(actual).toContainText("이전 양식에서 직접 적용했다고 남긴 결과");
      await expect(actual).toContainText("0개 목표");
      await page.getByText("이전에 남긴 내 파일 기록", { exact: true }).click();
    }
    await capture("actual");
    await tabs.getByRole("button", { name: "남은 일", exact: true }).click();
    const next = page.getByRole("region", { name: "아직 남은 일", exact: true });
    if (scenario === "전체 실제 확인")
      await expect(next).toContainText("실제 목표 확인 기록이 모두 남아 있어요");
    else await expect(next.getByRole("table")).toBeVisible();
    if (scenario === "변경 후 재확인") {
      await expect(next).toContainText("변경 후 재확인 필요");
      await next.getByText("보존한 확인 근거 보기", { exact: true }).first().click();
      await expect(next).toContainText("실제 결과를 확인했다고 남긴 검토용 기록");
      await next.getByText("보존한 확인 근거 보기", { exact: true }).first().click();
    }
    await capture("next");
    await tabs.getByRole("button", { name: "배운 핵심", exact: true }).click();
    await expect(body.getByRole("row")).toHaveCount(6);
    if (scenario === "예시 학습만") {
      await page.getByRole("button", { name: "남은 일 보기", exact: true }).click();
      await expect(next).toBeVisible();
      await expect(
        next.getByRole("button", { name: "첫 파일 확인으로 →", exact: true }),
      ).toBeEnabled();
    }
    async function capture(name: string) {
      await expect
        .poll(() => body.evaluate((el) => el.scrollWidth - el.clientWidth))
        .toBeLessThanOrEqual(2);
      if (name === "learned" && testInfo.project.name === "desktop")
        await expect
          .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
          .toBeLessThanOrEqual(2);
      await page.screenshot({ path: testInfo.outputPath(`summary-${name}.png`) });
    }
  });
}

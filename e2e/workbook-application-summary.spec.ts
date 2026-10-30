import { expect, test } from "@playwright/test";

test("선택 적용 결과와 남은 문제는 마지막 정리에 연결되고 예시·공개 전체 완료와 구분된다", async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/demo/workbook-class-summary");
  await page.getByRole("button", { name: "일부 실제 확인", exact: true }).click();
  await page.getByRole("button", { name: "정리 화면 열기", exact: true }).click();
  const tabs = page.getByRole("group", { name: "정리할 기록", exact: true });
  const actual = page.getByRole("region", { name: "내 프로젝트에서 확인한 것", exact: true });
  const next = page.getByRole("region", { name: "아직 남은 일", exact: true });
  const applied = page.getByRole("region", { name: "내 프로젝트 적용 기록", exact: true });
  for (const [index, name] of [
    "반응형 화면 만들기",
    "기능과 데이터 저장",
    "배포하고 고치기",
  ].entries()) {
    await tabs.getByRole("button", { name: "남은 일", exact: true }).click();
    await next.getByRole("button", { name: "다음 내 파일 적용 기록 열기 →", exact: true }).click();
    await expect(applied.getByRole("heading", { level: 2 })).toHaveText(
      "내 프로젝트 적용 기록 · 선택",
    );
    await expect(page.getByRole("heading", { level: 1 })).toContainText(name);
    await expect(page.locator("[data-lesson-header] h1")).toHaveCSS("font-size", "18px");
    await expect(applied.getByRole("heading", { level: 2 })).toHaveCSS(
      "font-size",
      testInfo.project.name === "desktop" ? "32px" : "26px",
    );
    await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveCount(0);
    await expect(page.getByText("선택 실습 · 기본 수업과 별도", { exact: true })).toBeVisible();
    const mode = applied.getByRole("group", { name: "적용 기록 방식", exact: true });
    expect(
      await mode
        .getByRole("button")
        .first()
        .evaluate((el) => getComputedStyle(el, "::before").content),
    ).not.toBe("none");
    if (index === 0) {
      await applied.getByText("내 파일 실습 안내 펼치기", { exact: true }).click();
      const diagnosis = applied.getByRole("group", { name: "막힌 상황 선택", exact: true });
      await diagnosis.getByRole("button").first().press("Enter");
      await expect(diagnosis.getByRole("button").first()).toHaveAttribute("aria-pressed", "true");
      await page.screenshot({ path: testInfo.outputPath("application-guide.png") });
      await applied.getByText("내 파일 실습 안내 펼치기", { exact: true }).click();
      await page.screenshot({ path: testInfo.outputPath("application-record.png") });
    }
    await applied.getByRole("button", { name: "내 파일에 적용한 결과 적기", exact: true }).click();
    const confirm = applied.getByRole("button", {
      name: "확인한 범위 충족으로 기록하기",
      exact: true,
    });
    await expect(confirm).toBeDisabled();
    await applied
      .getByRole("textbox", { name: "내 파일에서 확인한 결과", exact: true })
      .fill(`${name}: 직접 확인한 결과`);
    await applied
      .getByRole("textbox", { name: "남은 문제 또는 문제없음", exact: true })
      .fill(index === 1 ? "새로고침 후 관심 표시가 사라짐" : "확인한 범위에서 문제없음");
    await applied
      .getByRole("textbox", { name: "직접 다시 확인한 근거", exact: true })
      .fill("내 프로젝트를 다시 열어 같은 동작을 확인함");
    if (index === 1)
      await applied
        .getByRole("button", { name: "남은 문제가 있는 결과로 기록하기", exact: true })
        .click();
    else await confirm.click();
    await page.getByRole("button", { name: "마지막 정리로", exact: true }).click();
    await tabs.getByRole("button", { name: "실제 결과", exact: true }).click();
    await expect(actual).toContainText(index === 0 || index === 1 ? "3개 목표" : "4개 목표");
    await expect(actual).toContainText(`${name}: 직접 확인한 결과`);
    await expect(actual).toContainText("최종 프로젝트 완료는 아직 확인되지 않았어요");
    if (index === 1) {
      await tabs.getByRole("button", { name: "남은 일", exact: true }).click();
      const row = next.getByRole("row").filter({ hasText: "동작·저장 범위" });
      await expect(row).toContainText("새로고침 후 관심 표시가 사라짐");
      await page.screenshot({ path: testInfo.outputPath("application-waiting.png") });
      await next
        .getByRole("button", { name: "다음 내 파일 적용 기록 열기 →", exact: true })
        .click();
      await applied
        .getByRole("textbox", { name: "내 파일에서 확인한 결과", exact: true })
        .fill("저장 수정 후 관심 표시가 유지됨");
      await expect(applied).toContainText("이전 확인은 보존");
      await applied
        .getByRole("textbox", { name: "남은 문제 또는 문제없음", exact: true })
        .fill("확인한 범위에서 문제없음");
      await applied
        .getByRole("textbox", { name: "직접 다시 확인한 근거", exact: true })
        .fill("저장과 해제 후 각각 새로고침해 확인함");
      await confirm.click();
      await page.getByRole("button", { name: "마지막 정리로", exact: true }).click();
      await tabs.getByRole("button", { name: "실제 결과", exact: true }).click();
      await expect(actual).toContainText("4개 목표");
      await expect(actual).toContainText("저장 수정 후 관심 표시가 유지됨");
    }
  }
  await page.screenshot({ path: testInfo.outputPath("application-actual.png") });
  await tabs.getByRole("button", { name: "남은 일", exact: true }).click();
  await expect(next.getByRole("row")).toHaveCount(2); // 공개·공유·재배포 전체 확인은 남긴다.
  await expect(next).toContainText("적용 결과는 기록했어요");
  await expect(next).toContainText("공개 주소 접속·공유·수정 후 같은 주소의 재배포");
  await tabs.getByRole("button", { name: "실제 결과", exact: true }).click();
  const experience = actual
    .locator("dl > div")
    .filter({ has: page.locator("dt", { hasText: "두 화면 확인" }) });
  await experience.getByRole("button", { name: "적용 기록 열기", exact: true }).click();
  await applied
    .getByRole("textbox", { name: "내 파일에서 확인한 결과", exact: true })
    .fill("바뀐 파일은 아직 확인 전");
  await page.getByRole("button", { name: "마지막 정리로", exact: true }).click();
  await expect(actual).toContainText("2개 목표");
  await expect(actual).toContainText("반응형 화면 만들기: 직접 확인한 결과"); // 이전 확인 원문 보존
  await expect(actual).toContainText("변경 후 재확인 필요");
  await tabs.getByRole("button", { name: "배운 핵심", exact: true }).click();
  await expect(page.getByLabel("수업 내용", { exact: true })).toContainText("기본 5/5단원");
});

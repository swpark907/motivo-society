import { expect, test } from "@playwright/test";
import { workbookCourse } from "../src/lib/workbook-course";
import { practicalLabs } from "../src/lib/workbook-practical-labs";

for (const unit of workbookCourse) {
  test(`${unit.number}단원 선택 심화는 공통 위계와 선택지를 쓰고 답을 보존한다`, async ({
    page,
  }, info) => {
    if (info.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/demo/workbook-map-points");
    await page
      .getByRole("navigation", { name: "검토할 지도" })
      .getByRole("button", { name: unit.title, exact: true })
      .click();
    await page.getByRole("button", { name: "선택 활동 화면 검토", exact: true }).click();
    const body = page.getByLabel("수업 내용", { exact: true });
    await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-size", "18px");
    await expect(body.getByRole("heading", { level: 2 })).toHaveCSS(
      "font-size",
      info.project.name === "desktop" ? "32px" : "26px",
    );
    await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveCount(0);
    await expect(body).toContainText("수업 완료 조건에는 포함되지 않으며");
    const lab = practicalLabs[unit.stage];
    const choice = page.getByRole("group", { name: "먼저 해볼 행동", exact: true });
    const tabs = page.getByRole("group", { name: "연습 상황", exact: true });
    for (const [index, situation] of lab.situations.entries()) {
      await tabs
        .getByRole("button", { name: `${index + 1}. ${situation.name}`, exact: true })
        .click();
      const wrong = choice.getByRole("button", {
        name: situation.options[1 - situation.best],
        exact: true,
      });
      await wrong.press("Enter");
      await expect(wrong).toHaveAttribute("data-answer", "incorrect");
      const correct = choice.getByRole("button", {
        name: situation.options[situation.best],
        exact: true,
      });
      const marker = await correct.evaluate((el) => getComputedStyle(el, "::before").content);
      expect(marker).not.toBe("none");
      await correct.press("Enter");
      await expect(correct).toHaveAttribute("data-answer", "correct");
      await expect(body).toContainText(situation.request);
      await expect
        .poll(() => body.evaluate((el) => el.scrollWidth - el.clientWidth))
        .toBeLessThanOrEqual(2);
    }
    await page.screenshot({ path: info.outputPath("optional-feedback.png") });
    await page.getByRole("button", { name: "같은 지도로 돌아가기 →", exact: true }).click();
    await page.getByRole("button", { name: "선택 활동 화면 검토", exact: true }).click();
    await expect(tabs.getByRole("button").last()).toHaveAttribute("aria-pressed", "true");
    await expect(
      choice.getByRole("button", {
        name: lab.situations[2].options[lab.situations[2].best],
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });
}

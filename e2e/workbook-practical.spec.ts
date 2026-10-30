import { test, expect } from "@playwright/test";
import { practicalLabs } from "../src/lib/workbook-practical-labs";

test("실전 심화에서 실패 판단을 바꾸고 상황을 왕복해 요청과 확인 기준을 다시 읽는다", async ({
  page,
}) => {
  await page.goto("/demo/workbook-practical-review");
  for (const lab of Object.values(practicalLabs)) {
    const details = page
      .locator("details")
      .filter({ has: page.locator("summary", { hasText: lab.title }) });
    await details.locator(":scope > summary").press("Enter");
    await expect(details).toContainText("실제 AI 작업을 실행하지 않아요");
    for (const [index, situation] of lab.situations.entries()) {
      await details
        .getByRole("button", { name: `${index + 1}. ${situation.name}`, exact: true })
        .click();
      const wrong = details.getByRole("button", {
        name: situation.options[1 - situation.best],
        exact: true,
      });
      await wrong.click();
      await expect(wrong).toHaveAttribute("data-result", "retry");
      await expect(details.locator('[aria-live="polite"]')).toHaveText(
        situation.reasons[1 - situation.best],
      );
      const correct = details.getByRole("button", {
        name: situation.options[situation.best],
        exact: true,
      });
      await correct.click();
      await expect(correct).toHaveAttribute("data-result", "correct");
      await expect(details).toContainText(situation.request);
      await expect(details).toContainText(situation.check);
    }
    await details
      .getByRole("button", { name: `1. ${lab.situations[0].name}`, exact: true })
      .click();
    await expect(details.locator('[data-result="correct"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await details.locator(":scope > summary").press("Space");
    await details.locator(":scope > summary").press("Enter");
    await expect(details).toContainText(lab.situations[0].request);
  }
});

test("파일 위치 진단은 적용할 상황과 마칠 기준, 같은 경로에서 막힐 때의 다음 행동을 안내한다", async ({
  page,
}) => {
  await page.goto("/demo/workbook-practical-review");
  const lab = practicalLabs.agent;
  const situation = lab.situations[0];
  const details = page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: lab.title }) });
  await details.locator(":scope > summary").press("Enter");
  await expect(
    details.getByRole("heading", { name: "내 파일에서 해볼 일", exact: true }),
  ).toHaveCount(0);
  await details
    .getByRole("button", { name: situation.options[situation.best], exact: true })
    .click();
  await expect(details).toContainText(situation.task!);
  await expect(details).toContainText("위치가 같다는 것만으로 수정 성공은 아니에요.");
  const hint = details.locator("details");
  await expect(hint.locator("p")).toBeHidden();
  await hint.locator("summary").press("Enter");
  await expect(hint.locator("p")).toHaveText(situation.retry!);
  await details.getByRole("button", { name: `2. ${lab.situations[1].name}`, exact: true }).click();
  await expect(
    details.getByRole("heading", { name: "내 파일에서 해볼 일", exact: true }),
  ).toHaveCount(0);
  await details.getByRole("button", { name: `1. ${situation.name}`, exact: true }).click();
  await expect(details).toContainText(situation.task!);
  await expect(details.locator('[data-result="correct"]')).toHaveAttribute("aria-pressed", "true");
});

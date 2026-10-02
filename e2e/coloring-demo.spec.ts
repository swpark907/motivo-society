import { expect, test } from "@playwright/test";

test("color a garden region, undo and restore progress after reload", async ({ page }) => {
  await page.goto("/workbook");
  await page.getByRole("link", { name: /비밀 정원 · 컬러링 데모/ }).click();
  await expect(page).toHaveURL(/\/demo\/coloring-book$/);
  await expect(page.getByRole("status")).toContainText("색을 고르고");
  const canvas = page.locator("canvas");
  const point = await canvas.evaluate((element: HTMLCanvasElement) => {
    const pixels = element.getContext("2d")!.getImageData(0, 0, element.width, element.height).data;
    const rect = element.getBoundingClientRect();
    // Find a white patch surrounded by white pixels, away from fine contour edges.
    for (let y = 10; y < element.height / 3; y += 4) {
      for (let x = (element.width / 3) | 0; x < (element.width * 2) / 3; x += 4) {
        if (
          [-3, 0, 3].every((dy) =>
            [-3, 0, 3].every((dx) => pixels[((y + dy) * element.width + x + dx) * 4] > 245),
          )
        )
          return { x: (x / element.width) * rect.width, y: (y / element.height) * rect.height };
      }
    }
    throw new Error("No tappable white region");
  });
  await page.getByRole("button", { name: "숲", exact: true }).click();
  await canvas.click({ position: point });
  await expect(page.getByTestId("coloring-progress")).toContainText(/^1 \/ [\d,]+칸$/);
  await page.getByRole("button", { name: "되돌리기" }).click();
  await expect(page.getByTestId("coloring-progress")).toContainText(/^0 \//);
  await canvas.click({ position: point });
  await page.reload();
  await expect(page.getByTestId("coloring-progress")).toContainText(/^1 \//);
  await page.getByRole("button", { name: "확대", exact: true }).click();
  await expect(page.getByText("150%", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "원본 시안 보기" }).click();
  await expect(page.getByRole("img", { name: /꽃과 유리 온실/ })).toBeVisible();
  await page.getByRole("button", { name: "색칠로 돌아가기" }).click();
  await page.getByRole("button", { name: "전체 보기" }).click();
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG 저장" }).click();
  expect((await download).suggestedFilename()).toBe("나의-비밀-정원.png");
});

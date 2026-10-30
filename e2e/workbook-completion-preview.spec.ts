import { expect, test } from "@playwright/test";
import { initialRoomCollection } from "../src/lib/workbook-room-collection";

test("학습 없이 완료 예시와 첨부 화면을 검토해도 작업실 저장은 바뀌지 않는다", async ({
  page,
}, testInfo) => {
  const stored = JSON.stringify(initialRoomCollection());
  await page.addInitScript(
    (value) => localStorage.setItem("motivo.workbook.room.v1", value),
    stored,
  );
  await page.goto("/demo/workbook-completion");
  await expect(
    page.getByRole("heading", { name: "단원 완료 화면 테스트", exact: true }),
  ).toBeVisible();
  const summary = page.getByRole("region", { name: "단원 완료 요약", exact: true });
  await expect(summary).toContainText("기획하고 첫 화면 만들기 · 학습 완료");
  await summary.getByRole("button", { name: "기획 미리보기 크게 보기", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "완료한 화면 살펴보기", exact: true });
  await expect(
    dialog.getByRole("region", { name: "완료 요약 기획 예시", exact: true }),
  ).toContainText("내가 만든 작은 웹 모음");
  await dialog.press("Escape");
  await page.getByRole("button", { name: "반응형 화면 만들기", exact: true }).click();
  await summary.getByRole("button", { name: "수정 전 예시 크게 보기", exact: true }).click();
  await expect(
    dialog.getByRole("region", { name: "완료 요약 수정 전 예시", exact: true }),
  ).toBeVisible();
  const after = dialog.getByRole("region", { name: "완료 요약 수정 후 예시", exact: true });
  await expect(after).toBeVisible();
  await expect(dialog.getByLabel("예시에서 개선한 점")).toContainText("좌우로 밀지 않고");
  await dialog.getByRole("button", { name: "PC 너비", exact: true }).click();
  await expect(dialog.getByLabel("예시에서 개선한 점")).toContainText("차이가 작아요");
  await dialog.getByRole("button", { name: "모바일 너비", exact: true }).click();
  const screenshot = await after.screenshot();
  await dialog.getByRole("button", { name: "직접 첨부한 화면", exact: true }).click();
  await dialog
    .getByLabel("내 화면 · 수정 후 스크린샷 선택", { exact: true })
    .setInputFiles({ name: "test.png", mimeType: "image/png", buffer: screenshot });
  await expect(
    dialog.getByRole("img", { name: "내 화면 · 수정 후 · 직접 첨부한 스크린샷", exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "변경 영역 표시", exact: true }).click();
  const image = dialog.getByRole("img", {
    name: "내 화면 · 수정 후 · 직접 첨부한 스크린샷",
    exact: true,
  });
  await image.evaluate((element) => element.scrollIntoView({ block: "center" }));
  const bounds = (await image.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width * 0.1, bounds.y + bounds.height * 0.1);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.6, bounds.y + bounds.height * 0.4, {
    steps: 5,
  });
  await page.mouse.up();
  await expect(dialog.getByRole("group", { name: /^변경 영역 \d+$/, exact: false })).toHaveCount(1);
  await dialog.getByRole("button", { name: "모든 표시 지우기", exact: true }).click();
  await expect(dialog.getByRole("group", { name: /^변경 영역 \d+$/, exact: false })).toHaveCount(0);
  await dialog.getByRole("button", { name: "가운데 영역 표시", exact: true }).click();
  await dialog
    .getByRole("textbox", { name: "1번 영역 · 개선한 점", exact: true })
    .fill("버튼 간격을 넓혀 누르기 편하게 바꿨어요.");
  await expect(dialog.getByRole("group", { name: /^변경 영역 \d+$/, exact: false })).toHaveCount(1);
  await dialog.getByRole("button", { name: "가운데 영역 표시", exact: true }).click();
  await dialog
    .getByRole("textbox", { name: "2번 영역 · 개선한 점", exact: true })
    .fill("제목의 줄 간격을 정리했어요.");
  await expect(dialog.getByRole("group", { name: "변경 영역 2", exact: true })).toHaveCount(1);
  await dialog.getByRole("button", { name: "1번 영역 삭제", exact: true }).click();
  await expect(
    dialog.getByRole("textbox", { name: "1번 영역 · 개선한 점", exact: true }),
  ).toHaveValue("제목의 줄 간격을 정리했어요.");
  await dialog.getByRole("button", { name: "가운데 영역 표시", exact: true }).click();
  await dialog
    .getByRole("textbox", { name: "2번 영역 · 개선한 점", exact: true })
    .fill("버튼 간격을 넓혀 누르기 편하게 바꿨어요.");
  const area = dialog.getByRole("group", { name: "변경 영역 2", exact: true });
  await area.evaluate((element) => element.scrollIntoView({ block: "center" }));
  const original = (await area.boundingBox())!;
  async function drag(from: { x: number; y: number }, to: { x: number; y: number }) {
    if (testInfo.project.name === "mobile") {
      const session = await page.context().newCDPSession(page);
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from] });
      for (let step = 1; step <= 5; step++)
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [
            { x: from.x + ((to.x - from.x) * step) / 5, y: from.y + ((to.y - from.y) * step) / 5 },
          ],
        });
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await session.detach();
    } else {
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(to.x, to.y, { steps: 5 });
      await page.mouse.up();
    }
  }
  const center = { x: original.x + original.width * 0.75, y: original.y + original.height * 0.6 };
  await drag(center, { x: center.x + 12, y: center.y + 12 });
  const moved = (await area.boundingBox())!;
  expect(moved.x).toBeGreaterThan(original.x + 5);
  expect(moved.y).toBeGreaterThan(original.y + 5);
  const handle = dialog.getByRole("button", {
    name: "2번 영역 오른쪽 아래 크기 조절",
    exact: true,
  });
  const corner = (await handle.boundingBox())!;
  const point = { x: corner.x + corner.width / 2, y: corner.y + corner.height / 2 };
  await drag(point, { x: point.x + 15, y: point.y + 15 });
  const resized = (await area.boundingBox())!;
  expect(resized.width).toBeGreaterThan(moved.width + 5);
  expect(resized.height).toBeGreaterThan(moved.height + 5);
  const undo = dialog.getByRole("button", { name: "실행 취소", exact: true });
  const redo = dialog.getByRole("button", { name: "다시 실행", exact: true });
  await area.focus();
  await area.press("Control+z");
  expect((await area.boundingBox())!.width).toBeCloseTo(moved.width, 0);
  await area.press("Meta+z");
  expect((await area.boundingBox())!.x).toBeCloseTo(original.x, 0);
  await area.press("Control+Shift+z");
  await area.press("Meta+Shift+z");
  expect((await area.boundingBox())!.width).toBeCloseTo(resized.width, 0);
  await dialog.getByRole("button", { name: "2번 영역 삭제", exact: true }).click();
  await expect(area).toHaveCount(0);
  await undo.click();
  await expect(area).toHaveCount(1);
  await dialog
    .getByLabel("영역 편집 기록", { exact: true })
    .evaluate((element) => element.scrollIntoView({ block: "center" }));
  await page.screenshot({
    path: `/tmp/workbook-annotation-history-${testInfo.project.name}.png`,
    fullPage: false,
  });

  await expect(
    dialog.getByRole("textbox", { name: "2번 영역 · 개선한 점", exact: true }),
  ).toHaveValue("버튼 간격을 넓혀 누르기 편하게 바꿨어요.");
  await redo.click();
  await expect(area).toHaveCount(0);
  await undo.click();

  await expect(
    dialog.getByRole("textbox", { name: "2번 영역 · 개선한 점", exact: true }),
  ).toHaveValue("버튼 간격을 넓혀 누르기 편하게 바꿨어요.");
  await expect(dialog.getByRole("group", { name: /^변경 영역 \d+$/ })).toHaveCount(2);
  const noteInput = dialog.getByRole("textbox", { name: "2번 영역 · 개선한 점", exact: true });
  const originalNote = await noteInput.inputValue();
  await noteInput.focus();
  await noteInput.evaluate((element) => {
    const input = element as HTMLTextAreaElement;
    input.setSelectionRange(input.value.length, input.value.length);
  });
  await page.keyboard.insertText(" TEST");
  const nativeModifier = process.platform === "darwin" ? "Meta" : "Control";
  await noteInput.press(`${nativeModifier}+z`);
  await expect(noteInput).toHaveValue(originalNote);
  await expect(area).toHaveCount(1);
  await noteInput.press(`${nativeModifier}+Shift+z`);
  await expect(noteInput).toHaveValue(originalNote + " TEST");
  await noteInput.press(`${nativeModifier}+z`);
  await noteInput.evaluate((element) => element.scrollIntoView({ block: "center" }));
  const pinnedUndo = await undo.boundingBox();
  const pinnedRedo = await redo.boundingBox();
  const dialogBounds = (await dialog.boundingBox())!;
  expect(pinnedUndo!.y).toBeGreaterThanOrEqual(dialogBounds.y);
  expect(pinnedRedo!.y).toBeLessThan(dialogBounds.y + 160);
  await expect(undo).toBeInViewport();
  await expect(redo).toBeInViewport();
  await page.screenshot({
    path: `/tmp/workbook-annotation-pinned-${testInfo.project.name}.png`,
    fullPage: false,
  });
  await dialog.getByRole("button", { name: "1번 영역 설명 보기", exact: true }).click();
  await expect(
    dialog.getByRole("textbox", { name: "1번 영역 · 개선한 점", exact: true }),
  ).toBeFocused();
  await dialog.getByRole("button", { name: "2번 영역 화면에서 보기 ↑", exact: true }).click();
  await expect(dialog.getByRole("group", { name: "변경 영역 2", exact: true })).toHaveAttribute(
    "data-highlighted",
    "true",
  );
  await page.screenshot({
    path: `/tmp/workbook-annotation-editor-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "완료 화면 닫기", exact: true }).click();
  await expect(
    summary.getByRole("button", { name: "직접 첨부한 화면 1장 보기", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "기획하고 첫 화면 만들기", exact: true }).click();
  await expect(summary).toContainText("기획하고 첫 화면 만들기 · 학습 완료");
  await page.getByRole("button", { name: "반응형 화면 만들기", exact: true }).click();
  await expect(
    summary.getByRole("img", { name: "직접 첨부한 결과 화면", exact: true }),
  ).toHaveCount(1);
  await expect(summary.getByRole("group", { name: /^변경 영역 \d+$/, exact: false })).toHaveCount(
    2,
  );
  await expect(summary.getByLabel("수정 후 개선 기록")).toContainText("버튼 간격을 넓혀");
  await summary.getByRole("button", { name: "2번 영역 설명 보기", exact: true }).click();
  const explanation = summary.getByRole("button", {
    name: "버튼 간격을 넓혀 누르기 편하게 바꿨어요.",
    exact: true,
  });
  await expect(explanation).toBeFocused();
  await explanation.click();
  await expect(summary.getByRole("group", { name: "변경 영역 2", exact: true })).toHaveAttribute(
    "data-highlighted",
    "true",
  );
  expect(await page.evaluate(() => localStorage.getItem("motivo.workbook.room.v1"))).toBe(stored);
  await page.screenshot({
    path: `/tmp/workbook-annotation-summary-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await expect(summary.getByRole("status", { name: "첨부 임시 저장 상태" })).toHaveText(
    "브라우저에 임시 저장됨",
  );
  const savedImage = await summary
    .getByRole("img", { name: "직접 첨부한 결과 화면", exact: true })
    .getAttribute("src");
  await page.reload();
  await page.getByRole("button", { name: "반응형 화면 만들기", exact: true }).click();
  await expect(
    summary.getByRole("img", { name: "직접 첨부한 결과 화면", exact: true }),
  ).toHaveAttribute("src", savedImage!);
  await expect(summary.getByRole("group", { name: /^변경 영역 \d+$/ })).toHaveCount(2);
  await expect(summary.getByLabel("수정 후 개선 기록")).toContainText("버튼 간격을 넓혀");
  await page.goto("/workbook");
  const officialPicture = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("motivo-workbook-results", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("drafts", "readonly");
          const picture = tx.objectStore("drafts").get("vibe-web:experience:after");
          tx.oncomplete = () => {
            resolve(picture.result ?? null);
            db.close();
          };
        };
      }),
  );
  expect(officialPicture).toBeNull();
  await page.goto("/demo/workbook-completion");
  await page.getByRole("button", { name: "반응형 화면 만들기", exact: true }).click();
  await expect(summary.getByRole("group", { name: /^변경 영역 \d+$/ })).toHaveCount(2);
  await summary.getByRole("button", { name: "직접 첨부한 수정 후 크게 보기", exact: true }).click();
  const restoredNote = dialog.getByRole("textbox", { name: "2번 영역 · 개선한 점", exact: true });
  await expect(restoredNote).toHaveValue("버튼 간격을 넓혀 누르기 편하게 바꿨어요.");
  await restoredNote.fill("복원한 뒤에도 계속 수정했어요.");
  await dialog.getByRole("button", { name: "완료 화면 닫기", exact: true }).click();
  await expect(summary.getByRole("status", { name: "첨부 임시 저장 상태" })).toHaveText(
    "브라우저에 임시 저장됨",
  );
  await page.reload();
  await page.getByRole("button", { name: "반응형 화면 만들기", exact: true }).click();
  await expect(summary.getByLabel("수정 후 개선 기록")).toContainText(
    "복원한 뒤에도 계속 수정했어요.",
  );
  await page.getByRole("button", { name: "첨부한 화면 초기화", exact: true }).click();
  await expect(summary.getByRole("img")).toHaveCount(0);
  await expect(summary.getByRole("status", { name: "첨부 임시 저장 상태" })).toHaveText(
    "브라우저에 임시 저장됨",
  );
  await expect(
    summary.getByRole("button", { name: "수정 전 예시 크게 보기", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `/tmp/workbook-completion-demo-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.reload();
  await expect(summary).toContainText("기획하고 첫 화면 만들기 · 학습 완료");
  await page.getByRole("button", { name: "반응형 화면 만들기", exact: true }).click();
  await expect(summary.getByRole("status", { name: "첨부 임시 저장 상태" })).toHaveText(
    "브라우저에 임시 저장됨",
  );
  await expect(summary.getByRole("img")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("motivo.workbook.room.v1"))).toBe(stored);
});

test("브라우저 저장소를 사용할 수 없으면 저장된 것처럼 표시하지 않는다", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  await page.goto("/demo/workbook-completion");
  const status = page.getByRole("status", { name: "첨부 임시 저장 상태" });
  await expect(status).toContainText("불러오지 못했어요");
  await expect(status).not.toContainText("임시 저장됨");
  await page.getByRole("button", { name: "내가 만든 화면 첨부하기", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "완료한 화면 살펴보기", exact: true }),
  ).toBeVisible();
});

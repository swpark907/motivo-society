import { expect, test } from "@playwright/test";

test("소품을 실제 이동하고 보관·저장·취소하며 닫은 뒤에도 방문 배치를 유지한다", async ({
  page,
  isMobile,
}) => {
  await page.goto("/demo/workbook-home-next");
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  await page.getByRole("button", { name: "이전 자유 배치", exact: true }).click();
  const room = page.getByRole("region", { name: "카피바라의 하루, 내가 꾸미는 방.", exact: true });
  await room.getByRole("button", { name: "소품 배치하기", exact: true }).click();
  const control = room.getByRole("complementary", { name: "소품 위치 조정" });
  const note = room.getByRole("button", { name: "공방의 기획 노트 선택", exact: true });
  await note.scrollIntoViewIfNeeded();
  const box = await note.boundingBox();
  if (!box) throw new Error("배치 소품이 보이지 않아요");
  // 실제 입력을 사용해 mouse와 touch의 pointer capture 경로를 각각 확인한다.
  if (isMobile) {
    const client = await page.context().newCDPSession(page);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }],
    });
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: box.x + box.width / 2 + 24, y: box.y + box.height / 2 + 12, id: 1 }],
    });
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await client.detach();
  } else {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 20, { steps: 6 });
    await page.mouse.up();
  }
  await expect(control).not.toContainText("위치 61.8 · 40.0");
  await control.getByRole("button", { name: "수집함에 보관", exact: true }).click();
  await expect(note).toHaveCount(0);
  await control.getByRole("button", { name: "방에 놓기", exact: true }).click();
  await room.getByRole("button", { name: "배치 저장", exact: true }).click();
  const saved = (await control.textContent())!;
  await page.getByRole("button", { name: "작업실 닫기 ×", exact: true }).click();
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  await expect(control).toHaveText(saved);
  await room.getByRole("button", { name: "소품 배치하기", exact: true }).click();
  await control.getByRole("button", { name: "오른쪽 이동", exact: true }).click();
  await room.getByRole("button", { name: "배치 취소", exact: true }).click();
  await expect(control).toHaveText(saved);
});

test("액션과 가구 레이어는 소품 배치를 바꾸지 않고 독립 전환된다", async ({ page }) => {
  await page.goto("/demo/workbook-home-next");
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  await page.getByRole("button", { name: "이전 자유 배치", exact: true }).click();
  const room = page.getByRole("region", { name: "카피바라의 하루, 내가 꾸미는 방.", exact: true });
  await expect(
    room.getByRole("img", { name: "카피바라 작업하기 액션", exact: true }),
  ).toBeVisible();
  await room.getByRole("button", { name: "책 읽기", exact: true }).click();
  await expect(room.getByRole("img", { name: "카피바라 책 읽기 액션", exact: true })).toBeVisible();
  await room.getByRole("button", { name: "낮잠 자기", exact: true }).click();
  await expect(
    room.getByRole("img", { name: "카피바라 낮잠 자기 액션", exact: true }),
  ).toBeVisible();
  await room.getByRole("button", { name: "가구 숨겨보기", exact: true }).click();
  await expect(
    room.getByRole("img", { name: "분리된 책상·의자·선반·화분 가구 레이어", exact: true }),
  ).toHaveCount(0);
  await expect(
    room.getByRole("img", { name: "햇빛이 드는 창과 나무 바닥, 러그가 있는 방 배경", exact: true }),
  ).toBeVisible();
  await expect(
    room.getByRole("button", { name: "공방의 기획 노트 선택", exact: true }),
  ).toBeVisible();
  await room.getByRole("button", { name: "가구 보이기", exact: true }).click();
  await expect(
    room.getByRole("img", { name: "분리된 책상·의자·선반·화분 가구 레이어", exact: true }),
  ).toBeVisible();
});

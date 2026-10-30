import { expect, test } from "@playwright/test";
import { initialRoomCollection } from "../src/lib/workbook-room-collection";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    (state) => {
      if (!localStorage.getItem("motivo.workbook.room.v1"))
        localStorage.setItem("motivo.workbook.room.v1", JSON.stringify(state));
    },
    { ...initialRoomCollection(), laptopAvailable: true, available: ["print", "radio", "bonsai"] },
  );
});

test("수집품을 크게 확인하고 바로 배치하며 저장 전에는 취소할 수 있다", async ({
  page,
}, testInfo) => {
  await page.goto("/workbook");
  await page.getByRole("button", { name: "초록 잎 포스터 수집함 열기", exact: true }).click();
  const room = page.getByRole("region", { name: "취향을 하나씩, 나의 작업실.", exact: true });
  const scene = room.getByRole("img", { name: /카피바라의 작업실/ });
  await room.getByRole("button", { name: "초록 잎 포스터 받기", exact: true }).click();
  const received = page.getByRole("dialog", { name: "초록 잎 포스터 수집 완료", exact: true });
  await expect(received).toBeVisible();
  await expect(
    received.getByRole("img", { name: "초록 잎 포스터 크게 보기", exact: true }),
  ).toBeVisible();
  await expect(received).toContainText("배치 저장");
  await expect
    .poll(() =>
      received
        .locator("img")
        .evaluateAll((images) =>
          images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
        ),
    )
    .toBe(true);
  await page.screenshot({ path: `/tmp/workbook-received-${testInfo.project.name}.png` });
  await received.getByRole("button", { name: "작업실에 놓기", exact: true }).click();
  await expect(received).toHaveCount(0);
  await expect(room.locator('[data-room-highlight="print"]')).toBeVisible();
  await expect(scene).toHaveAccessibleName(/초록 잎 포스터/);
  await expect(
    room.getByRole("region", { name: "작업실 배치 미리보기", exact: true }),
  ).toBeFocused();
  await expect(page.locator('[data-room-scene="home"]')).not.toHaveAccessibleName(/초록 잎 포스터/);
  await room.getByRole("button", { name: "변경 취소", exact: true }).click();
  await expect(room.locator("[data-room-highlight]")).toHaveCount(0);
  await expect(scene).not.toHaveAccessibleName(/초록 잎 포스터/);
  await expect(room.getByText("초록 잎 포스터 · 수집 완료", { exact: true })).toBeVisible();
  await room.getByRole("button", { name: "초록 잎 포스터 선택해서 놓기", exact: true }).click();
  await room.getByRole("button", { name: "배치 저장", exact: true }).click();
  await page.reload();
  await expect(page.locator('[data-room-scene="home"]')).toHaveAccessibleName(/초록 잎 포스터/);
});

test("Escape는 수령 화면만 닫고 물건은 수집함에 보관한다", async ({ page }) => {
  await page.goto("/workbook");
  await page.getByRole("button", { name: "초록 잎 포스터 수집함 열기", exact: true }).click();
  await page.getByRole("button", { name: "초록 잎 포스터 받기", exact: true }).click();
  await page.getByRole("dialog", { name: "초록 잎 포스터 수집 완료", exact: true }).press("Escape");
  await expect(page.getByRole("dialog", { name: "카피바라의 작업실", exact: true })).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "초록 잎 포스터 수집 완료", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "초록 잎 포스터 수집 안내", exact: true }),
  ).toBeFocused();
  await expect(page.getByRole("button", { name: "배치 저장", exact: true })).toBeDisabled();
});

test("전용 물건은 설명한 테마에 놓고 다른 테마 배치는 유지한다", async ({ page }) => {
  await page.goto("/workbook");
  await page.getByRole("button", { name: "돌 위의 작은 나무 수집함 열기", exact: true }).click();
  const room = page.getByRole("region", { name: "취향을 하나씩, 나의 작업실.", exact: true });
  await room.getByRole("combobox", { name: "방 테마", exact: true }).selectOption("city");
  await room.getByRole("combobox", { name: "창밖 풍경", exact: true }).selectOption("coast");
  await room.getByRole("button", { name: "배치 저장", exact: true }).click();
  await room.getByRole("button", { name: "돌 위의 작은 나무 받기", exact: true }).click();
  const received = page.getByRole("dialog", { name: "돌 위의 작은 나무 수집 완료", exact: true });
  await expect(received).toContainText("햇살 드는 나무 작업실로 전환");
  await received.getByRole("button", { name: "작업실에 놓기", exact: true }).click();
  await expect(room.getByRole("combobox", { name: "방 테마", exact: true })).toHaveValue("wood");
  await expect(room.getByRole("img", { name: /카피바라의 작업실/ })).toHaveAccessibleName(
    /돌 위의 작은 나무/,
  );
  await room.getByRole("combobox", { name: "방 테마", exact: true }).selectOption("city");
  await expect(room.getByRole("combobox", { name: "창밖 풍경", exact: true })).toHaveValue("coast");
  await room.getByRole("combobox", { name: "방 테마", exact: true }).selectOption("wood");
  await room.getByRole("button", { name: "배치 저장", exact: true }).click();
  await page.reload();
  await expect(page.locator('[data-room-scene="home"]')).toHaveAccessibleName(
    /햇살 드는 나무 작업실.*돌 위의 작은 나무/,
  );
});

test("네 수집품의 배치 위치를 잠깐 표시하고 줄인 모션에서도 자동으로 종료한다", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/workbook");
  const room = page.getByRole("region", { name: "취향을 하나씩, 나의 작업실.", exact: true });
  for (const reward of [
    { id: "print", title: "초록 잎 포스터" },
    { id: "laptop", title: "첫 노트북" },
    { id: "radio", title: "작은 라디오" },
    { id: "bonsai", title: "돌 위의 작은 나무" },
  ]) {
    await page.getByRole("button", { name: `${reward.title} 수집함 열기`, exact: true }).click();
    await room.getByRole("button", { name: `${reward.title} 받기`, exact: true }).click();
    await page
      .getByRole("dialog", { name: `${reward.title} 수집 완료`, exact: true })
      .getByRole("button", { name: "작업실에 놓기", exact: true })
      .click();
    const marker = room.locator("[data-room-highlight]");
    await expect(marker).toHaveAttribute("data-room-highlight", reward.id);
    await expect(marker).toContainText(`${reward.title} · 여기 놓았어요`);
    await expect(page.locator('[data-room-scene="home"] [data-room-highlight]')).toHaveCount(0);
    await page.screenshot({
      path: `/tmp/workbook-placement-${reward.id}-${testInfo.project.name}.png`,
    });
    if (reward.id === "bonsai") {
      await expect(marker).toHaveCount(0, { timeout: 6000 });
      await expect(room.getByRole("img", { name: /카피바라의 작업실/ })).toHaveAccessibleName(
        /돌 위의 작은 나무/,
      );
      await expect(room.getByRole("button", { name: "배치 저장", exact: true })).toBeEnabled();
    }
    await page.getByRole("button", { name: "작업실 닫기 ×", exact: true }).click();
  }
});

import { expect, test } from "@playwright/test";
import { createRoomWorkspace } from "../src/lib/workbook-room-catalog";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    (state) => {
      if (!localStorage.getItem("motivo.workbook.room.v1"))
        localStorage.setItem("motivo.workbook.room.v1", JSON.stringify(state));
    },
    {
      version: 1,
      workspace: createRoomWorkspace(),
      activity: "work",
      laptopAvailable: true,
      laptopOwned: true,
    },
  );
});

test("홈 작업실은 저장한 배치와 현재 행동을 보여주고 미저장 변경은 반영하지 않는다", async ({
  page,
}) => {
  await page.goto("/workbook");
  const home = page.locator('[data-room-scene="home"]');
  await expect(home).toHaveAccessibleName(/햇살 드는 나무 작업실.*작업하기.*첫 노트북/);
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  const room = page.getByRole("region", { name: "취향을 하나씩, 나의 작업실.", exact: true });
  await room.getByRole("combobox", { name: "방 테마", exact: true }).selectOption("city");
  await room.getByRole("combobox", { name: "창밖 풍경", exact: true }).selectOption("coast");
  await room
    .getByRole("complementary", { name: "작업실 수집함", exact: true })
    .getByRole("button", { name: /아이디어 노트/ })
    .click();
  await room.getByRole("button", { name: "책 읽기", exact: true }).click();
  await room.getByRole("button", { name: "배치 저장", exact: true }).click();
  await room.getByRole("combobox", { name: "창밖 풍경", exact: true }).selectOption("garden");
  await page.getByRole("button", { name: "작업실 닫기 ×", exact: true }).click();
  await expect(home).toHaveAccessibleName(
    /차분한 도시 작업실.*바다가 보이는 창.*책 읽기.*아이디어 노트/,
  );
  await expect(home).not.toHaveAccessibleName(/초록 정원의 창/);
  await expect
    .poll(() =>
      home
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  await room.getByRole("button", { name: "변경 취소", exact: true }).click();
  await expect(room.getByRole("combobox", { name: "창밖 풍경", exact: true })).toHaveValue("coast");
});

test("테마별 풍경과 배치를 유지하고 호환되지 않는 수집품을 제한한다", async ({ page }) => {
  await page.goto("/workbook");
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  const room = page.getByRole("region", { name: "취향을 하나씩, 나의 작업실.", exact: true });
  const scene = room.getByRole("img", { name: /카피바라의 작업실/ });
  await room.getByRole("combobox", { name: "창밖 풍경", exact: true }).selectOption("coast");
  await room.getByRole("button", { name: /바닥 한쪽/ }).click();
  await room
    .getByRole("complementary", { name: "작업실 수집함", exact: true })
    .getByRole("button", { name: /돌 위의 작은 나무/ })
    .click();
  await expect(scene).toHaveAccessibleName(/바다가 보이는 창.*돌 위의 작은 나무/);
  await room.getByRole("button", { name: "배치 저장", exact: true }).click();
  await room.getByRole("combobox", { name: "방 테마", exact: true }).selectOption("city");
  await expect(
    room
      .getByRole("complementary", { name: "작업실 수집함", exact: true })
      .getByRole("button", { name: /돌 위의 작은 나무/ }),
  ).toBeDisabled();
  await expect(scene).toHaveAccessibleName(/차분한 도시 작업실.*테마 기본 풍경.*작은 고무나무/);
  await expect
    .poll(async () =>
      room
        .locator('[data-room-set="desk-work-laptop"]')
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await room.getByRole("button", { name: /책상 한쪽/ }).click();
  await room
    .getByRole("complementary", { name: "작업실 수집함", exact: true })
    .getByRole("button", { name: /작은 라디오/ })
    .click();
  await room.getByRole("combobox", { name: "창밖 풍경", exact: true }).selectOption("garden");
  await room.getByRole("button", { name: "책 읽기", exact: true }).click();
  await expect(scene).toHaveAccessibleName(/초록 정원의 창.*작은 라디오/);
  await expect
    .poll(() =>
      room
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await room.getByRole("combobox", { name: "방 테마", exact: true }).selectOption("wood");
  await expect(scene).toHaveAccessibleName(/바다가 보이는 창.*돌 위의 작은 나무/);
  await expect(scene).not.toHaveAccessibleName(/작은 라디오/);
  await room.getByRole("button", { name: "변경 취소", exact: true }).click();
  await room.getByRole("combobox", { name: "방 테마", exact: true }).selectOption("city");
  await expect(scene).toHaveAccessibleName(/테마 기본 풍경/);
  await expect(scene).not.toHaveAccessibleName(/작은 라디오/);
});

test("수집품을 고정 자리에 교체·보관하고 저장과 취소를 한다", async ({ page }) => {
  await page.goto("/workbook");
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  const room = page.getByRole("region", { name: "취향을 하나씩, 나의 작업실.", exact: true });
  const scene = room.getByRole("img", { name: /카피바라의 작업실/ });
  await expect(room.locator('[data-room-set="desk-work-laptop"]')).toHaveCount(1);
  await expect(room.getByRole("button", { name: "배치 저장", exact: true })).toBeDisabled();
  await room
    .getByRole("complementary", { name: "작업실 수집함", exact: true })
    .getByRole("button", { name: /아이디어 노트/ })
    .click();
  await expect(room.locator('[data-room-set="desk-work-notebook"]')).toHaveCount(1);
  await expect(scene).toHaveAccessibleName(/아이디어 노트/);
  await expect(scene).not.toHaveAccessibleName(/첫 노트북/);
  await room.getByRole("button", { name: "배치 저장", exact: true }).click();
  await room.getByRole("button", { name: /비워두기/ }).click();
  await expect(scene).not.toHaveAccessibleName(/아이디어 노트/);
  await room.getByRole("button", { name: "변경 취소", exact: true }).click();
  await expect(scene).toHaveAccessibleName(/아이디어 노트/);
  await room.getByRole("button", { name: "책 읽기", exact: true }).click();
  await expect(room.locator('[data-room-set="desk-idle-notebook"]')).toHaveCount(1);
  await expect(room.locator('[data-room-set="lounge-read-cushion"]')).toHaveCount(1);
  await expect(scene).toHaveAccessibleName(/책 읽기/);
  await room.getByRole("button", { name: /휴식 공간/ }).click();
  await room.getByRole("button", { name: /비워두기/ }).click();
  await expect(room.locator('[data-room-set="lounge-read-plain"]')).toHaveCount(1);
  await expect
    .poll(async () =>
      room
        .locator('[data-room-set="lounge-read-plain"]')
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await room
    .getByRole("complementary", { name: "작업실 수집함", exact: true })
    .getByRole("button", { name: /오렌지 쿠션/ })
    .click();
  await expect(room.locator('[data-room-set="lounge-read-cushion"]')).toHaveCount(1);
  await room.getByRole("button", { name: /바닥 한쪽/ }).click();
  await room.getByRole("button", { name: /비워두기/ }).click();
  await room.getByRole("button", { name: "배치 저장", exact: true }).click();
  await page.getByRole("button", { name: "작업실 닫기 ×", exact: true }).click();
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  await expect(scene).toHaveAccessibleName(/아이디어 노트/);
  await expect(scene).not.toHaveAccessibleName(/작은 고무나무/);
  await room.getByRole("button", { name: "쉬어가기", exact: true }).click();
  await expect(scene).toHaveAccessibleName(/쉬어가기/);
});

test("보유 물품을 고르면 위치를 강조하고 같은 물건을 다시 골라도 표시 시간을 갱신한다", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/workbook");
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  const room = page.getByRole("region", { name: "취향을 하나씩, 나의 작업실.", exact: true });
  await room
    .getByRole("complementary", { name: "작업실 수집함", exact: true })
    .getByRole("button", { name: /아이디어 노트/ })
    .click();
  const marker = room.locator("[data-room-highlight]");
  await expect(marker).toHaveAttribute("data-room-highlight", "notebook");
  await expect(
    room.getByRole("region", { name: "작업실 배치 미리보기", exact: true }),
  ).toBeFocused();
  await page.clock.runFor(2500);
  await room
    .getByRole("complementary", { name: "작업실 수집함", exact: true })
    .getByRole("button", { name: /아이디어 노트/ })
    .click();
  await page.clock.runFor(1500);
  await expect(marker).toHaveAttribute("data-room-highlight", "notebook");
  await page.clock.runFor(2100);
  await expect(marker).toHaveCount(0);
  await room.getByRole("button", { name: /비워두기/ }).click();
  await expect(marker).toHaveCount(0);
  await room
    .getByRole("complementary", { name: "작업실 수집함", exact: true })
    .getByRole("button", { name: /아이디어 노트/ })
    .click();
  await expect(marker).toHaveCount(1);
  await room.getByRole("button", { name: "변경 취소", exact: true }).click();
  await expect(marker).toHaveCount(0);
  await expect(room.getByRole("img", { name: /카피바라의 작업실/ })).toHaveAccessibleName(
    /첫 노트북/,
  );
});

test("방의 물건을 누르면 해당 수집함과 획득 안내를 선택하고 배치는 바꾸지 않는다", async ({
  page,
}, testInfo) => {
  await page.goto("/workbook");
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  const room = page.getByRole("region", { name: "취향을 하나씩, 나의 작업실.", exact: true });
  const before = await page.evaluate(() => localStorage.getItem("motivo.workbook.room.v1"));
  for (const item of [
    { title: "첫 노트북", slot: "책상 도구 ●", text: "기획하고 첫 화면 만들기" },
    { title: "쉬어가는 머그", slot: "책상 한쪽 ●", text: "기본 제공 물품" },
    { title: "해 질 녘 액자", slot: "벽 ●", text: "기본 제공 물품" },
    { title: "작은 고무나무", slot: "바닥 한쪽 ●", text: "기본 제공 물품" },
    { title: "오렌지 쿠션", slot: "휴식 공간 ●", text: "기본 제공 물품" },
  ]) {
    await room.getByRole("button", { name: `${item.title} 수집함에서 보기`, exact: true }).click();
    const info = room.getByRole("region", { name: `${item.title} 수집 안내`, exact: true });
    await expect(info).toBeFocused();
    await expect(info).toContainText(item.text);
    await expect(room.getByRole("button", { name: item.slot, exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(room.getByRole("button", { name: "배치 저장", exact: true })).toBeDisabled();
  }
  expect(await page.evaluate(() => localStorage.getItem("motivo.workbook.room.v1"))).toBe(before);
  await page.screenshot({ path: `/tmp/workbook-object-info-${testInfo.project.name}.png` });
  await page.getByRole("button", { name: "작업실 닫기 ×", exact: true }).click();
  await expect(page.locator('[data-room-scene="home"] button')).toHaveCount(0);
});

test("방에서 키보드로 물건을 선택하고 비운 자리와 테마 변경도 반영한다", async ({ page }) => {
  await page.goto("/workbook");
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  const room = page.getByRole("region", { name: "취향을 하나씩, 나의 작업실.", exact: true });
  const collection = room.getByRole("complementary", { name: "작업실 수집함", exact: true });
  await collection.getByRole("button", { name: "벽 ●", exact: true }).click();
  await collection
    .getByRole("button", { name: "초록 잎 포스터 선택해서 놓기", exact: true })
    .click();
  await room
    .getByRole("button", { name: "초록 잎 포스터 수집함에서 보기", exact: true })
    .press("Enter");
  const info = room.getByRole("region", { name: "초록 잎 포스터 수집 안내", exact: true });
  await expect(info).toBeFocused();
  await expect(info).toContainText("문제 관찰 → 개선 요청");
  await expect(room.locator("[data-room-highlight]")).toHaveCount(0);
  await expect(room.getByRole("button", { name: "배치 저장", exact: true })).toBeEnabled();
  await collection.getByRole("button", { name: /비워두기/ }).click();
  await expect(
    room.getByRole("button", { name: "초록 잎 포스터 수집함에서 보기", exact: true }),
  ).toHaveCount(0);
  await room.getByRole("combobox", { name: "방 테마", exact: true }).selectOption("city");
  await expect(
    room.getByRole("button", { name: "해 질 녘 액자 수집함에서 보기", exact: true }),
  ).toBeVisible();
});

test("물건 안내의 방에서 보기로 위치를 다시 확인해도 배치와 저장은 유지한다", async ({
  page,
}, testInfo) => {
  await page.goto("/workbook");
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  const room = page.getByRole("region", { name: "취향을 하나씩, 나의 작업실.", exact: true });
  const before = await page.evaluate(() => localStorage.getItem("motivo.workbook.room.v1"));
  for (const title of ["쉬어가는 머그", "첫 노트북"]) {
    for (let repeat = 0; repeat < 2; repeat++) {
      await room.getByRole("button", { name: `${title} 수집함에서 보기`, exact: true }).click();
      const info = room.getByRole("region", { name: `${title} 수집 안내`, exact: true });
      await info.getByRole("button", { name: "방에서 보기", exact: true }).click();
      await expect(
        room.getByRole("region", { name: "작업실 배치 미리보기", exact: true }),
      ).toBeFocused();
      await expect(room.locator("[data-room-highlight]")).toHaveAttribute(
        "data-room-highlight",
        title === "쉬어가는 머그" ? "cup" : "laptop",
      );
      await expect(room.getByRole("button", { name: "배치 저장", exact: true })).toBeDisabled();
    }
  }
  expect(await page.evaluate(() => localStorage.getItem("motivo.workbook.room.v1"))).toBe(before);
  await page.screenshot({ path: `/tmp/workbook-show-in-room-${testInfo.project.name}.png` });
  const collection = room.getByRole("complementary", { name: "작업실 수집함", exact: true });
  await collection.getByRole("button", { name: /비워두기/ }).click();
  await expect(
    room
      .getByRole("region", { name: "첫 노트북 수집 안내", exact: true })
      .getByRole("button", { name: "방에서 보기", exact: true }),
  ).toHaveCount(0);
});

test("안내에서 보관해도 보유 상태는 유지되고 배치 취소와 저장을 할 수 있다", async ({ page }) => {
  await page.goto("/workbook");
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  const room = page.getByRole("region", { name: "취향을 하나씩, 나의 작업실.", exact: true });
  const collection = room.getByRole("complementary", { name: "작업실 수집함", exact: true });
  const before = await page.evaluate(() => localStorage.getItem("motivo.workbook.room.v1"));
  for (const title of ["쉬어가는 머그", "첫 노트북"]) {
    await room.getByRole("button", { name: `${title} 수집함에서 보기`, exact: true }).click();
    const info = room.getByRole("region", { name: `${title} 수집 안내`, exact: true });
    await info.getByRole("button", { name: "수집함에 보관", exact: true }).click();
    await expect(info).toBeFocused();
    await expect(
      room.getByRole("button", { name: `${title} 수집함에서 보기`, exact: true }),
    ).toHaveCount(0);
    await expect(
      collection.getByRole("button", { name: `${title} 선택해서 놓기`, exact: true }),
    ).toBeEnabled();
    expect(await page.evaluate(() => localStorage.getItem("motivo.workbook.room.v1"))).toBe(before);
    await room.getByRole("button", { name: "변경 취소", exact: true }).click();
    await expect(
      room.getByRole("button", { name: `${title} 수집함에서 보기`, exact: true }),
    ).toBeVisible();
  }
  await room.getByRole("button", { name: "첫 노트북 수집함에서 보기", exact: true }).click();
  await room
    .getByRole("region", { name: "첫 노트북 수집 안내", exact: true })
    .getByRole("button", { name: "수집함에 보관", exact: true })
    .click();
  await room.getByRole("button", { name: "배치 저장", exact: true }).click();
  await page.reload();
  await expect(page.locator('[data-room-scene="home"]')).not.toHaveAccessibleName(/첫 노트북/);
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  await expect(
    collection.getByRole("button", { name: "첫 노트북 선택해서 놓기", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("motivo.workbook.room.v1")!).laptopOwned,
    ),
  ).toBe(true);
});

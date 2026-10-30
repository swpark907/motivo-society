import { expect, test } from "@playwright/test";
import { initialRoomCollection } from "../src/lib/workbook-room-collection";

test("기본 수집품과 잠금을 구분하고 배치·행동을 새로고침 뒤 복원한다", async ({ page }) => {
  await page.goto("/workbook");
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  const room = page.getByRole("region", { name: "취향을 하나씩, 나의 작업실.", exact: true });
  await expect(room.getByRole("button", { name: /첫 노트북.*활동을 마치면 수집/ })).toBeDisabled();
  await room.getByRole("combobox", { name: "방 테마", exact: true }).selectOption("city");
  await room.getByRole("combobox", { name: "창밖 풍경", exact: true }).selectOption("coast");
  await room.getByRole("button", { name: "책 읽기", exact: true }).click();
  await room.getByRole("button", { name: "배치 저장", exact: true }).click();
  await page.reload();
  await expect(page.locator('[data-room-scene="home"]')).toHaveAccessibleName(
    /차분한 도시 작업실.*바다가 보이는 창.*책 읽기.*아이디어 노트/,
  );
});

test("도착한 노트북을 받고 직접 배치하며 수령 상태도 복원한다", async ({ page }) => {
  const value = { ...initialRoomCollection(), laptopAvailable: true };
  await page.addInitScript((state) => {
    if (!localStorage.getItem("motivo.workbook.room.v1"))
      localStorage.setItem("motivo.workbook.room.v1", JSON.stringify(state));
  }, value);
  await page.goto("/workbook");
  await expect(page.getByRole("complementary", { name: "수집품 도착 안내" })).toHaveCount(0);
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  const room = page.getByRole("region", { name: "취향을 하나씩, 나의 작업실.", exact: true });
  await room.getByRole("button", { name: "첫 노트북 받기", exact: true }).click();
  await page.getByRole("button", { name: "수집함에 보관", exact: true }).click();
  await room
    .getByRole("complementary", { name: "작업실 수집함", exact: true })
    .getByRole("button", { name: /첫 노트북/ })
    .click();
  await room.getByRole("button", { name: "배치 저장", exact: true }).click();
  await page.reload();
  await expect(page.locator('[data-room-scene="home"]')).toHaveAccessibleName(/첫 노트북/);
  await expect(page.getByText("첫 제작을 마쳤어요.", { exact: false })).toHaveCount(0);
});

test("단원별 조건을 읽고 도착한 수집품을 받아 배치한다", async ({ page }) => {
  await page.addInitScript(
    (state) => {
      if (!localStorage.getItem("motivo.workbook.room.v1"))
        localStorage.setItem("motivo.workbook.room.v1", JSON.stringify(state));
    },
    { ...initialRoomCollection(), available: ["print", "radio", "bonsai"] },
  );
  await page.goto("/workbook");
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  const room = page.getByRole("region", { name: "취향을 하나씩, 나의 작업실.", exact: true });
  for (const reward of [
    {
      slot: "벽 ●",
      title: "초록 잎 포스터",
      condition: "문제 관찰 → 개선 요청",
      meaning: "화면의 배치와 여백",
    },
    {
      slot: "책상 한쪽 ●",
      title: "작은 라디오",
      condition: "입력·버튼 반응과 저장 전후",
      meaning: "입력과 동작의 연결",
    },
    {
      slot: "바닥 한쪽 ●",
      title: "돌 위의 작은 나무",
      condition: "공개 전 점검 → 주소 확인",
      meaning: "작은 나무를 돌보는",
    },
  ]) {
    await room.getByRole("button", { name: reward.slot, exact: true }).click();
    await expect(room.getByText(reward.condition, { exact: false })).toBeVisible();
    await expect(room.getByText(reward.meaning, { exact: false })).toBeVisible();
    await room.getByRole("button", { name: `${reward.title} 받기`, exact: true }).click();
    await page.getByRole("button", { name: "수집함에 보관", exact: true }).click();
    await expect(
      room.getByRole("button", { name: `${reward.title} 받기`, exact: true }),
    ).toHaveCount(0);
    await room.getByRole("button", { name: new RegExp(`${reward.title} 선택해서 놓기`) }).click();
  }
  await room.getByRole("button", { name: "배치 저장", exact: true }).click();
  await page.reload();
  await expect(page.locator('[data-room-scene="home"]')).toHaveAccessibleName(
    /작은 라디오.*초록 잎 포스터.*돌 위의 작은 나무/,
  );
});

test("완료 전에도 획득 조건을 읽을 수 있고 새 수집품은 배치할 수 없다", async ({ page }) => {
  await page.goto("/workbook");
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  const room = page.getByRole("region", { name: "취향을 하나씩, 나의 작업실.", exact: true });
  await room.getByRole("button", { name: "벽 ●", exact: true }).click();
  await expect(room.getByText(/문제 관찰 → 개선 요청/)).toBeVisible();
  await expect(
    room.getByRole("button", { name: /초록 잎 포스터 활동을 마치면 수집/ }),
  ).toBeDisabled();
  await expect(room.getByRole("link", { name: "클래스에서 활동 살펴보기 →" })).toHaveAttribute(
    "href",
    "/workbook/classes/vibe-web",
  );
});

import { expect, test } from "@playwright/test";
import { initialRoomCollection } from "../src/lib/workbook-room-collection";

test("받을 물건이 없으면 홈 작업실의 수령 표시를 숨긴다", async ({ page }) => {
  await page.goto("/workbook");
  await expect(page.getByRole("group", { name: "받을 수 있는 수집품" })).toHaveCount(0);
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  await expect(page.getByRole("dialog", { name: "카피바라의 작업실", exact: true })).toBeVisible();
});

test("홈의 각 수집품 표시로 해당 자리를 바로 열고 수령하면 표시를 지운다", async ({
  page,
}, testInfo) => {
  await page.addInitScript(
    (state) => {
      if (!localStorage.getItem("motivo.workbook.room.v1"))
        localStorage.setItem("motivo.workbook.room.v1", JSON.stringify(state));
    },
    { ...initialRoomCollection(), laptopAvailable: true, available: ["print", "radio", "bonsai"] },
  );
  await page.goto("/workbook");
  const arrivals = page.getByRole("group", { name: "받을 수 있는 수집품" });
  await expect(arrivals).toContainText("4개");
  await arrivals.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `/tmp/workbook-room-arrivals-${testInfo.project.name}.png` });
  const radio = arrivals.getByRole("button", { name: "작은 라디오 수집함 열기", exact: true });
  await radio.press("Enter");
  const room = page.getByRole("region", { name: "취향을 하나씩, 나의 작업실.", exact: true });
  await expect(
    room.getByRole("region", { name: "작은 라디오 수집 안내", exact: true }),
  ).toBeFocused();
  await page.screenshot({ path: `/tmp/workbook-room-arrival-open-${testInfo.project.name}.png` });
  await page.getByRole("button", { name: "작업실 닫기 ×", exact: true }).click();
  await expect(radio).toBeFocused();
  // 공개 홈은 현행 작업실만 제공한다. 닫고 다시 열어도 바로가기는 올바른 자리를 연다.
  for (const [index, reward] of [
    { title: "작은 라디오", slot: "책상 한쪽 ●" },
    { title: "초록 잎 포스터", slot: "벽 ●" },
    { title: "돌 위의 작은 나무", slot: "바닥 한쪽 ●" },
    { title: "첫 노트북", slot: "책상 도구 ●" },
  ].entries()) {
    await arrivals
      .getByRole("button", { name: `${reward.title} 수집함 열기`, exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "카피바라의 작업실", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "작업실 시안 선택", exact: true }),
    ).toHaveCount(0);
    await expect(room.getByRole("button", { name: reward.slot, exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(
      room.getByRole("region", { name: `${reward.title} 수집 안내`, exact: true }),
    ).toBeFocused();
    await expect(
      room.getByRole("button", { name: `${reward.title} 받기`, exact: true }),
    ).toBeInViewport();
    await room.getByRole("button", { name: `${reward.title} 받기`, exact: true }).click();
    await page.getByRole("button", { name: "수집함에 보관", exact: true }).click();
    await page.getByRole("button", { name: "작업실 닫기 ×", exact: true }).click();
    await expect(page.getByRole("button", { name: /카피바라가 기다려요/ })).toBeFocused();
    await expect(arrivals.getByRole("button")).toHaveCount(3 - index);
  }
  await expect(arrivals).toHaveCount(0);
  await page.reload();
  await expect(arrivals).toHaveCount(0);
});

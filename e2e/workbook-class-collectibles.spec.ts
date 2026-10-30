import { expect, test } from "@playwright/test";
import { initialRoomCollection } from "../src/lib/workbook-room-collection";

test("클래스 소개에서 수집품과 획득 조건을 살펴보고 작업실로 이동한다", async ({
  page,
}, testInfo) => {
  await page.goto("/workbook/classes/vibe-web");
  await expect(page.getByRole("button", { name: "첫 노트북 크게 보기", exact: true })).toBeHidden();
  await page.getByText("작업실에 남는 물건 살펴보기", { exact: true }).click();
  const intro = page.getByRole("region", { name: "학습의 기록을 작업실에도 남겨요", exact: true });
  await expect(intro.getByRole("listitem")).toHaveCount(4);
  await expect(intro.getByRole("heading", { level: 3 })).toHaveText([
    "첫 노트북",
    "초록 잎 포스터",
    "작은 라디오",
    "돌 위의 작은 나무",
  ]);
  await expect(intro).toContainText(
    "컴퓨터로 ‘기획하고 첫 화면 만들기’ 단원을 완료해요. 예시 복습은 제외해요.",
  );
  await expect(intro).toContainText("문제 관찰 → 개선 요청 → PC·모바일 전후 비교");
  await expect(intro).toContainText("입력·버튼 반응과 저장 전후");
  await expect(intro).toContainText("공개 전 점검 → 주소 확인");
  await expect(intro).toContainText("기본 제공");
  await expect(intro).toContainText("회원 계정·다른 기기와 동기화하지 않아요");
  await expect
    .poll(() =>
      intro
        .locator("img")
        .evaluateAll((images) =>
          images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
        ),
    )
    .toBe(true);
  await intro.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `/tmp/workbook-class-collectibles-${testInfo.project.name}.png` });
  await intro.getByRole("link", { name: "내 작업실 살펴보기 →", exact: true }).click();
  await expect(page).toHaveURL(/\/workbook#workspace$/);
  await expect(page.getByRole("button", { name: /카피바라가 기다려요/ })).toBeVisible();
});

test("클래스 수집품을 확대해 조건을 읽고 닫으면 원래 카드로 돌아온다", async ({
  page,
}, testInfo) => {
  await page.goto("/workbook/classes/vibe-web");
  await page.getByText("작업실에 남는 물건 살펴보기", { exact: true }).click();
  const intro = page.getByRole("region", { name: "학습의 기록을 작업실에도 남겨요", exact: true });
  const before = await page.evaluate(() => localStorage.getItem("motivo.workbook.room.v1"));
  for (const item of [
    { title: "첫 노트북", condition: "예시 복습은 제외해요" },
    { title: "초록 잎 포스터", condition: "문제 관찰 → 개선 요청" },
    { title: "작은 라디오", condition: "입력·버튼 반응과 저장 전후" },
    { title: "돌 위의 작은 나무", condition: "공개 전 점검 → 주소 확인" },
  ]) {
    const trigger = intro.getByRole("button", { name: `${item.title} 크게 보기`, exact: true });
    await trigger.press("Enter");
    const detail = page.getByRole("dialog", { name: item.title, exact: true });
    await expect(
      detail.getByRole("img", { name: `${item.title} 확대 이미지`, exact: true }),
    ).toBeVisible();
    await expect(detail).toContainText("아직 수집 전");
    await expect(detail).toContainText(item.condition);
    if (item.title === "첫 노트북") {
      await expect
        .poll(() =>
          detail
            .locator("img")
            .evaluateAll((images) =>
              images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
            ),
        )
        .toBe(true);
      await page.screenshot({
        path: `/tmp/workbook-class-item-detail-${testInfo.project.name}.png`,
      });
    }
    await detail.press("Escape");
    await expect(detail).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
  expect(await page.evaluate(() => localStorage.getItem("motivo.workbook.room.v1"))).toBe(before);
  await intro.getByRole("button", { name: "첫 노트북 크게 보기", exact: true }).click();
  await page.mouse.click(4, 4);
  await expect(page.getByRole("dialog", { name: "첫 노트북", exact: true })).toHaveCount(0);
});

test("확대 화면에서 보유·수령 가능 상태를 구분하고 작업실로 이동해도 자동 수령하지 않는다", async ({
  page,
}, testInfo) => {
  await page.addInitScript(
    (state) => {
      if (!localStorage.getItem("motivo.workbook.room.v1"))
        localStorage.setItem("motivo.workbook.room.v1", JSON.stringify(state));
    },
    {
      ...initialRoomCollection(),
      laptopAvailable: true,
      laptopOwned: true,
      available: ["radio", "print"],
      owned: ["radio"],
    },
  );
  await page.goto("/workbook/classes/vibe-web");
  await page.getByText("작업실에 남는 물건 살펴보기", { exact: true }).click();
  const intro = page.getByRole("region", { name: "학습의 기록을 작업실에도 남겨요", exact: true });
  for (const title of ["첫 노트북", "작은 라디오"]) {
    await intro.getByRole("button", { name: `${title} 크게 보기`, exact: true }).click();
    const detail = page.getByRole("dialog", { name: title, exact: true });
    await expect(detail).toContainText("보유 중");
    await expect(detail).toContainText("이 브라우저의 수집함에 보유하고 있어요");
    await detail.getByRole("button", { name: "수집품 확대 닫기", exact: true }).click();
  }
  await intro.getByRole("button", { name: "초록 잎 포스터 크게 보기", exact: true }).click();
  const detail = page.getByRole("dialog", { name: "초록 잎 포스터", exact: true });
  await expect(detail).toContainText("받을 수 있어요");
  await detail.getByRole("link", { name: "수집함에서 받기 →", exact: true }).click();
  await expect(page).toHaveURL(/\/workbook#workspace-collectible-print$/);
  const collection = page.getByRole("dialog", { name: "카피바라의 작업실", exact: true });
  const item = collection.getByRole("region", { name: "초록 잎 포스터 수집 안내", exact: true });
  await expect(item).toBeFocused();
  await expect(
    item.getByRole("button", { name: "초록 잎 포스터 받기", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("motivo.workbook.room.v1")!).owned),
  ).not.toContain("print");
  await page.screenshot({
    path: `/tmp/workbook-collectible-linked-inventory-${testInfo.project.name}.png`,
  });
});

test("수집 전 물건의 활동으로 이동하면 해당 단원의 선행 조건을 확인한다", async ({
  page,
}, testInfo) => {
  for (const [item, unit, condition] of [
    ["첫 노트북", "기획하고 첫 화면 만들기", "AI 도구 준비하기의 다섯 수업을 마치면 열려요"],
    ["초록 잎 포스터", "반응형 화면 만들기", "기획하고 첫 화면 만들기를 마치면 열려요"],
    ["작은 라디오", "기능과 데이터 저장", "반응형 화면 만들기까지 마치면 열려요"],
    ["돌 위의 작은 나무", "배포하고 고치기", "기능과 데이터 저장까지 마치면 열려요"],
  ]) {
    await page.goto("/workbook/classes/vibe-web");
    await page.getByText("작업실에 남는 물건 살펴보기", { exact: true }).click();
    await page.getByRole("button", { name: `${item} 크게 보기`, exact: true }).click();
    await page.getByRole("button", { name: "이 활동 하러 가기 →", exact: true }).click();
    const journey = page.getByRole("dialog", {
      name: "배우고, 내 웹페이지를 만드는 다섯 과정",
      exact: true,
    });
    await expect(journey).toBeVisible();
    const target = journey.getByRole("region", { name: new RegExp(`단원 ${unit}$`) });
    await expect(target.getByRole("heading", { name: unit, exact: true })).toBeVisible();
    await expect(target).toContainText(condition);
    await expect(
      target.getByRole("button", { name: `${unit} 지도로`, exact: true }),
    ).toBeDisabled();
    await expect(target.getByRole("button")).toHaveCount(1);
    if (item === "첫 노트북")
      await page.screenshot({ path: `/tmp/workbook-prerequisite-${testInfo.project.name}.png` });
    await journey.getByRole("button", { name: "AI 도구 준비하기 지도로", exact: true }).click();
    await expect(journey).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "AI 도구 준비하기", exact: true, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "학습 중 수집 목표", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "수집 목표 정하기", exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByLabel("단원 완료 기념", { exact: true })).toHaveCount(0);
    if (item === "첫 노트북")
      await page.screenshot({ path: `/tmp/workbook-learning-goal-${testInfo.project.name}.png` });
    if (item === "첫 노트북")
      await page.screenshot({
        path: `/tmp/workbook-collectible-activity-${testInfo.project.name}.png`,
      });
  }
});

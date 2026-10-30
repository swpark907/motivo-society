import { expect, test } from "@playwright/test";
// 목적별 분기는 제거됐다. 기본 수업 흐름은 first-visit 및 단원별 system 스펙에서 검증한다.
test("홈에서 마을을 탐험하고 반응형 실험과 발견 기록을 완료한다", async ({ page }) => {
  await page.goto("/workbook");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("만들고 싶었던 것");
  await page.getByRole("link", { name: /휴대폰에서는 왜 잘릴까/ }).click();
  await expect(
    page.getByRole("button", { name: "마을 광장 · 앞 장소를 마치면 열려요", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "친구의 답장 보기" }).click();
  await page.getByRole("button", { name: "이야기 확인하기" }).click();
  await page.getByRole("button", { name: /정류장으로 걸어가기/ }).click();
  await expect(
    page.getByRole("heading", { name: "휴대폰에서 생긴 문제", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "현재 화면 확인하기" }).click();
  await expect(page.getByRole("status")).toContainText("560px로 고정");
  await page.getByRole("button", { name: "화면에 맞추기", exact: true }).click();
  await page.getByRole("button", { name: "좁을 때 세로", exact: true }).click();
  await page.getByRole("button", { name: "현재 화면 확인하기" }).click();
  await expect(page.getByRole("status")).toContainText("휴대폰에서 제목과 버튼이 모두");
  await page.getByRole("button", { name: "넓은 화면 560px" }).click();
  await page.getByRole("button", { name: "현재 화면 확인하기" }).click();
  await page.getByRole("button", { name: "실험 마치기", exact: true }).click();
  await page.getByRole("button", { name: /광장으로 걸어가기/ }).click();
  await expect(page.getByRole("button", { name: "예제 여정 완료하기" })).toBeDisabled();
  await page
    .getByRole("button", { name: "긴 제목을 넣고 좁은 화면과 넓은 화면을 다시 확인해요." })
    .click();
  await page.getByLabel(/오늘 발견한 것 한 줄/).fill("작은 화면과 큰 화면을 함께 확인하기");
  await page.getByRole("button", { name: "예제 여정 완료하기" }).click();
  await page.getByRole("checkbox").check();
  await page.reload();
  await expect(page.getByLabel(/오늘 발견한 것 한 줄/)).toHaveValue(
    "작은 화면과 큰 화면을 함께 확인하기",
  );
  await expect(page.getByRole("checkbox")).toBeChecked();
  await page.getByRole("link", { name: /내 발견을 가지고 홈으로/ }).click();
  await expect(
    page.getByText("작은 화면과 큰 화면을 함께 확인하기", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /여정 이어가기/ })).toBeVisible();
});

test("잘못된 기록에서도 시작할 수 있고 초기화는 확인을 받는다", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("motivo.workbook.mobile-journey.v1", "invalid"),
  );
  await page.goto("/workbook/journey");
  await expect(
    page.getByRole("heading", { name: "친구에게 보낸 첫 페이지", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "여정 초기화", exact: true }).click();
  await page.getByRole("button", { name: "취소", exact: true }).click();
  await expect(page.getByRole("button", { name: "기록 지우기" })).toHaveCount(0);
  await page.getByRole("button", { name: "여정 초기화", exact: true }).click();
  await page.getByRole("button", { name: "기록 지우기", exact: true }).click();
  await expect(page.getByText("0 / 3 장소 탐험", { exact: true })).toBeVisible();
});

test("저장이 막혀도 키보드로 이야기를 이어갈 수 있다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
  });
  await page.goto("/workbook/journey");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("저장이 막혀");
  await page.getByRole("button", { name: "친구의 답장 보기" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "이야기 확인하기" }).click();
  await page.getByRole("button", { name: /정류장으로 걸어가기/ }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "휴대폰에서 생긴 문제", exact: true }),
  ).toBeFocused();
});

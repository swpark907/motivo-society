import { expect, test } from "@playwright/test";

test("홈에서 마을을 탐험하고 반응형 실험과 발견 기록을 완료한다", async ({ page }) => {
  await page.goto("/workbook");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("작은 시도부터");
  await page.getByRole("link", { name: /기존 모바일 실험 보기/ }).click();
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

test("카피바라 맵에서 배우고 같은 장소로 돌아와 다음 수업으로 걷는다", async ({ page }) => {
  await page.goto("/workbook/classes/vibe-web");
  await page.getByRole("button", { name: "메뉴 접기" }).click();
  await expect(page.getByRole("navigation", { name: "Workbook 메뉴" })).toBeHidden();
  await page.getByRole("button", { name: "메뉴 펼치기" }).click();
  await expect(page.getByRole("navigation", { name: "Workbook 메뉴" })).toBeVisible();
  await page.getByRole("button", { name: "프로토타입 체험하기 ↗" }).click();
  await expect(page.getByRole("button", { name: "메뉴 펼치기" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(
    page.getByRole("button", { name: "AI 종류와 도구 · 첫 수업 후 열려요" }),
  ).toBeDisabled();
  await expect(page.getByText(/다음 목표 · 01 AI 이해하기/)).toBeVisible();
  await page.getByRole("button", { name: "경로 움직임 멈추기" }).click();
  await expect(page.getByRole("button", { name: "경로 움직임 켜기" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "AI 이해하기 장소로 이동" }).click();
  await expect(page.getByText("첫 만남의 찻집 · 이동 중…", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "AI 이해하기 수업 시작" })).toBeInViewport();
  await page.getByRole("button", { name: "AI 이해하기 수업 시작" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("AI 이해하기");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(
    page.getByText("이 클래스에서는 생성형 AI를 사용해요.", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await expect(
    page.getByText("이 클래스에서는 생성형 AI를 사용해요.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/AI는 인공지능을 뜻해요/)).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "수업 진행" })).toBeInViewport();
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await expect(page.getByRole("button", { name: "다음으로", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "예시 결과 보기" }).click();
  await page.getByRole("button", { name: "차·호흡·돌 쌓는 웹 경험" }).click();
  await expect(page.getByRole("status")).toContainText("새로 덧붙인 실적");
  await expect(page.getByRole("status")).not.toContainText("오답");
  await expect(page.getByRole("button", { name: "차·호흡·돌 쌓는 웹 경험" })).toContainText("오답");
  await page.getByRole("button", { name: "이미 1만 명이 선택했다는 내용" }).click();
  await expect(page.getByRole("button", { name: "이미 1만 명이 선택했다는 내용" })).toContainText(
    "정답",
  );
  await expect(page.getByRole("button", { name: "차·호흡·돌 쌓는 웹 경험" })).not.toContainText(
    "오답",
  );
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await page.getByRole("button", { name: "배운 내용 챙겨 마을로 →" }).click();
  await expect(page.getByRole("button", { name: "AI 이해하기 수업 시작" })).toBeEnabled();
  await expect(page.getByText(/다음 목표 · 02 AI 종류와 도구/)).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "AI 종류와 도구 장소로 이동" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "AI 종류와 도구 수업 시작" }).click();
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await page.getByRole("button", { name: "표지 그림", exact: true }).click();
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await page.getByRole("button", { name: "모델 살펴보기" }).click();
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await page.getByRole("button", { name: "다음으로", exact: true }).click();
  await expect(page.getByRole("button", { name: "배운 내용 챙겨 마을로 →" })).toBeDisabled();
  await page.getByRole("button", { name: "이미지를 생성하고 저장하는 기능" }).click();
  await page.getByRole("button", { name: "그럴 수 있어요" }).click();
  await page.getByRole("button", { name: "배운 내용 챙겨 마을로 →" }).click();
  await expect(page.getByText("이번 방문에서 확인 완료", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "도구 준비하기 · 준비 중" })).toBeDisabled();
  await page.getByRole("button", { name: "AI 이해하기 장소로 이동" }).click();
  await page.getByRole("button", { name: "AI 이해하기 수업 시작" }).click();
  await page.getByRole("button", { name: "마을 지도로" }).click();
  await expect(page.getByRole("button", { name: "AI 이해하기 수업 시작" })).toBeEnabled();
});

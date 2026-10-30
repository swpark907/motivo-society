import { expect, test } from "@playwright/test";

test("수집품을 자리 사이에 옮기고 취소·저장·보관해도 수집함에는 남는다", async ({ page }) => {
  await page.goto("/demo/workbook-home-next");
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  await page.getByRole("button", { name: "수집·배치 구조", exact: true }).click();
  await page.getByRole("button", { name: "공간 꾸미기 ↗", exact: true }).click();
  const tools = page.getByRole("complementary", { name: "배치 도구" });
  await tools.getByRole("button", { name: "책상 오른쪽", exact: true }).click();
  await tools.getByRole("button", { name: /공방의 기획 노트/ }).click();
  await tools.getByRole("button", { name: "취소", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "책상 왼쪽: 공방의 기획 노트", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "책상 오른쪽: 늘 쓰던 머그", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "공간 꾸미기 ↗", exact: true }).click();
  await tools.getByRole("button", { name: "책상 오른쪽", exact: true }).click();
  await tools.getByRole("button", { name: /공방의 기획 노트/ }).click();
  await tools.getByRole("button", { name: "배치 저장", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "책상 왼쪽: 비어 있음", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "책상 오른쪽: 공방의 기획 노트", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "수집함", exact: true }).click();
  await page.getByRole("button", { name: "전시 중 공방의 기획 노트", exact: true }).click();
  await page.getByRole("button", { name: "공간에서 빼고 보관하기", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "보관 중 공방의 기획 노트", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "미획득 · 조건 보기 작은 오픈 간판", exact: true })
    .click();
  const detail = page.getByRole("complementary", { name: "수집품 상세" });
  await expect(detail).toContainText("공개 전 점검·주소·다른 환경 확인의 학습 정리");
  await expect(detail.getByRole("button", { name: "이 물건 놓으러 가기 →" })).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  await page.getByRole("button", { name: "수집·배치 구조", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "책상 왼쪽: 공방의 기획 노트", exact: true }),
  ).toBeVisible();
});

test("단원별 조건과 연결 기록을 확인하고 호환 자리만 꾸민다", async ({ page }) => {
  await page.goto("/demo/workbook-home-next");
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  await page.getByRole("button", { name: "수집·배치 구조", exact: true }).click();
  await page.getByRole("button", { name: "단원별 수집품", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "기능과 데이터 저장", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "배포하고 고치기", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "수집함", exact: true }).click();
  await page.getByRole("button", { name: "보관 중 화면을 재는 자", exact: true }).click();
  const detail = page.getByRole("complementary", { name: "수집품 상세" });
  await detail.getByText("연결된 기록 미리보기 · 예시", { exact: true }).click();
  await expect(detail).toContainText("모바일에서 소개글이 너무 길어 보여");
  await detail.getByRole("button", { name: "이 물건 놓으러 가기 →", exact: true }).click();
  const tools = page.getByRole("complementary", { name: "배치 도구" });
  await tools.getByRole("button", { name: "벽", exact: true }).click();
  await expect(tools).toContainText("아직 이 자리에 놓을 수 있는 수집품이 없어요");
  await expect(tools.getByRole("button", { name: /화면을 재는 자/ })).toHaveCount(0);
  await tools.getByRole("button", { name: "취소", exact: true }).click();
});

test("기존 홈 콘텐츠를 유지하고 작업실을 닫으면 진입 카드로 돌아온다", async ({ page }) => {
  await page.goto("/demo/workbook-home-next");
  await expect(
    page.getByRole("heading", { name: "만들면서 익히는 클래스", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#reading").getByRole("link")).toHaveCount(6);
  const launcher = page.getByRole("button", { name: /카피바라가 기다려요/ });
  await launcher.click();
  await page.getByRole("button", { name: "수집·배치 구조", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "카피바라의 작업실", exact: true });
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "수집함", exact: true }).click();
  await page.getByRole("button", { name: "작업실 닫기 ×", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(launcher).toBeFocused();
  await launcher.click();
  await expect(page.getByRole("button", { name: "수집함", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(launcher).toBeFocused();
});

test("새 작업실 원화와 생활 영역을 살펴보고 구조 실험과 구분한다", async ({ page }) => {
  await page.goto("/demo/workbook-home-next");
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  const dialog = page.getByRole("dialog", { name: "카피바라의 작업실", exact: true });
  await dialog.getByRole("button", { name: "새 공간 시안", exact: true }).click();
  await expect(dialog.getByRole("img", { name: /나무 바닥과 두 벽/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "새 공간 시안", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await dialog.getByRole("button", { name: /02 \/ REST/ }).click();
  await expect(dialog.getByRole("heading", { name: "쉬어가는 자리", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "그림 크게 보기", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "전체 보기", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await dialog.getByRole("button", { name: "작업실 닫기 ×", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});

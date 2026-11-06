import { expect, test } from "@playwright/test";
import { reseedSandbox, signInAs, signUpByMail, testEmail, testNickname } from "./platform-helpers";

// 시험 데이터를 바꾸는 플랫폼 흐름은 모두 이 파일에서 순서대로 돈다.
// 다른 파일과 나뉘어 있으면 병렬 실행 중 한쪽의 "처음 상태로"가 다른 쪽의 사람·신청을 지운다.
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ request }, info) => {
  test.skip(info.project.name !== "desktop", "DB를 바꾸는 흐름은 한 화면 크기에서만");
  await reseedSandbox(request);
});

test.describe("시험장", () => {
  // 사람을 바꿔 오늘 모각코의 마지막 자리에 신청하면 확정되고 화상 링크가 열린다.
  test("시험장에서 사람을 바꿔 남은 자리에 신청한다", async ({ page }) => {
    await page.goto("/demo/platform/activities/00000000-0000-4000-c000-000000000001");
    await page.getByRole("button", { name: /처음온사람/ }).click();
    await expect(page.getByRole("button", { name: "신청하기" })).toBeVisible();
    await page.getByRole("button", { name: "신청하기" }).click();
    await expect(page.getByText("참가가 확정됐어요.")).toBeVisible();
    await expect(page.getByText("https://meet.example.test/tonight-mogakco")).toBeVisible();
  });
});

// L06 신청 흐름: 확인 단계 → 확정 / 대기 / 입금 대기 → (운영진 입금 확인) → 확정.
test.describe("신청 흐름", () => {
  test("무료 모임: 마지막 자리는 확정, 다음 사람은 대기, 취소하면 대기자가 확정된다", async ({
    browser,
  }) => {
    const guest = await (await browser.newContext()).newPage();
    await signInAs(guest, "처음온사람", "/activities/tonight-mogakco");
    await guest
      .getByRole("complementary", { name: "신청" })
      .getByRole("link", { name: "신청하기" })
      .click();
    await expect(guest).toHaveURL(/\/activities\/tonight-mogakco\/apply$/);
    await expect(guest.getByRole("heading", { name: "이렇게 신청할게요" })).toBeVisible();
    await expect(guest.getByText("신청하면 바로 참가가 확정돼요.")).toBeVisible();
    await guest.getByRole("button", { name: "신청하기" }).click();
    await expect(guest.getByRole("heading", { name: "참가가 확정됐어요" })).toBeVisible();

    const member = await (await browser.newContext()).newPage();
    await signInAs(member, "멤버하나", "/activities/tonight-mogakco/apply");
    await expect(member.getByText(/정원이 찼어요/)).toBeVisible();
    await member.getByRole("button", { name: "대기 신청" }).click();
    await expect(member.getByRole("heading", { name: "대기 신청했어요" })).toBeVisible();
    await expect(member.getByText("지금 대기 1명")).toBeVisible();

    await guest.reload();
    await guest.getByText("신청 취소").click();
    await guest.getByRole("button", { name: "정말 취소할게요" }).click();
    await expect(guest).toHaveURL(/\/activities\/tonight-mogakco\?notice=cancelled$/);
    await expect(guest.getByText("신청을 취소했어요.")).toBeVisible();

    await member.reload();
    await expect(member.getByRole("heading", { name: "참가가 확정됐어요" })).toBeVisible();
  });

  test("유료 모임: 규정 확인 → 입금 안내 → 운영진 입금 확인 → 확정", async ({ browser }) => {
    const guest = await (await browser.newContext()).newPage();
    await signInAs(guest, "처음온사람", "/activities/prompt-clinic/apply");
    const submit = guest.getByRole("button", { name: "20,000원 · 신청하기" });
    await expect(submit).toBeDisabled();
    await guest.getByLabel("입금자명").fill("김처음");
    await guest.getByText("취소·환불 규정을 확인했어요").click();
    await submit.click();

    await expect(guest.getByRole("heading", { name: "입금하면 확정돼요" })).toBeVisible();
    await expect(guest.getByText("20,000원")).toBeVisible();
    await expect(guest.getByText("김처음")).toBeVisible();
    await expect(guest.getByText(/시간 \d+분 남았어요|시간 남았어요/)).toBeVisible();
    await expect(guest.getByRole("button", { name: "계좌번호 복사" })).toBeVisible();

    // 상세 화면도 입금 안내로 이어진다
    await guest.goto("/activities/prompt-clinic");
    await expect(
      guest
        .getByRole("complementary", { name: "신청" })
        .getByRole("link", { name: "입금 안내 보기" }),
    ).toBeVisible();

    const owner = await (await browser.newContext()).newPage();
    await signInAs(owner, "모쏘운영", "/demo/platform/ops");
    const row = owner.getByRole("row", { name: /김처음/ });
    await row.getByRole("button", { name: "입금 확인" }).click();
    await expect(owner.getByRole("row", { name: /김처음/ })).toHaveCount(0);

    await guest.goto("/activities/prompt-clinic/apply");
    await expect(guest.getByRole("heading", { name: "참가가 확정됐어요" })).toBeVisible();
    // 결제가 끝나면 취소 대신 환불(L10)
    await expect(guest.getByText("신청 취소")).toHaveCount(0);
  });

  test("유료 신청은 입금 전에 취소할 수 있다", async ({ page }) => {
    await signInAs(page, "처음온사람", "/activities/ai-tools-workshop/apply");
    await page.getByText("취소·환불 규정을 확인했어요").click();
    await page.getByRole("button", { name: /15,000원 · 신청하기/ }).click();
    await expect(page.getByRole("heading", { name: "입금하면 확정돼요" })).toBeVisible();
    await page.getByText("입금 전 취소").click();
    await page.getByRole("button", { name: "정말 취소할게요" }).click();
    await expect(page.getByText("신청을 취소했어요.")).toBeVisible();
  });

  test("비로그인: 신청 → 로그인 → 온보딩 → 같은 활동의 신청 확인으로 돌아온다", async ({
    page,
    request,
  }) => {
    await page.goto("/activities/capybara-cafe");
    await page
      .getByRole("complementary", { name: "신청" })
      .getByRole("link", { name: "로그인하고 신청" })
      .click();
    await expect(page).toHaveURL(/\/login\?next=%2Factivities%2Fcapybara-cafe%2Fapply$/);
    await signUpByMail(
      page,
      request,
      testEmail("apply"),
      page.url().replace(/^https?:\/\/[^/]+/, ""),
    );
    await expect(page).toHaveURL(/\/onboarding\?next=%2Factivities%2Fcapybara-cafe%2Fapply$/);
    await page.getByLabel("닉네임").fill(testNickname());
    await expect(page.getByText("쓸 수 있는 닉네임이에요.")).toBeVisible();
    await page.getByText("AI 도구", { exact: true }).click();
    await page.getByRole("button", { name: "시작하기" }).click();
    await expect(page).toHaveURL(/\/activities\/capybara-cafe\/apply$/);
    await page.getByRole("button", { name: "신청하기" }).click();
    await expect(page.getByRole("heading", { name: "참가가 확정됐어요" })).toBeVisible();
  });

  test("클럽 밖 사람이 멤버 전용 신청 주소로 와도 신청할 수 없다", async ({ page }) => {
    await signInAs(page, "처음온사람", "/activities/members-retro/apply");
    await expect(page.getByRole("heading", { name: "클럽 멤버 전용" })).toBeVisible();
    await expect(page.getByRole("button", { name: /신청/ })).toHaveCount(0);
  });
});

// L07 회원 홈: 오늘 → 내 사람들 → 발견. 처음 온 회원은 발견 먼저.
test.describe("회원 홈", () => {
  test("처음 온 회원은 빈 칸 대신 지금 함께할 수 있는 것과 쓰는 법을 본다", async ({
    page,
    request,
  }) => {
    await signUpByMail(page, request, testEmail("home"), "/login");
    await expect(page).toHaveURL(/\/onboarding$/);
    const nickname = testNickname();
    await page.getByLabel("닉네임").fill(nickname);
    await expect(page.getByText("쓸 수 있는 닉네임이에요.")).toBeVisible();
    await page.getByText("바이브코딩", { exact: true }).click();
    await page.getByRole("button", { name: "시작하기" }).click();
    await expect(page).toHaveURL(/\/$/);

    await expect(page.getByRole("heading", { level: 1 })).toContainText(`${nickname}님`);
    const sections = page.locator("main section h2");
    await expect(sections).toHaveText(["지금 함께할 수 있는 것", "모쏘는 이렇게 써요"]);
    await expect(page.getByRole("heading", { name: "다음 일정" })).toHaveCount(0);
  });

  test("일정·클럽·챌린지가 있는 회원: 다음 일정 → 오늘 할 일 → 내 사람들 → 새로 열린 것", async ({
    page,
  }) => {
    await signInAs(page, "멤버하나", "/");
    const sections = page.locator("main section h2");
    await expect(sections).toHaveText(["다음 일정", "오늘 할 일", "내 사람들", "새로 열린 것"]);

    const next = page.getByRole("region", { name: "다음 일정" });
    await expect(next.getByRole("heading", { name: "카피바라 카페에서 AI 수다" })).toBeVisible();
    await next.getByRole("link", { name: "참가 정보 보기" }).click();
    await expect(page).toHaveURL(/\/activities\/capybara-cafe$/);
    await page.goBack();

    // 챌린지 참가자: 오늘 인증 전이면 할 일에 보인다
    await expect(page.getByText("오늘 인증이 아직이에요")).toBeVisible();
    await expect(page.getByText(/2주 매일 하나씩 만들기 · 완주까지 \d+번/)).toBeVisible();
    // 내 사람들: 내 클럽과 같이 챌린지하는 사람의 인증
    const people = page.getByRole("region", { name: "내 사람들" });
    await expect(people.getByText("주말 바이브코딩 클럽")).toBeVisible();
    await expect(people.getByRole("list", { name: "같이 챌린지하는 사람들의 인증" })).toBeVisible();
    // 이미 신청한 활동은 새로 열린 것에 다시 나오지 않는다
    await expect(
      page.getByRole("region", { name: "새로 열린 것" }).getByText("카피바라 카페에서 AI 수다"),
    ).toHaveCount(0);
  });

  test("입금 대기 중인 회원은 오늘 할 일에서 입금 안내로 간다", async ({ page }) => {
    await signInAs(page, "처음온사람", "/activities/prompt-clinic/apply");
    await page.getByText("취소·환불 규정을 확인했어요").click();
    await page.getByRole("button", { name: /20,000원 · 신청하기/ }).click();
    await expect(page.getByRole("heading", { name: "입금하면 확정돼요" })).toBeVisible();

    await page.goto("/");
    const todo = page.getByRole("link", { name: /입금을 기다리고 있어요/ });
    await expect(todo).toContainText("20,000원");
    await todo.click();
    await expect(page).toHaveURL(/\/activities\/prompt-clinic\/apply$/);
  });
});

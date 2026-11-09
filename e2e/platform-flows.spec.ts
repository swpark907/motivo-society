import { expect, test } from "@playwright/test";
import {
  magicLinkFor,
  reseedSandbox,
  sandboxInsert,
  signInAs,
  signUpByMail,
  testEmail,
  testNickname,
} from "./platform-helpers";

// 시험 데이터를 바꾸는 플랫폼 흐름은 모두 이 파일에서 순서대로 돈다.
// 다른 파일과 나뉘어 있으면 병렬 실행 중 한쪽의 "처음 상태로"가 다른 쪽의 사람·신청을 지운다.
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ request }, info) => {
  test.skip(info.project.name !== "desktop", "DB를 바꾸는 흐름은 한 화면 크기에서만");
  await reseedSandbox(request);
});

// 여러 사람을 띄우려고 테스트가 직접 만든 창은 끝나면 닫는다.
// 열어 둔 채 다음 테스트로 넘어가면 개발 서버가 느려져 다음 로그인이 30초를 넘기곤 했다(L13).
test.afterEach(async ({ browser, context }) => {
  await Promise.all(
    browser
      .contexts()
      .filter((c) => c !== context)
      .map((c) => c.close()),
  );
});

// 로그인·가입하는 여정도 여기서 돈다. 다른 파일에 있으면 "처음 상태로"가 막 만든 세션·프로필을 지운다.
test.describe("로그인과 가입", () => {
  test("로그인이 필요한 화면 → 메일 링크 → 원래 화면으로 돌아온다", async ({
    page,
    request,
  }, info) => {
    const email = `e2e-${info.project.name}-${Date.now()}@example.test`;

    await page.goto("/me");
    await expect(page).toHaveURL(/\/login\?next=%2Fme$/);
    await expect(page.getByRole("heading", { level: 1, name: "모쏘에 들어가기" })).toBeVisible();

    await page.getByLabel("이메일").fill(email);
    await page.getByRole("button", { name: "로그인 링크 받기" }).click();
    await expect(page.getByRole("heading", { name: "메일을 보냈어요" })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByRole("button", { name: /다시 보내기 \(\d+초\)/ })).toBeDisabled();

    await page.goto(await magicLinkFor(request, email));
    // 처음 온 사람은 온보딩을 거쳐 원래 화면으로 간다(L03).
    await expect(page).toHaveURL(/\/onboarding\?next=%2Fme$/);
    const nickname = testNickname();
    await page.getByLabel("닉네임").fill(nickname);
    await expect(page.getByText("쓸 수 있는 닉네임이에요.")).toBeVisible();
    await page.getByText("AI 도구", { exact: true }).click();
    await page.getByRole("button", { name: "시작하기" }).click();
    await expect(page).toHaveURL(/\/me$/);
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByRole("main").getByText(nickname, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/me");
    await expect(page).toHaveURL(/\/login/);
  });

  test("개발 환경에서는 시험장 사람으로 바로 들어가고, 상단에 계정이 보인다", async ({ page }) => {
    await page.goto("/login?next=%2Fclubs");
    await page.waitForLoadState("networkidle");
    await page.getByText("개발용 · 시험장 사람으로 들어가기").click();
    await page.getByRole("button", { name: /멤버하나/ }).click();
    await expect(page).toHaveURL(/\/clubs$/);
    await expect(page.getByRole("link", { name: "멤버하나 · 나" })).toBeVisible();
  });
  test("확정된 참가자는 참가 확정과 상세 주소를 본다", async ({ page }) => {
    await signInAs(page, "멤버하나", "/activities/capybara-cafe");
    await expect(
      page.getByRole("complementary", { name: "신청" }).getByRole("link", { name: /참가 확정/ }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "참가 정보" })).toBeVisible();
    await expect(page.getByText(/가짜 주소/)).toBeVisible();
  });

  test("클럽 밖 사람에게 멤버 전용 모임은 멤버 전용이라고 알린다", async ({ page }) => {
    await signInAs(page, "처음온사람", "/activities/members-retro");
    await expect(page.getByRole("complementary", { name: "신청" }).getByRole("status")).toHaveText(
      "클럽 멤버 전용",
    );
  });

  test("겹치는 닉네임은 바로 알려 주고, 관심사는 다섯 개까지만 고른다", async ({
    page,
    request,
  }, info) => {
    await signUpByMail(page, request, testEmail(info.project.name), "/login?next=%2Fclubs");
    await expect(page).toHaveURL(/\/onboarding\?next=%2Fclubs$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("이름을 정해 주세요");

    const start = page.getByRole("button", { name: "시작하기" });
    await expect(start).toBeDisabled();

    await page.getByLabel("닉네임").fill("멤버하나");
    await expect(page.getByText("이미 누가 쓰고 있는 닉네임이에요.")).toBeVisible();
    await page.getByLabel("닉네임").fill("a!");
    await expect(page.getByText(/2~12자의 한글·영문·숫자·밑줄/)).toBeVisible();

    await page.getByLabel("닉네임").fill(testNickname());
    await expect(page.getByText("쓸 수 있는 닉네임이에요.")).toBeVisible();
    await expect(start).toBeDisabled(); // 관심사가 아직 없다

    for (const name of ["AI 도구", "바이브코딩", "웹 만들기", "디자인", "글쓰기"]) {
      await page.getByText(name, { exact: true }).click();
    }
    await expect(page.getByText("5/5")).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "영상" })).toBeDisabled();

    await start.click();
    await expect(page).toHaveURL(/\/clubs$/);

    // 이미 마친 사람이 온보딩 주소로 오면 바로 보낸다.
    await page.goto("/onboarding?next=%2Fexplore");
    await expect(page).toHaveURL(/\/explore$/);
  });
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

// L08 내 일정: 모임 · 시즌 회차 · 챌린지가 한 줄로 섞여 날짜순이다.
test.describe("내 일정", () => {
  const MEMBER = "00000000-0000-4000-a000-000000000005";
  const SEASON = "00000000-0000-4000-c000-000000000009";

  test("다가오는: 진행 중인 챌린지가 오늘 맨 앞, 회차는 회차마다, 곧 시작하는 회차는 화상 링크", async ({
    page,
    request,
  }) => {
    // 시즌 등록(시험 준비): 멤버하나를 확정 참가자로 넣는다.
    await sandboxInsert(request, "participations", {
      activity_id: SEASON,
      user_id: MEMBER,
      status: "confirmed",
    });
    await signInAs(page, "멤버하나", "/me/schedule");

    const main = page.getByRole("main");
    const titles = main.locator("li a[href^='/activities/']");
    await expect(titles.first()).toHaveText("2주 매일 하나씩 만들기");
    const order = await titles.allTextContents();
    expect(order.slice(0, 2)).toEqual(["2주 매일 하나씩 만들기", "4주 바이브코딩 시즌"]);
    expect(order).toContain("카피바라 카페에서 AI 수다");
    expect(order.filter((t) => t === "4주 바이브코딩 시즌")).toHaveLength(3);

    await expect(main.getByText("2회차 · 첫 화면")).toBeVisible();
    await expect(main.getByText(/일째 · 14일 중/)).toBeVisible();
    await expect(main.getByRole("link", { name: "화상 모임 들어가기" })).toHaveAttribute(
      "href",
      "https://meet.example.test/vibe-season-week-2",
    );
    await expect(main.getByText(/화상 링크는 .+에 열려요/).first()).toBeVisible();

    // 지난: 확정 참가만, 출석 기록과 함께
    await main.getByRole("link", { name: "지난", exact: true }).click();
    await expect(page).toHaveURL(/view=past/);
    const past = main.getByRole("listitem").filter({ hasText: "지난주 온라인 모각코" });
    await expect(past.getByText("출석")).toBeVisible();
    await expect(main.getByText("1회차 · 기획")).toBeVisible();

    // 달력: 오늘 칸이 선택되고 아래에 그날 일정이 펼쳐진다
    await main.getByRole("link", { name: "달력", exact: true }).click();
    await expect(page).toHaveURL(/view=month/);
    await expect(main.locator("[aria-current='date']")).toHaveCount(1);
    await expect(main.getByRole("heading", { name: /· 오늘$/ })).toBeVisible();
    await main.getByRole("link", { name: "다음 달" }).click();
    await expect(main.getByRole("link", { name: "오늘", exact: true })).toBeVisible();
  });

  test("일정이 없는 회원은 발견으로 안내받고, 나에서 내 일정으로 들어간다", async ({ page }) => {
    await signInAs(page, "처음온사람", "/me");
    await page
      .getByRole("main")
      .getByRole("link", { name: /내 일정/ })
      .click();
    await expect(page).toHaveURL(/\/me\/schedule$/);
    await expect(page.getByText("아직 잡힌 일정이 없어요")).toBeVisible();
    await expect(page.getByRole("link", { name: "발견에서 찾아보기" })).toBeVisible();
  });
});

// L09 챌린지 참여: 확정 참가자만 상세 안에서 오늘 미션 · 오늘 인증 · 내 진행 · 함께한 기록을 본다.
test.describe("챌린지 참여", () => {
  const CHALLENGE = "/activities/daily-build-2w";

  test("인증을 올리면 내 진행과 함께한 기록에 바로 반영되고, 오늘 안에는 고칠 수 있다", async ({
    page,
  }) => {
    await signInAs(page, "멤버하나", CHALLENGE);
    const room = page.locator("#today");
    await expect(room.getByRole("heading", { name: "내 챌린지" })).toBeVisible();
    await expect(room.getByText("오늘의 미션")).toBeVisible();
    await expect(room.getByText("완주까지 7번")).toBeVisible();

    // 빈 인증은 DB가 막고 이유를 알려 준다.
    await room.getByRole("button", { name: "인증 올리기" }).click();
    await expect(room.getByRole("alert")).toHaveText("인증 내용을 적어 주세요.");

    await room.getByLabel("오늘 한 것").fill("버튼 문구를 AI 답 대신 직접 고쳤어요.");
    await room.getByRole("button", { name: "인증 올리기" }).click();
    await expect(page).toHaveURL(/notice=cert_submitted/);
    await expect(room.getByText("오늘 인증을 올렸어요", { exact: true })).toBeVisible();
    await expect(room.getByText("완주까지 6번")).toBeVisible();
    const mine = room.getByRole("listitem").filter({ hasText: "멤버하나 (나)" });
    await expect(mine).toContainText("인증 4번");
    await expect(mine).toContainText("버튼 문구를 AI 답 대신 직접 고쳤어요.");

    await room.getByRole("button", { name: "고치기" }).click();
    await expect(room.getByLabel("오늘 한 것")).toHaveValue(
      "버튼 문구를 AI 답 대신 직접 고쳤어요.",
    );
    await room.getByLabel("오늘 한 것").fill("버튼 문구를 직접 고치고 이유를 적었어요.");
    await room.getByRole("button", { name: "고친 내용 올리기" }).click();
    await expect(room.getByText("버튼 문구를 직접 고치고 이유를 적었어요.").first()).toBeVisible();
    await expect(mine).toContainText("인증 4번"); // 고쳐도 하루 한 번

    // 신청 패널은 참여 영역으로 보낸다.
    await expect(
      page
        .getByRole("complementary", { name: "신청" })
        .getByRole("link", { name: "오늘 인증 보기" }),
    ).toHaveAttribute("href", "#today");
  });

  test("오늘 인증이 반려되면 사유가 보이고 다시 올리는 칸은 없다", async ({ page, request }) => {
    const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
    await sandboxInsert(request, "certifications", {
      activity_id: "00000000-0000-4000-c000-000000000014",
      user_id: "00000000-0000-4000-a000-000000000005",
      cert_date: today,
      body: "오늘 기록",
      status: "rejected",
      rejected_reason: "다른 챌린지의 기록이에요",
    });
    await signInAs(page, "멤버하나", CHALLENGE);
    const room = page.locator("#today");
    await expect(room.getByText("오늘 인증이 반려됐어요")).toBeVisible();
    await expect(room.getByText("사유: 다른 챌린지의 기록이에요")).toBeVisible();
    await expect(room.getByLabel("오늘 한 것")).toHaveCount(0);
  });

  test("참가하지 않은 사람에게는 인증 칸이 없다", async ({ page }) => {
    await page.goto(CHALLENGE);
    await expect(page.getByRole("heading", { name: "인증 방법" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "내 챌린지" })).toHaveCount(0);

    await signInAs(page, "처음온사람", CHALLENGE);
    await expect(page.getByRole("heading", { name: "인증 방법" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "내 챌린지" })).toHaveCount(0);
    await expect(page.getByLabel("오늘 한 것")).toHaveCount(0);
  });
});

// L10 주문과 환불: 결제 완료 → 지금 요청하면 얼마인지 → 요청 → (운영진) 승인 → 송금 완료.
test.describe("주문과 환불", () => {
  test("유료 모임을 결제한 뒤 환불을 요청하고, 운영진 처리에 따라 상태가 바뀐다", async ({
    browser,
  }) => {
    const guest = await (await browser.newContext()).newPage();
    await signInAs(guest, "처음온사람", "/activities/prompt-clinic/apply");
    await guest.getByLabel("입금자명").fill("김처음");
    await guest.getByText("취소·환불 규정을 확인했어요").click();
    await guest.getByRole("button", { name: "20,000원 · 신청하기" }).click();
    await expect(guest.getByRole("heading", { name: "입금하면 확정돼요" })).toBeVisible();

    // 입금 전: 목록에 입금 대기와 남은 시간
    await guest.goto("/me");
    await guest
      .getByRole("main")
      .getByRole("link", { name: /주문과 환불/ })
      .click();
    await expect(guest).toHaveURL(/\/me\/orders$/);
    const row = guest.getByRole("link", { name: /프롬프트 클리닉/ });
    await expect(row).toContainText("입금 대기");
    await expect(row).toContainText(/입금 기한 .*남았어요/);

    const owner = await (await browser.newContext()).newPage();
    await signInAs(owner, "모쏘운영", "/demo/platform/ops");
    await owner
      .getByRole("row", { name: /김처음/ })
      .getByRole("button", { name: "입금 확인" })
      .click();
    await expect(owner.getByRole("row", { name: /김처음/ })).toHaveCount(0);

    // 결제 완료: 신청 내역에서 주문으로, 주문에서 지금 요청하면 얼마인지
    await guest.goto("/activities/prompt-clinic/apply");
    await guest.getByRole("link", { name: "주문 보기 · 환불 요청" }).click();
    await expect(guest).toHaveURL(/\/me\/orders\/MS-\d{6}-\d{4}$/);
    await expect(guest.getByText("결제 완료", { exact: true })).toBeVisible();
    await expect(guest.getByText("지금 요청하면 10,000원(50%)을 돌려받아요.")).toBeVisible();

    const request = guest.getByRole("button", { name: "환불 요청하기" });
    await expect(request).toBeDisabled();
    await guest.getByLabel("사유 (선택)").fill("일정이 겹쳤어요");
    await guest.getByText("승인되면 참가가 취소되고 되돌릴 수 없어요").click();
    await request.click();
    await expect(guest.getByRole("status")).toContainText("환불을 요청했어요");
    await expect(guest.getByText("환불 요청됨", { exact: true })).toBeVisible();
    await expect(guest.getByText("10,000원 (50%) · 사유: 일정이 겹쳤어요")).toBeVisible();
    await expect(guest.getByText("운영진 확인을 기다려요")).toBeVisible();

    // 운영진 승인 → 참가 취소, 송금 대기
    await owner.reload();
    const refundRow = owner.getByRole("row", { name: /처음온사람/ });
    await refundRow.getByRole("button", { name: "승인" }).click();
    await expect(refundRow.getByRole("button", { name: "송금 완료" })).toBeVisible();
    await guest.reload();
    await expect(guest.getByText("환불 승인", { exact: true })).toBeVisible();
    await expect(guest.getByText("운영진이 승인했어요")).toBeVisible();
    await expect(guest.getByText("송금을 기다려요")).toBeVisible();

    // 송금 완료
    await refundRow.getByRole("button", { name: "송금 완료" }).click();
    await expect(owner.getByRole("row", { name: /처음온사람/ })).toHaveCount(0);
    await guest.reload();
    await expect(guest.getByText("환불 완료", { exact: true })).toBeVisible();
    await expect(guest.getByText("돈을 보냈어요")).toBeVisible();

    await guest.goto("/me/orders");
    await expect(guest.getByRole("link", { name: /프롬프트 클리닉/ })).toContainText(
      "환불 10,000원",
    );
  });

  test("주문이 없으면 발견으로 안내하고, 남의 주문 번호는 열리지 않는다", async ({ page }) => {
    await signInAs(page, "멤버하나", "/me/orders");
    await expect(page.getByText("주문이 없어요")).toBeVisible();
    const res = await page.goto("/me/orders/MS-000000-0001");
    expect(res?.status()).toBe(404);
  });
});

// L11 클럽: 찾기 → 상세 → 바로 가입 / 승인 신청 / 초대 링크 가입, 강퇴된 사람은 다시 못 들어온다.
test.describe("클럽", () => {
  test("바로 가입하는 클럽: 비로그인은 로그인부터, 가입하면 내 클럽, 나가면 다시 가입할 수 있다", async ({
    page,
  }) => {
    await page.goto("/clubs/weekend-vibe");
    await expect(
      page.getByRole("heading", { level: 1, name: "주말 바이브코딩 클럽" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "클럽 활동" })).toBeVisible();
    await expect(
      page
        .getByRole("complementary", { name: "가입" })
        .getByRole("link", { name: "로그인하고 가입하기" }),
    ).toHaveAttribute("href", "/login?next=%2Fclubs%2Fweekend-vibe");

    await signInAs(page, "처음온사람", "/clubs");
    await page.getByRole("link", { name: /주말 바이브코딩 클럽/ }).click();
    // 클럽 상세를 처음 여는 순간이면 개발 서버가 컴파일하느라 오래 걸린다.
    await expect(page).toHaveURL(/\/clubs\/weekend-vibe$/, { timeout: 30_000 });
    const side = page.getByRole("complementary", { name: "가입" });
    await side.getByRole("button", { name: "가입하기" }).click();
    await expect(page.getByRole("status").first()).toHaveText("클럽에 가입했어요.");
    await expect(side.getByText("멤버예요")).toBeVisible();

    await page.goto("/clubs");
    await expect(page.getByRole("heading", { name: "내 클럽" })).toBeVisible();
    await expect(page.getByRole("link", { name: /주말 바이브코딩 클럽/ })).toContainText("멤버");

    await page.getByRole("link", { name: /주말 바이브코딩 클럽/ }).click();
    await side.getByText("클럽 나가기").click();
    await side.getByRole("button", { name: "정말 나갈게요" }).click();
    await expect(page.getByRole("status").first()).toHaveText("클럽에서 나왔어요.");
    await expect(side.getByText("전에 나간 클럽이에요. 다시 가입할 수 있어요.")).toBeVisible();
    await expect(side.getByRole("button", { name: "가입하기" })).toBeVisible();
  });

  test("승인제 클럽: 가입 신청하면 클럽과 홈에 운영진 승인 대기가 보인다", async ({ page }) => {
    await signInAs(page, "처음온사람", "/clubs/ai-video-club");
    const side = page.getByRole("complementary", { name: "가입" });
    await side.getByRole("button", { name: "가입 신청하기" }).click();
    await expect(page.getByRole("status").first()).toContainText("가입을 신청했어요");
    await expect(side.getByText("운영진 승인 대기")).toBeVisible();

    await page.goto("/");
    const todo = page.getByRole("link", { name: /클럽 가입 승인을 기다리고 있어요/ });
    await expect(todo).toContainText("AI 영상 만들기 클럽");
    await todo.click();
    await expect(page).toHaveURL(/\/clubs\/ai-video-club$/);

    await page.goto("/clubs");
    await expect(page.getByRole("link", { name: /AI 영상 만들기 클럽/ })).toContainText(
      "승인 대기",
    );
  });

  test("초대 링크: 승인제 클럽이어도 로그인하고 한 번 누르면 바로 멤버", async ({ browser }) => {
    const host = await (await browser.newContext()).newPage();
    await signInAs(host, "바라호스트", "/clubs/ai-video-club");
    await host.getByRole("button", { name: "초대 링크 만들기" }).click();
    const link = await host.locator("code").filter({ hasText: "/invite/" }).textContent();
    const path = new URL(link!, "http://localhost").pathname;

    const guest = await (await browser.newContext()).newPage();
    await guest.goto(path);
    await expect(
      guest.getByRole("heading", { name: "AI 영상 만들기 클럽에 초대받았어요" }),
    ).toBeVisible();
    await guest.getByRole("link", { name: "로그인하고 초대 받기" }).click();
    await guest.waitForLoadState("networkidle");
    await guest.getByText("개발용 · 시험장 사람으로 들어가기").click();
    await guest.getByRole("button", { name: /처음온사람/ }).click();
    await expect(guest).toHaveURL(new RegExp(`${path}$`), { timeout: 30_000 });
    await guest.getByRole("button", { name: "처음온사람님으로 가입하기" }).click();
    await expect(guest).toHaveURL(/\/clubs\/ai-video-club\?notice=invite_joined$/);
    await expect(guest.getByRole("status").first()).toHaveText("초대 코드로 바로 가입했어요.");
    await expect(
      guest.getByRole("complementary", { name: "가입" }).getByText("멤버예요"),
    ).toBeVisible();

    // 같은 링크를 다시 열면 가입 버튼 대신 클럽으로 보낸다.
    await guest.goto(path);
    await expect(guest.getByText("이미 이 클럽의 멤버예요.")).toBeVisible();
    await expect(guest.getByRole("link", { name: "클럽으로 가기" })).toHaveAttribute(
      "href",
      "/clubs/ai-video-club",
    );
  });

  test("강퇴된 사람은 가입할 수 없다고 안내받고, 없는 초대 코드는 찾을 수 없다고 나온다", async ({
    page,
    request,
  }) => {
    await sandboxInsert(request, "club_members", {
      club_id: "00000000-0000-4000-b000-000000000001",
      user_id: "00000000-0000-4000-a000-000000000006",
      layer_id: "00000000-0000-4000-b100-000000000003",
      status: "banned",
    });
    await signInAs(page, "처음온사람", "/clubs/weekend-vibe");
    const side = page.getByRole("complementary", { name: "가입" });
    await expect(side.getByText("가입할 수 없어요", { exact: true })).toBeVisible();
    await expect(side.getByText("이 클럽에서 내보내져 다시 가입할 수 없어요.")).toBeVisible();
    await expect(side.getByRole("button", { name: "가입하기" })).toHaveCount(0);

    await page.goto("/invite/abcdef123456");
    await expect(page.getByRole("heading", { name: "찾을 수 없는 초대예요" })).toBeVisible();
  });
});

// L13 회원 여정 하나로: 처음 온 사람이 가입해 시즌·챌린지·클럽까지 들어오는 한 줄의 길.
test.describe("회원 여정", () => {
  test("새 메일 가입 → 온보딩 → 발견 → 유료 시즌 → 입금 확인 → 내 일정 → 챌린지 인증 → 클럽 가입", async ({
    browser,
    request,
  }) => {
    test.setTimeout(180_000);
    const me = await (await browser.newContext()).newPage();
    const email = testEmail("journey");
    const nickname = testNickname();

    // 1) 가입과 온보딩: 메일 링크로 들어와 이름을 정하면 발견으로 간다.
    await signUpByMail(me, request, email, "/login?next=%2Fexplore");
    await expect(me.getByRole("heading", { level: 1 })).toContainText("이름을 정해 주세요");
    await me.getByLabel("닉네임").fill(nickname);
    await expect(me.getByText("쓸 수 있는 닉네임이에요.")).toBeVisible();
    await me.getByText("바이브코딩", { exact: true }).click();
    await me.getByRole("button", { name: "시작하기" }).click();
    await expect(me).toHaveURL(/\/explore$/, { timeout: 30_000 });

    // 2) 발견에서 시즌을 찾아 신청한다(유료 → 입금 안내).
    await me
      .getByRole("link", { name: /4주 바이브코딩 시즌/ })
      .first()
      .click();
    await expect(me.getByRole("heading", { level: 1, name: "4주 바이브코딩 시즌" })).toBeVisible({
      timeout: 30_000,
    });
    await me
      .getByRole("complementary", { name: "신청" })
      .getByRole("link", { name: /신청/ })
      .click();
    await expect(me.getByRole("heading", { name: "이렇게 신청할게요" })).toBeVisible();
    await me.getByLabel("입금자명").fill("김여정");
    await me.getByText("취소·환불 규정을 확인했어요").click();
    await me.getByRole("button", { name: "40,000원 · 중간 합류 신청" }).click();
    // 신청 뒤 결과 화면을 개발 서버가 처음 그리면 오래 걸린다.
    await expect(me.getByRole("heading", { name: "입금하면 확정돼요" })).toBeVisible({
      timeout: 30_000,
    });

    // 3) 운영진이 입금을 확인하면 확정된다.
    const owner = await (await browser.newContext()).newPage();
    await signInAs(owner, "모쏘운영", "/demo/platform/ops");
    await owner
      .getByRole("row", { name: /김여정/ })
      .getByRole("button", { name: "입금 확인" })
      .click();
    await expect(owner.getByRole("row", { name: /김여정/ })).toHaveCount(0);
    await me.reload();
    await expect(me.getByRole("heading", { name: "참가가 확정됐어요" })).toBeVisible();

    // 4) 내 일정에 시즌의 남은 회차가 회차마다 보인다(지난 1회차는 없다).
    await me.goto("/me/schedule");
    const main = me.getByRole("main");
    await expect(main.getByText(/2회차 · 첫 화면/)).toBeVisible();
    await expect(main.getByText(/3회차 · 기능 붙이기/)).toBeVisible();
    await expect(main.getByText(/1회차 · 기획/)).toHaveCount(0);

    // 5) 진행 중인 챌린지에 중도 합류해 오늘 인증을 올린다.
    await me.goto("/activities/daily-build-2w/apply");
    await me.getByRole("button", { name: "중간 합류 신청" }).click();
    await expect(me.getByRole("heading", { name: "참가가 확정됐어요" })).toBeVisible();
    await me.goto("/activities/daily-build-2w");
    const room = me.locator("#today");
    await expect(room.getByRole("heading", { name: "내 챌린지" })).toBeVisible();
    // 오늘 합류했으니 지난 날은 "빠짐"이 아니다.
    await expect(room.getByRole("list", { name: "날짜별 내 인증" })).not.toContainText("빠짐");
    await room.getByLabel("오늘 한 것").fill("시즌 첫 화면을 AI와 같이 그렸어요.");
    await room.getByRole("button", { name: "인증 올리기" }).click();
    await expect(room.getByText("오늘 인증을 올렸어요", { exact: true })).toBeVisible();
    await expect(room.getByRole("listitem").filter({ hasText: `${nickname} (나)` })).toContainText(
      "인증 1번",
    );

    // 6) 챌린지를 연 클럽에 가입하면 내 클럽에 들어온다.
    await me.goto("/clubs/weekend-vibe");
    await me
      .getByRole("complementary", { name: "가입" })
      .getByRole("button", { name: "가입하기" })
      .click();
    await expect(me.getByRole("status").first()).toHaveText("클럽에 가입했어요.");

    // 7) 홈에서 한눈에: 다음 일정은 시즌 회차, 내 사람들에 클럽.
    await me.goto("/");
    await expect(me.getByRole("heading", { level: 1 })).toContainText(`${nickname}님`);
    await expect(me.getByRole("region", { name: "다음 일정", exact: true })).toContainText(
      "4주 바이브코딩 시즌",
    );
    await expect(me.getByRole("region", { name: "내 사람들" })).toContainText(
      "주말 바이브코딩 클럽",
    );
  });
});

// H01 호스트 도구: 자격 있는 사람만 "나"에서 들어가고, 내가 연 활동을 지난 것까지 본다.
test.describe("호스트 도구", () => {
  test("호스트는 나 → 호스트 도구에서 처리할 일과 내가 연 활동을 보고, 지난 활동과 거르기도 된다", async ({
    page,
  }) => {
    await signInAs(page, "바라호스트", "/me");
    await page
      .getByRole("main")
      .getByRole("link", { name: /호스트 도구/ })
      .click();
    await expect(page).toHaveURL(/\/host$/);

    const todo = page.getByRole("region", { name: "지금 처리할 일" });
    await expect(todo.getByRole("link", { name: /아직 공개 전이에요/ })).toContainText(
      "(작성 중) 밤 산책 회고",
    );
    await expect(
      todo.getByRole("link", { name: /입금 대기 1명 · 운영진이 확인해요/ }),
    ).toBeVisible();

    const acts = page.getByRole("region", { name: "내가 연 활동" });
    await expect(acts.getByRole("link", { name: "4주 바이브코딩 시즌" })).toBeVisible();
    await expect(acts.getByRole("link", { name: "프롬프트 클리닉" })).toBeVisible();

    // 지난 활동: 기간이 끝났는데 아직 판정 전이면 "기간 끝남"
    await acts.getByRole("link", { name: /^지난/ }).click();
    await expect(page).toHaveURL(/\/host\?tab=past$/);
    const diary = acts.getByRole("listitem").filter({ hasText: "1주 프롬프트 일기" });
    await expect(diary).toContainText("기간 끝남");

    // 거르기는 주소에 남는다
    await page.goto("/host");
    await acts.getByLabel("제목").fill("클리닉");
    await acts.getByRole("button", { name: "찾기" }).click();
    await expect(page).toHaveURL(/q=%ED%81%B4%EB%A6%AC%EB%8B%89/);
    await expect(acts.getByRole("listitem")).toHaveCount(1);
    await acts.getByRole("link", { name: "조건 지우기" }).first().click();
    await expect(page).toHaveURL(/\/host$/);
  });

  test("자격이 없는 회원에게는 입구가 없고, 주소로 와도 무엇인지와 갈 곳을 알려 준다", async ({
    page,
  }) => {
    await signInAs(page, "멤버하나", "/me");
    await expect(page.getByRole("main").getByRole("link", { name: /내 일정/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /호스트 도구/ })).toHaveCount(0);
    await page.goto("/host");
    await expect(page.getByText("활동을 여는 사람이 쓰는 곳이에요")).toBeVisible();
    await expect(page.getByRole("link", { name: "발견에서 활동 찾기" })).toHaveAttribute(
      "href",
      "/explore",
    );
  });

  test("로그인하지 않으면 로그인 뒤 호스트 도구로 돌아온다", async ({ page }) => {
    await page.goto("/host?tab=past");
    await expect(page).toHaveURL(/\/login\?next=%2Fhost%3Ftab%3Dpast$/);
  });
});

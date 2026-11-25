import { expect, fillPlanWithExample, test } from "./workbook-test";
import { workbookCourse } from "../src/lib/workbook-course";

const [unitOne, unitTwo] = workbookCourse;

test("공개 홈부터 모든 기본 수업 예시 학습과 최종 정리 홈 왕복을 한 방문에서 완료한다", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const button = (name: string | RegExp) =>
    page.getByRole("button", { name, exact: typeof name === "string" });
  const click = async (name: string | RegExp) => {
    await button(name).click();
  };
  const next = async (count = 1) => {
    for (let i = 0; i < count; i++) await click(/^다음으로/);
  };
  const fill = async (name: string, value: string) => {
    await page.getByRole("textbox", { name, exact: true }).fill(value);
  };
  const progress = page.getByLabel("현재 학습 단계", { exact: true });
  const lesson = async (slug: string) => {
    await expect(page).toHaveURL(new RegExp(`/lessons/${slug}$`));
  };
  // 단원 정리의 "n단원 시작하기 →"로 다음 단원 지도에 도착해 첫 수업을 시작한다.
  const unitNext = async (unit: (typeof workbookCourse)[number]) => {
    await click(`${unit.number}단원 시작하기 →`);
    await expect(page).toHaveURL(/view=map$/);
    await expect(page.getByText(`${unit.number - 1}단원을 마쳤어요.`)).toBeVisible();
    await click(`${unit.lessons[0].title} 수업 시작`);
  };
  // 3단원부터는 단원을 마치면 지도의 완료 안내에서 다음 단원 첫 수업으로 간다.
  const handoffNext = async (unit: (typeof workbookCourse)[number]) => {
    await expect(page).toHaveURL(/view=map$/);
    const handoff = page.getByRole("region", { name: "단원 학습 완료와 다음 학습", exact: true });
    await handoff
      .getByRole("button", { name: `${unit.lessons[0].number} ${unit.lessons[0].title} 시작 →` })
      .click();
  };
  // Exactly one initial navigation. Every subsequent transition uses the public UI.
  await page.goto("/workbook");
  await page.getByRole("link", { name: "웹페이지 만들기 클래스 보기 →", exact: true }).click();
  await click("강의 시작하기 ↗");
  await expect(page).toHaveURL(/view=map$/);
  await click("클래스 인트로 인트로 보기");
  await click("4. 준비하고 시작하기");
  await click("첫 수업 시작 →");
  // 1단원: 정리 화면의 "다음 수업" 버튼으로 이어 간다. 입력은 모두 선택이다.
  for (const [index, item] of unitOne.lessons.entries()) {
    await lesson(item.slug);
    const total = Number((await progress.textContent())!.split("/")[1].trim());
    await next(total - 1);
    await expect(progress).toHaveText(`${total} / ${total}`);
    const following = unitOne.lessons[index + 1];
    if (following) await click(`다음 수업 ${following.number} ${following.title} 시작`);
  }
  await expect(page.getByLabel("수업 내용", { exact: true }).getByRole("checkbox")).toHaveCount(0);
  await unitNext(unitTwo);
  // 2단원: 기획 네 수업은 예시로 고르고, 2-5는 예시로 따라가고, 2-6은 대조·수정 요청까지.
  await lesson(unitTwo.lessons[0].slug);
  await fillPlanWithExample(page, { toRequest: true });
  await lesson("page-request");
  await click("메모로 옮기기 →");
  await next(2);
  await click(/예시로 따라갈게요$/);
  await next(2);
  await click(/^다음 수업 2-6/);
  await lesson("page-building");
  for (const name of ["제목 있어요", "소개 글 있어요", "맨 아래 버튼 있어요"]) await click(name);
  await click("넣을 내용 순서 달라요");
  await next();
  await click("작업 의뢰 문의하기");
  await next();
  await click("넣을 내용 순서");
  await next(2);
  await unitNext(workbookCourse[2]);
  // 3-1 반응형 화면이란 무엇인가: 개념 수업이라 화면을 넘기고 정리에서 다음 수업으로 간다.
  await lesson("responsive-basics");
  while (await button(/^다음으로/).isVisible()) await next();
  await click(/^다음 수업/);
  await lesson("screen-observation");
  await next();
  await click("이 화면 확인했어요");
  await click("모바일 폭 280px · 확인 전");
  await click("이 화면 확인했어요");
  await next();
  await fill("예시의 작은 화면에서 불편한 한 가지", "모바일에서 목록 오른쪽이 잘려요.");
  await next();
  await click("개선 요청 쓰기로 →");
  await lesson("screen-improvement");
  await click("관찰한 점으로 수정 요청 초안 만들기");
  await next(3);
  await click("수정 전후 확인으로 →");
  await lesson("screen-check");
  await click("너비 수정 예시 준비하기");
  await next();
  for (let i = 0; i < 2; i++) {
    await click("수정 후 보기");
    await click("이 폭의 수정 후 확인했어요");
    await next();
  }
  await click("모바일 280px");
  await click("내용 보기");
  await next();
  await fill(
    "예시 수정 전후 달라진 점",
    "두 폭에서 내용이 들어가고 버튼이 같은 목록으로 이동해요.",
  );
  await next();
  await click("단원 마치고 다음 학습 보기 →");
  await handoffNext(workbookCourse[3]);
  await lesson("interaction");
  await next();
  await click("화면에 표시하기 버튼을 눌러야 나타나요");
  await next();
  await fill("예시에 표시할 한 줄", "버튼 이름 확인하기");
  await click("화면에 표시하기");
  await next(2);
  await click("새로고침과 저장으로 →");
  await lesson("browser-storage");
  await next();
  await click("저장하지 않았으니 새로고침하면 사라져요");
  await next();
  await click("저장 없이 다시 열기 (예시)");
  await next();
  await click("방금 메모 저장하기 (예시)");
  await click("저장 후 다시 열기 (예시)");
  await next(2);
  await click("다른 기기와 서버로 →");
  await lesson("shared-data");
  await click("그 브라우저에만 있어서 다른 기기에는 없어요");
  await next();
  await click("다른 기기 예시 보기");
  await next(2);
  await click(/^친구가 다른 컴퓨터에서 쓴 답장을 함께 읽기/);
  await next();
  await fill("표시·저장·공유가 다른 이유", "다른 기기는 같은 브라우저 저장 칸을 쓰지 않아요.");
  await next();
  await click("단원 마치고 다음 학습 보기 →");
  await handoffNext(workbookCourse[4]);
  await lesson("publish-check");
  await next();
  await click(/^공개 여부를 확인한 제목·소개·작업 목록/);
  await next();
  for (let i = 0; i < 2; i++) {
    await page.getByRole("checkbox").check();
    await next();
  }
  await click("내용 보기");
  await next();
  await click("주소와 배포로 →");
  await lesson("publish-address");
  await next();
  for (const name of [
    "내 컴퓨터 주소 · http://localhost:3211",
    "공개 서버 주소 예시 · https://my-work.example.invalid",
  ]) {
    await click(name);
    await click("접속 예시 확인하기");
  }
  await next(2);
  await fill("주소와 실제 배포가 다른 이유", "주소를 적는 것과 내 파일을 공개하는 것은 달라요.");
  await next();
  await click("공개 후 문제 해결로 →");
  await lesson("publish-debug");
  await click("추가 내용 보기");
  await next();
  await fill("어느 화면에서 눌렀나요?", "컴퓨터 브라우저 예시");
  await fill("무엇을 눌렀나요?", "추가 내용 보기 버튼");
  await next();
  await fill("무엇이 나타나야 하나요?", "추가 내용 목록");
  await fill("실제로 무엇이 보였나요?", "목록이 보이지 않았어요.");
  await next();
  await click("문제 기록으로 수정 요청 만들기");
  await next();
  await click("예시 버튼 수정 적용하기");
  await next();
  await click("추가 내용 보기");
  await next();
  await fill("예시 버튼을 다시 눌러 확인한 변화", "같은 버튼으로 추가 목록이 나타나요.");
  await next();
  await click("학습 기록하고 클래스 정리로 →");
  const summary = page.getByRole("heading", { name: "배운 것과 내 파일, 다음 할 일", exact: true });
  await expect(summary).toBeVisible();
  await expect(page.getByLabel("수업 내용", { exact: true })).toContainText("기본 5/5단원");
  await click("실제 결과");
  const actual = page.getByRole("region", { name: "내 프로젝트에서 확인한 것", exact: true });
  await expect(actual).toContainText(
    "이번에는 예시로 학습했어요. 내 컴퓨터에서 만든 결과를 확인하면 여기에 남길 수 있어요.",
  );
  await expect(actual.getByText("이전에 남긴 내 파일 기록", { exact: true })).toHaveCount(0);
  await expect(actual).not.toContainText("최종 프로젝트 확인 기록이 있어요");
  await page.screenshot({ path: info.outputPath("full-preview-summary.png") });
  await click("메뉴 펼치기");
  await expect(button("메뉴 접기")).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("link", { name: "워크북 홈 ↗", exact: true }).click();
  await expect(page).toHaveURL(/\/workbook$/);
  await page.getByRole("link", { name: "클래스 마지막 정리 보기 →", exact: true }).click();
  await expect(page).toHaveURL(/view=summary$/);
  await expect(summary).toBeVisible();
  await click("배운 핵심");
  await expect(page.getByLabel("수업 내용", { exact: true })).toContainText("기본 5/5단원");
});

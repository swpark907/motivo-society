import { expect, test } from "./workbook-test";

test("공개 홈부터 17수업 예시 학습과 최종 정리 홈 왕복을 한 방문에서 완료한다", async ({
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
    for (let i = 0; i < count; i++) await click("다음으로");
  };
  const fill = async (name: string, value: string) => {
    await page.getByRole("textbox", { name, exact: true }).fill(value);
  };
  const lesson = async (slug: string) => {
    await expect(page).toHaveURL(new RegExp(`/lessons/${slug}$`));
  };
  const mapNext = async (number: string) => {
    await expect(page).toHaveURL(/view=map$/);
    await click(new RegExp(`^다음 수업 시작 · ${number} `));
  };
  const unitNext = async (number: string) => {
    await expect(page).toHaveURL(/view=map$/);
    const handoff = page.getByRole("region", { name: "단원 학습 완료와 다음 학습", exact: true });
    await handoff.getByRole("button", { name: new RegExp(`^${number} .* 시작 →$`) }).click();
  };
  // Exactly one initial navigation. Every subsequent transition uses the public UI.
  await page.goto("/workbook");
  await page.getByRole("link", { name: "웹페이지 만들기 클래스 보기 →", exact: true }).click();
  await click("강의 시작하기 ↗");
  await click("기초강의 시작하기 →");
  await lesson("ai-understanding");
  await next(3);
  await click("예시 결과 보기");
  await click("이미 1만 명이 선택했다는 내용");
  await next();
  await click("학습 마치고 단원 지도로 →");
  await mapNext("1-2");
  await lesson("ai-tools");
  await next(8);
  await click("파일 작업 기능과 연결된 폴더·권한을 확인해야 해요");
  await next();
  await click("이미지를 생성하고 저장하는 기능");
  await click("그럴 수 있어요");
  await click("학습 정리 보기");
  await click("학습 마치고 단원 지도로 →");
  await mapNext("1-3");
  await lesson("tool-setup");
  await next(2);
  await click("모바일에서 복습하기");
  await next(7);
  await click("작업 폴더 → 요청 → 파일 변경 → 실행·확인 → 수정 요청");
  await next();
  await click("학습 정리 보기");
  await click("학습 마치고 단원 지도로 →");
  await mapNext("1-4");
  await lesson("first-request");
  await next();
  await click("예시로 복습하기");
  await next();
  await click("예시 요청 가져오기");
  await next();
  await click("미리 만든 결과 살펴보기");
  await fill("확인한 점 하나", "첫 문장이 길어요.");
  await next();
  await click("수정 예시 가져오기");
  await next();
  await click("미리 만든 수정 결과 보기");
  await next();
  await click("첫 문장은 짧게 바꾸고 장소의 특징은 유지해줘");
  await click("학습 정리 보기");
  await click("학습 마치고 단원 지도로 →");
  await mapNext("1-5");
  await lesson("first-file");
  await next();
  await click("예시로 복습하기");
  await next();
  await click("예시 요청 가져오기");
  await next();
  await click("미리 만든 결과 살펴보기");
  await click("작업 보기");
  await next();
  await fill("확인한 점 하나", "제목과 목록이 보이고 버튼이 목록으로 이동해요.");
  await next();
  await click("수정 예시 가져오기");
  await next();
  await click("미리 만든 수정 결과 보기");
  await click("수정된 작업 보기");
  await next();
  await click("바뀐 파일과 브라우저 화면·버튼을 직접 확인해요");
  await next();
  await expect(page.getByLabel("수업 내용", { exact: true }).getByRole("checkbox")).toHaveCount(0);
  await click("학습 정리 보기");
  await click("1단원 마치고 다음 학습 보기 →");
  await unitNext("2-1");
  await lesson("page-planning");
  await next();
  await click("빈 항목에 구성 예시 넣기");
  await next(3);
  await click("제작 요청 다듬기로 →");
  await lesson("page-request");
  await click("내 기획으로 요청 초안 만들기");
  await next(2);
  await click(/기획 미리보기로 복습하기/);
  await next(2);
  await click("첫 화면 확인하기로 →");
  await lesson("page-building");
  await next();
  await click("내용 보기");
  await next(2);
  await fill("내 화면에서 확인한 점", "제목과 소개가 보이고 버튼이 목록으로 이동해요.");
  await next();
  await click("2단원 마치고 다음 학습 보기 →");
  await unitNext("3-1");
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
  await unitNext("4-1");
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
  await unitNext("5-1");
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
  await page.getByRole("link", { name: "워크북 홈 ↗", exact: true }).click();
  await expect(page).toHaveURL(/\/workbook$/);
  await page.getByRole("link", { name: "클래스 마지막 정리 보기 →", exact: true }).click();
  await expect(page).toHaveURL(/view=summary$/);
  await expect(summary).toBeVisible();
  await click("배운 핵심");
  await expect(page.getByLabel("수업 내용", { exact: true })).toContainText("기본 5/5단원");
});

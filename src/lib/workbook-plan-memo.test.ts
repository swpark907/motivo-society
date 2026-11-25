import { describe, expect, it } from "vitest";
import { NO_NEW_FILE, planMemo, planMemoText, planQuestions } from "./workbook-plan-memo";
import { ASK_INTRO } from "./workbook-plan-readers";

const plan = {
  title: "처음 오신 분을 위한 안내",
  audience: "우리 서비스를 처음 알게 된 근처 손님",
  purpose: "내용을 보고 신청하기",
  intro: ASK_INTRO,
  content: "신청 방법\n무엇을 해 주는지",
  later: "이용 후기",
};

describe("workbook plan memo", () => {
  it("기획을 네 칸 메모로 옮긴다", () => {
    const rows = planMemo(plan);
    expect(rows.map((row) => row.label)).toEqual(["무엇을", "어디에 쓸지", "조건", "하지 말 것"]);
    expect(rows[0].line).toContain("“처음 오신 분을 위한 안내”");
    expect(rows[1].line).toContain("‘신청하기’ 버튼");
    expect(rows[2].line).toContain("이 순서로 넣어줘: 신청 방법, 무엇을 해 주는지.");
    expect(rows[2].line).toContain("소개 글도 나에게 물어보고 채워줘.");
    expect(rows[3].line.startsWith(NO_NEW_FILE)).toBe(true);
    expect(rows[3].line).toContain("이건 아직 넣지 마: 이용 후기.");
  });

  it("상황 · 배치 · 분위기 · 버튼 문구를 고르면 메모에 들어간다", () => {
    const text = planMemoText({
      ...plan,
      entry: "insta",
      device: "phone",
      pace: "short",
      layout: "stack",
      mood: "warm",
      buttonLabel: "이번 달 수업 신청하기",
      references: "take:card-list\ndrop:big-sentence\ntake:review",
    });
    expect(text).toContain("참고할 구성: 카드 목록, 후기 한 줄.");
    expect(text).toContain("이 사람은 인스타그램 링크를 타고 들어와요. 주로 휴대폰으로 봐요.");
    expect(text).toContain("‘이번 달 수업 신청하기’ 버튼");
    expect(text).toContain("배치는 위에서 아래로 한 줄로 쌓아 줘.");
    expect(text).toContain("분위기는 따뜻하게.");
  });

  it("1-6에서 받은 소개 글이 있으면 그대로 쓰라고 한다", () => {
    expect(planMemoText({ ...plan, intro: "안녕하세요." })).toContain(
      "소개 글은 이 글을 그대로 써 줘: 안녕하세요.",
    );
  });

  it("질문은 내 기획의 첫 카드 · 버튼 · 나중 카드로 만든다", () => {
    expect(planQuestions(plan).map((item) => item.question)).toEqual([
      "‘신청 방법’에는 구체적으로 어떤 내용을 적을까요? 하나만 고른다면요?",
      "‘신청하기’ 버튼을 누르면 어떤 화면으로 가야 하나요?",
      "‘이용 후기’ 내용은 언제쯤 채울 수 있나요? 그전까지는 페이지에서 빼 둘까요?",
    ]);
  });

  it("나중에 채울 내용이 없으면 셋째 질문은 기억할 것을 묻고, 모르면 모른다고 답한다", () => {
    const [, , third] = planQuestions({ ...plan, later: "" });
    expect(third.question).toContain("딱 하나만 기억한다면");
    expect(third.answer).toContain("아직 모르겠어");
  });
});

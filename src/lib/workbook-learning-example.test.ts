import { describe, expect, it } from "vitest";
import { findWorkbookRequestExcerpt } from "./workbook-learning-example";

describe("현재 요청에서 기획 발췌", () => {
  it("제목과 독자에 같은 단어가 있어도 해당 기획 항목을 찾아 강조한다", () => {
    const request = "제목: 친구에게 추천하는 장소\n읽을 사람: 친구\n마지막 안내";
    expect(findWorkbookRequestExcerpt(request, "친구", "읽을 사람: ")).toEqual({
      before: "읽을 사람: ",
      match: "친구",
      after: "",
    });
    expect(
      findWorkbookRequestExcerpt("제목: 친구에게 추천하는 장소", "친구", "읽을 사람: "),
    ).toBeNull();
  });
  it("기획값의 앞뒤 문맥과 여러 줄 콘텐츠를 원문 그대로 남긴다", () => {
    const request = "대상: 독자\n소개할 내용:\n첫 장소\n두 번째 장소\n마지막 안내";
    expect(findWorkbookRequestExcerpt(request, "첫 장소\n두 번째 장소")).toEqual({
      before: "",
      match: "첫 장소\n두 번째 장소",
      after: "",
    });
    expect(findWorkbookRequestExcerpt(request, "독자")).toEqual({
      before: "대상: ",
      match: "독자",
      after: "",
    });
  });
  it("직접 편집해 사라진 내용이나 빈 값을 새로 만들어 표시하지 않는다", () => {
    const edited = "내가 직접 작성한 요청만 남깁니다.";
    expect(findWorkbookRequestExcerpt(edited, "my-first-web")).toBeNull();
    expect(findWorkbookRequestExcerpt(edited, "  ")).toBeNull();
    expect(edited).toBe("내가 직접 작성한 요청만 남깁니다.");
  });
  it("HTML처럼 보이는 입력도 일반 텍스트로 발췌한다", () => {
    expect(findWorkbookRequestExcerpt("독자: <img src=x>\n다음 줄", "<img src=x>")).toEqual({
      before: "독자: ",
      match: "<img src=x>",
      after: "",
    });
  });
});

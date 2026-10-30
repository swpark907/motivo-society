// 기본 수업을 잇는 설명용 가상 사례. 학습자가 작성한 기록을 대체하지 않는다.
export const workbookLearningExample = {
  notes: ["창가 자리", "혼자 책 읽기 좋음", "주말에는 사람이 많음"],
  firstResult:
    "창가 자리가 있어 혼자 책을 읽으며 쉬어가기 좋은 공간입니다. 주말에는 사람이 많으니 방문 시간을 참고해주세요.",
  revisedResult:
    "창가에서 혼자 책 읽기 좋은 공간입니다. 주말에는 사람이 많으니 방문 시간을 참고해주세요.",
  request:
    "장소 소개문을 두 문장으로 써줘. 혼자 책 읽을 곳을 찾는 사람에게 보여줄 글이야. 알려줄 정보는 창가 자리, 혼자 책 읽기 좋음, 주말에는 사람이 많음이야. 이 정보만 사용하고 없는 사실은 추가하지 마. 지금은 답변만 하고 파일은 만들거나 수정하지 마.",
  revision:
    "소개문의 첫 문장을 더 짧게 바꿔줘. 창가 자리와 혼자 책 읽기 좋다는 특징, 주말 혼잡 안내는 유지해줘. 파일은 변경하지 마.",
  title: "혼자 책 읽기 좋은 세 곳",
  intro: "자리와 소음을 기준으로 세 장소를 비교하는 연습용 페이지예요.",
  content:
    "창가 책방 · 창가에서 책 읽기\n골목 카페 · 넓은 테이블에서 쉬기\n동네 도서관 · 조용한 자리에서 읽기",
};

// 현재 요청 원문에서만 발췌한다. 직접 편집해 사라진 문장을 예전 초안으로 복원하지 않는다.
export function findWorkbookRequestExcerpt(request: string, value: string, prefix = "") {
  const needle = value.trim();
  const found = needle ? request.indexOf(prefix + needle) : -1;
  if (found < 0) return null;
  const start = found + prefix.length;
  const end = start + needle.length;
  const lineStart = request.lastIndexOf("\n", start - 1) + 1;
  const nextLine = request.indexOf("\n", end);
  const lineEnd = nextLine < 0 ? request.length : nextLine;
  return {
    before: request.slice(lineStart, start),
    match: request.slice(start, end),
    after: request.slice(end, lineEnd),
  };
}

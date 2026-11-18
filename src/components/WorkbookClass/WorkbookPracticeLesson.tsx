// 실습 기록의 형태를 소유한다. "요청 잘하기"와 "첫 코드 만들기" 수업의 화면들이
// 공통 수업 틀(WorkbookLessons) 안에서 이 기록을 직접 읽고 쓴다.
// 파일 이름은 예전 실습 화면에서 왔고, 지금은 기록 형태만 남아 있다.
export type PracticeRecord = {
  mode: "computer" | "example" | null;
  request: string;
  observation: string;
  revision: string;
  checks: boolean[];
};
export const emptyPractice = (): PracticeRecord => ({
  mode: null,
  request: "",
  observation: "",
  revision: "",
  checks: [false, false, false],
});

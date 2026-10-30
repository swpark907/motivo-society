"use client";

// 기록 형태는 유지하고 각 수업은 전용 학습 화면을 소유한다.
import { WorkbookConversationLesson } from "./WorkbookConversationLesson";
import { WorkbookFirstFileLesson } from "./WorkbookFirstFileLesson";

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
export type PracticeLessonProps = {
  lesson: 3 | 4;
  record: PracticeRecord;
  ready: boolean;
  onChange: (record: PracticeRecord) => void;
  onBack: () => void;
  onComplete: () => void;
};

export function WorkbookPracticeLesson(props: PracticeLessonProps) {
  return props.lesson === 3 ? (
    <WorkbookConversationLesson {...props} />
  ) : (
    <WorkbookFirstFileLesson {...props} />
  );
}

"use client";

import { WorkbookProjectResultLesson } from "./WorkbookProjectResultLesson";
import { WorkbookProjectRequestLesson } from "./WorkbookProjectRequestLesson";
import { WorkbookPlanningLesson } from "./WorkbookPlanningLesson";

export type ProjectRecord = {
  title: string;
  audience: string;
  purpose: string;
  intro: string;
  content: string;
  /** 2-1에서 "나중에 채울 것"으로 미뤄 둔 내용. 이번 페이지에는 넣지 않는다. */
  later: string;
  request: string;
  basedOn: string;
  mode: "computer" | "example" | null;
  observation: string;
  /** 2-2에서 바뀌는 부분을 보고 승인했다고 학습자가 찍은 도장(컴퓨터 실습일 때만). */
  approved: boolean;
  previewConfirmed: boolean;
  checks: boolean[];
};
export const emptyProject = (): ProjectRecord => ({
  title: "",
  audience: "",
  purpose: "",
  intro: "",
  content: "",
  later: "",
  request: "",
  basedOn: "",
  mode: null,
  observation: "",
  approved: false,
  previewConfirmed: false,
  checks: [false, false, false],
});
export type ProjectLessonProps = {
  record: ProjectRecord;
  ready: boolean;
  onChange: (record: ProjectRecord) => void;
  onBack: () => void;
  onComplete: () => void;
  step: number;
  onStep: (step: number) => void;
  /** 2-3 정리에서 다음 단원(3단원) 지도로 바로 간다. */
  onNextUnit?: () => void;
};

export function WorkbookProjectLesson(props: ProjectLessonProps) {
  return props.step === 0 ? (
    <WorkbookPlanningLesson {...props} />
  ) : props.step === 1 ? (
    <WorkbookProjectRequestLesson {...props} />
  ) : (
    <WorkbookProjectResultLesson {...props} />
  );
}

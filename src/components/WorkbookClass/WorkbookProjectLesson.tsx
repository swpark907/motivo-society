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
  request: string;
  basedOn: string;
  mode: "computer" | "example" | null;
  observation: string;
  previewConfirmed: boolean;
  checks: boolean[];
};
export const emptyProject = (): ProjectRecord => ({
  title: "",
  audience: "",
  purpose: "",
  intro: "",
  content: "",
  request: "",
  basedOn: "",
  mode: null,
  observation: "",
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

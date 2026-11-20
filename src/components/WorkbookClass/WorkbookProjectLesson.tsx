"use client";

import { WorkbookProjectResultLesson } from "./WorkbookProjectResultLesson";
import { WorkbookProjectRequestLesson } from "./WorkbookProjectRequestLesson";
import { WorkbookPlanningLesson } from "./WorkbookPlanningLesson";
import { WorkbookReferencesLesson } from "./WorkbookReferencesLesson";
import { WorkbookStructureLesson } from "./WorkbookStructureLesson";
import { WorkbookBriefLesson } from "./WorkbookBriefLesson";
import { workbookProjectStep } from "@/lib/workbook-course";

export type ProjectRecord = {
  title: string;
  audience: string;
  purpose: string;
  intro: string;
  content: string;
  /** "나중에 채울 것"으로 미뤄 둔 내용. 이번 페이지에는 넣지 않는다. */
  later: string;
  /** 2-1 읽을 사람의 상황: 어디서 들어오는지 · 무엇으로 보는지 · 얼마나 머무는지(workbook-plan-options의 id). */
  entry: string;
  device: string;
  pace: string;
  /** 2-1 잘 됐다는 기준(한 줄에 하나). 2-6에서 이 기준으로 확인한다. */
  criteria: string;
  /** 2-2 레퍼런스에서 가져올 것 · 뺄 것(조각 id, 한 줄에 하나, "take:"·"drop:" 앞붙임). */
  references: string;
  /** 2-3 배치 틀 · 2-4 분위기 · 2-4 버튼 문구(workbook-plan-options의 id와 글). */
  layout: string;
  mood: string;
  buttonLabel: string;
  /** 마친 기획 수업의 주소(slug). 2단원 진도는 이것과 요청 · 결과 기록에서 계산한다. */
  done: string[];
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
  entry: "",
  device: "",
  pace: "",
  criteria: "",
  references: "",
  layout: "",
  mood: "",
  buttonLabel: "",
  done: [],
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
  const S = workbookProjectStep;
  switch (props.step) {
    case S.audience:
      return <WorkbookPlanningLesson {...props} />;
    case S.references:
      return <WorkbookReferencesLesson {...props} />;
    case S.structure:
      return <WorkbookStructureLesson {...props} />;
    case S.brief:
      return <WorkbookBriefLesson {...props} />;
    case S.request:
      return <WorkbookProjectRequestLesson {...props} />;
    default:
      return <WorkbookProjectResultLesson {...props} />;
  }
}

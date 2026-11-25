"use client";

// 2-1 누구를 위한 페이지인가(주소 page-planning은 영구 주소라 그대로): 같은 페이지 다른 눈(읽을 사람) →
// 그 사람의 상황 → 다 읽고 할 일(맨 아래 버튼 = 목적) → 잘 됐다는 기준 → 오늘 알게 된 것.
// 고른 것은 기획 기록에 들어가 뒤 수업과 2-5 요청 메모, 2-6 확인이 같은 이름으로 읽는다.
import { workbookProjectStep } from "@/lib/workbook-course";
import { ASK_INTRO, planLines } from "@/lib/workbook-plan-readers";
import { situationLabel } from "@/lib/workbook-plan-options";
import type { ProjectLessonProps } from "./WorkbookProjectLesson";
import { WorkbookPlanLessonFrame } from "./WorkbookPlanLessonFrame";
import { usePlanContext } from "./usePlanContext";
import { FIRST_PAGE_TITLE } from "./WorkbookFileAsk";
import { WorkbookPlanReaders } from "./WorkbookPlanReaders";
import { WorkbookPlanSituation } from "./WorkbookPlanSituation";
import { WorkbookPlanAction } from "./WorkbookPlanAction";
import { WorkbookPlanCriteria } from "./WorkbookPlanCriteria";
import { WorkbookAudienceRecap, type RecapLine } from "./WorkbookPlanRecaps";

const LEARNED: readonly RecapLine[] = [
  {
    term: "보는 사람에 따라 찾는 것이 달라요",
    text: "같은 페이지라도 채용 담당자는 해 본 작업을, 손님은 신청 방법을 먼저 찾아요.",
  },
  {
    term: "상황이 첫 화면을 바꿔요",
    text: "어디서 들어와, 무엇으로, 얼마나 보는지에 따라 먼저 보여야 할 것이 달라져요.",
  },
  {
    term: "목적은 버튼 하나로 나타나요",
    text: "다 읽은 사람이 누를 맨 아래 버튼이 이 페이지가 바라는 일이에요.",
  },
  {
    term: "기준은 만들기 전에 정해요",
    text: "잘 됐다는 기준을 먼저 정해 두면, 다 만든 뒤 무엇을 보면 되는지 알 수 있어요.",
  },
];

export function WorkbookPlanningLesson({ onBack, onStep }: ProjectLessonProps) {
  const { record, picked, reader, purposeId, firstIntro, button, update } = usePlanContext();
  const situation = [
    situationLabel("entry", record.entry),
    situationLabel("device", record.device),
    situationLabel("pace", record.pace),
  ].filter(Boolean);
  return (
    <WorkbookPlanLessonFrame
      point={workbookProjectStep.audience}
      onBack={onBack}
      onStep={onStep}
      goal={{
        title: "누가, 어떤 상황에서 볼지 정하고 잘 됐다는 기준 세우기",
        text: "1단원에서 만든 같은 폴더와 index.html을 이어서 써요.",
        note: "여기서 정한 것은 다음 수업들과 요청에 그대로 이어져요.",
      }}
      screens={[
        () => (
          <WorkbookPlanReaders
            pageTitle={FIRST_PAGE_TITLE}
            pageIntro={firstIntro}
            picked={picked}
            purposeId={purposeId}
            onPick={(next) =>
              update({
                audience: next.audience,
                intro: record.intro.trim() ? record.intro : firstIntro || ASK_INTRO,
              })
            }
          />
        ),
        () => <WorkbookPlanSituation record={record} update={update} />,
        () => <WorkbookPlanAction record={record} reader={picked ?? reader} update={update} />,
        () => <WorkbookPlanCriteria record={record} update={update} />,
        () => (
          <WorkbookAudienceRecap
            point={workbookProjectStep.audience}
            lines={LEARNED}
            reader={picked}
            audience={record.audience}
            situation={situation.filter((label): label is string => Boolean(label))}
            button={button?.label ?? ""}
            criteria={planLines(record.criteria)}
          />
        ),
      ]}
    />
  );
}

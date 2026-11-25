"use client";

// 2-3 무엇을 어떤 순서로: 담을 내용 고르기(지금 · 나중에) → 어떤 내용을 먼저(정보 구조) → 종이에 칸 그리기
// (와이어프레임) → 오늘 알게 된 것.
import { workbookProjectStep } from "@/lib/workbook-course";
import { layoutLabel } from "@/lib/workbook-plan-options";
import { planLines } from "@/lib/workbook-plan-readers";
import type { ProjectLessonProps } from "./WorkbookProjectLesson";
import { WorkbookPlanLessonFrame } from "./WorkbookPlanLessonFrame";
import { usePlanContext } from "./usePlanContext";
import { WorkbookPlanContent } from "./WorkbookPlanContent";
import { FOLD, WorkbookPlanOrder } from "./WorkbookPlanOrder";
import { WorkbookPlanSketch } from "./WorkbookPlanSketch";
import { WorkbookStructureRecap, type RecapLine } from "./WorkbookPlanRecaps";
import { FIRST_PAGE_TITLE } from "./WorkbookFileAsk";

const LEARNED: readonly RecapLine[] = [
  {
    term: "지금 소개할 수 있는 내용만 넣어요",
    text: "아직 없는 내용은 나중에 채울 칸으로 남겨 두고, 지어서 채우지 않아요.",
  },
  {
    term: "중요한 내용은 위쪽에 둬요",
    text: "휴대폰은 처음에 화면 한 장만큼만 보여요. 이렇게 순서와 자리를 정하는 일을 정보 구조라고 해요.",
  },
  {
    term: "칸만 그려 배치를 정해요",
    text: "만들기 전에 상자만 그린 그림을 와이어프레임이라고 해요. 빠르게 여러 번 바꿔 볼 수 있어요.",
  },
];

export function WorkbookStructureLesson({ onBack, onStep }: ProjectLessonProps) {
  const { record, reader, button, update } = usePlanContext();
  return (
    <WorkbookPlanLessonFrame
      point={workbookProjectStep.structure}
      onBack={onBack}
      onStep={onStep}
      goal={{
        title: "넣을 내용을 고르고 순서와 배치 정하기",
        text: "지난 수업에서 고른 읽을 사람과 레퍼런스를 떠올리며 골라요.",
        note: "정한 순서와 배치는 요청에 그대로 들어가요.",
      }}
      screens={[
        () => <WorkbookPlanContent record={record} reader={reader} update={update} />,
        () => <WorkbookPlanOrder record={record} reader={reader} button={button} update={update} />,
        () => <WorkbookPlanSketch record={record} update={update} />,
        () => (
          <WorkbookStructureRecap
            point={workbookProjectStep.structure}
            lines={LEARNED}
            title={record.title.trim() || FIRST_PAGE_TITLE}
            content={planLines(record.content)}
            later={planLines(record.later)}
            layout={record.layout}
            layoutLabel={layoutLabel(record.layout) ?? ""}
            fold={FOLD}
          />
        ),
      ]}
    />
  );
}

"use client";

// 2-4 기획서 한 장 만들기: 제목과 버튼 문구 → 분위기 → AI에게 기획을 질문해 달라고 하기(그릴링 · 스킬 소개)
// → 기획서 한 장(설계도 + 오늘 알게 된 것). 기획 칸이 비어 있으면 다음 수업 대신 채우러 갈 곳을 알려 준다.
import { useRef } from "react";
import { workbookCourse, workbookProjectStep } from "@/lib/workbook-course";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import { ASK_INTRO } from "@/lib/workbook-plan-readers";
import type { ProjectLessonProps } from "./WorkbookProjectLesson";
import { WorkbookPlanLessonFrame } from "./WorkbookPlanLessonFrame";
import { usePlanContext } from "./usePlanContext";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { WorkbookPlanSign } from "./WorkbookPlanSign";
import { WorkbookPlanMood } from "./WorkbookPlanMood";
import { WorkbookPlanGrill } from "./WorkbookPlanGrill";
import { WorkbookPlanRecap, type PlanBlank } from "./WorkbookPlanRecap";

export function WorkbookBriefLesson({ onBack, onStep }: ProjectLessonProps) {
  const { record, picked, reader, firstIntro, button, update } = usePlanContext();
  const [asked, setAsked] = useWorkbookLessonState("plan-brief-asked", false);
  const { setLessonUi } = useWorkbookProgress();
  const blanksRef = useRef<HTMLDivElement>(null);
  const S = workbookProjectStep;
  const blanks: PlanBlank[] = [
    { label: "읽을 사람", step: S.audience, screen: 0, empty: !record.audience.trim() },
    { label: "맨 아래 버튼", step: S.audience, screen: 2, empty: !record.purpose.trim() },
    { label: "넣을 내용", step: S.structure, screen: 0, empty: !record.content.trim() },
    { label: "제목", step: S.brief, screen: 0, empty: !record.title.trim() },
  ]
    .filter((blank) => blank.empty)
    .map(({ label, step, screen }) => ({ label, step, screen }));

  return (
    <WorkbookPlanLessonFrame
      point={S.brief}
      onBack={onBack}
      onStep={onStep}
      goal={{
        title: "제목 · 버튼 문구 · 분위기를 정하고 기획을 한 장으로 모으기",
        text: "기획 네 수업에서 정한 것이 기획서 한 장에 모여요.",
        note: "이 기획서로 다음 수업에서 요청을 만들어요.",
      }}
      blocked={
        blanks.length > 0
          ? { label: "빈 칸을 채워야 넘어갈 수 있어요", short: "빈 칸 먼저 채우기" }
          : undefined
      }
      beforeFinish={() => {
        if (blanks.length > 0) {
          setAsked(true);
          requestAnimationFrame(() => blanksRef.current?.focus());
          return false;
        }
        // 소개 글이 없으면 요청에서 AI가 묻게 한다.
        if (!record.intro.trim()) update({ intro: firstIntro || ASK_INTRO });
        return true;
      }}
      screens={[
        () => (
          <WorkbookPlanSign
            reader={reader}
            title={record.title}
            button={button}
            label={record.buttonLabel}
            onTitle={(title) => update({ title })}
            onLabel={(buttonLabel) => update({ buttonLabel })}
          />
        ),
        () => <WorkbookPlanMood record={record} update={update} />,
        () => <WorkbookPlanGrill record={record} />,
        () => (
          <WorkbookPlanRecap
            record={record}
            reader={picked}
            button={button}
            blanks={blanks}
            blanksRef={blanksRef}
            asked={asked}
            onJump={(blank) => {
              // 그 수업의 해당 화면으로 바로 연다(화면 위치는 수업별 lessonUi에 있다).
              const slug = workbookCourse[1].lessons[blank.step].slug;
              setLessonUi((previous) => ({ ...previous, [`plan-${slug}-screen`]: blank.screen }));
              if (blank.step !== S.brief) onStep(blank.step);
            }}
            update={update}
          />
        ),
      ]}
    />
  );
}

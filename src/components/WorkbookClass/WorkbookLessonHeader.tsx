import type { Ref } from "react";
import { getWorkbookUnit } from "@/lib/workbook-course";
import type { PracticalStage } from "@/lib/workbook-practical-labs";
import { usePublishLessonStep } from "./WorkbookLessonSteps";
import system from "./WorkbookLesson.module.scss";

export function WorkbookLessonHeader({
  stage,
  point = 0,
  headingRef,
  headingId,
  onBack,
  current = 1,
  total = 1,
  optional = false,
}: {
  stage: PracticalStage;
  point?: number;
  headingRef?: Ref<HTMLHeadingElement>;
  headingId?: string;
  onBack: () => void;
  current?: number;
  total?: number;
  optional?: boolean;
}) {
  const unit = getWorkbookUnit(stage);
  const lesson = unit.lessons[point];
  // 화면 위치는 하단 바의 점과 "n / N"이 보여준다.
  usePublishLessonStep(current, total, !optional);
  return (
    <header className={system.lessonHeader} data-lesson-header>
      <div className={system.headerIdentity}>
        <span className={system.coursePosition} aria-label="전체 과정 위치">
          {unit.number}단원 {unit.title} › {optional ? "선택 심화" : lesson.number}
        </span>
        <h1 ref={headingRef} id={headingId} tabIndex={-1}>
          {optional ? unit.optionalTitle : lesson.title}
        </h1>
      </div>
      <div className={system.headerActions}>
        {optional && <small className={system.lessonProgress}>선택 과정 · 기본 수업과 별도</small>}
        <button onClick={onBack}>단원 지도 보기</button>
      </div>
    </header>
  );
}

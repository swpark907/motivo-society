"use client";

import { useContext, type ReactNode } from "react";
import { WorkbookLessonCoverContext } from "./WorkbookLessonCover";
import { WorkbookLessonStepBar } from "./WorkbookLessonSteps";

// 첫 설명의 이전 조작만 표지로 연결한다. 이후 설명의 기존 이전 동작은 그대로 둔다.
// 이전 버튼 뒤에 공통 하단 바(단계 점·막힘 안내·키보드)를 붙여, 이전과 다음 사이에 놓이게 한다.
export function WorkbookLessonPrevious({
  current,
  children,
}: {
  current: number;
  children: ReactNode;
}) {
  const returnToCover = useContext(WorkbookLessonCoverContext);
  return (
    <>
      {current === 1 && returnToCover ? (
        <button type="button" data-action-role="lesson-back" onClick={returnToCover}>
          ← 표지로
        </button>
      ) : (
        children
      )}
      <WorkbookLessonStepBar />
    </>
  );
}

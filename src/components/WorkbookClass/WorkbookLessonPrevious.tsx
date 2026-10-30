"use client";

import { useContext, type ReactNode } from "react";
import { WorkbookLessonCoverContext } from "./WorkbookLessonCover";

// 첫 설명의 이전 조작만 표지로 연결한다. 이후 설명의 기존 이전 동작은 그대로 둔다.
export function WorkbookLessonPrevious({
  current,
  children,
}: {
  current: number;
  children: ReactNode;
}) {
  const returnToCover = useContext(WorkbookLessonCoverContext);
  if (current === 1 && returnToCover)
    return (
      <button type="button" data-action-role="lesson-back" onClick={returnToCover}>
        이전 설명
      </button>
    );
  return children;
}

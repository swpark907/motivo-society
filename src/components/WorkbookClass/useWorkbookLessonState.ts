import { useState, type Dispatch, type SetStateAction } from "react";
import { useWorkbookProgress } from "./WorkbookProgressContext";

// 방문 중의 설명 위치와 예시 조작만 보관한다. 새로고침 영속 저장은 하지 않는다.
export function useWorkbookLessonState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const { lessonUi, setLessonUi } = useWorkbookProgress();
  const [fallback] = useState(initial);
  const value = (key in lessonUi ? lessonUi[key] : fallback) as T;
  const setValue: Dispatch<SetStateAction<T>> = (action) => {
    setLessonUi((previous) => ({
      ...previous,
      [key]:
        typeof action === "function"
          ? (action as (value: T) => T)((key in previous ? previous[key] : fallback) as T)
          : action,
    }));
  };
  return [value, setValue];
}

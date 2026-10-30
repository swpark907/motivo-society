"use client";

import { WorkbookLessonHeader } from "./WorkbookLessonHeader";

// 곁길에서 같은 선택 활동을 독립적으로 열고 원래 지도에 돌아온다.
import { useEffect, useRef } from "react";
import { type PracticalStage } from "@/lib/workbook-practical-labs";
import { WorkbookPracticalLab } from "./WorkbookPracticalLab";
import styles from "./WorkbookLesson.module.scss";

export function WorkbookPracticalLesson({
  stage,
  onBack,
}: {
  stage: PracticalStage;
  onBack: () => void;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus();
  }, []);
  return (
    <section className={styles.lesson} aria-label="선택 심화 수업">
      <WorkbookLessonHeader stage={stage} headingRef={title} onBack={onBack} optional />
      <div className={styles.lessonBody} tabIndex={0} aria-label="수업 내용">
        <WorkbookPracticalLab stage={stage} standalone />
      </div>
      <aside className={styles.lessonPanel} aria-label="심화 학습 안내">
        <div className={styles.panelNotes}>
          <p>세 상황 중 필요한 것을 골라 요청과 확인 기준을 비교해요.</p>
          <p>살펴본 선택은 방문 중 유지돼요. 실제 AI 실행이나 파일 작업 완료를 뜻하지 않아요.</p>
        </div>
        <nav className={styles.lessonNavigation} aria-label="심화 수업 진행">
          <button onClick={onBack}>같은 지도로 돌아가기 →</button>
        </nav>
      </aside>
    </section>
  );
}

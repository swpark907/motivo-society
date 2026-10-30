"use client";
import { getWorkbookCourseLesson } from "@/lib/workbook-course";
import { WorkbookMapLessonCard } from "./WorkbookMapLessonCard";

// 지도 지점은 기존 수업 단계로 바로 연결한다. 입력과 위치는 방문 context가 소유한다.
import Image from "next/image";
import { WorkbookPracticalPoint } from "./WorkbookPracticalPoint";
import { WorkbookMapTopics } from "./WorkbookMapTopics";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { publishProgress } from "@/lib/workbook-publish";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookMap.module.scss";

const stops = [
  {
    x: 21,
    y: 64,

    task: "두 화면에서 읽고 버튼과 공개할 내용을 확인해요.",
  },
  {
    x: 51,
    y: 39,

    task: "내 컴퓨터 주소와 친구가 읽을 공개 주소를 구분해요.",
  },
  {
    x: 79,
    y: 70,

    task: "문제를 재현하고 수정 요청과 전후 확인을 기록해요.",
  },
].map((stop, point) => ({
  ...stop,
  name: getWorkbookCourseLesson("publish", point).title,
  number: getWorkbookCourseLesson("publish", point).number,
}));
export function WorkbookPublishMap({
  onEnter,
  panelTarget,
  onPractical,
}: {
  onEnter: (step: number) => void;
  onPractical?: () => void;
  panelTarget?: HTMLElement | null;
}) {
  const { publish, publishCompleted, publishStop } = useWorkbookProgress();
  const progress = publishProgress(publish);
  const done = [progress.inspected, progress.addressed, publishCompleted];
  const available = progress.available;
  const next = done.findIndex((value) => !value);
  const [selected, setSelected] = useState<number | null>(publishStop);
  const [practicalSelected, setPracticalSelected] = useWorkbookLessonState(
    "map-practical-publish",
    false,
  );
  const pointButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const startButton = useRef<HTMLButtonElement>(null);
  const current = stops[publishStop];
  const selectedStep = selected !== null && available[selected] ? selected : publishStop;
  const renderPanel = (content: ReactNode) =>
    panelTarget ? createPortal(content, panelTarget) : content;
  return (
    <div className={styles.wrapper}>
      <div className={styles.mapViewport}>
        <div className={styles.map} role="region" tabIndex={0} aria-label="배포하고 고치기 지도">
          <div className={styles.canvas}>
            <Image
              src="/images/workbook/journey/publish-harbour-v1.png"
              alt="바닷가 항구의 점검 회관·발송소·수리 공방을 돌길로 잇는 공개 마을"
              width={1536}
              height={1024}
              sizes="(min-width: 1024px) 75vw, 100vw"
            />
            <svg
              className={styles.routeGuide}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
              data-motion={false}
            >
              <polyline points="21,64 32,61 38,55 35,47 32,41 40,38 51,39" data-next={next === 1} />
              <polyline points="51,39 60,45 67,49 71,56 66,61 70,67 79,70" data-next={next === 2} />
            </svg>
            <span
              className={styles.avatar}
              style={{ left: `${current.x}%`, top: `calc(${current.y}% - var(--space-4))` }}
              aria-hidden="true"
            />
            {onPractical && (
              <WorkbookPracticalPoint
                stage="publish"
                available={progress.addressed}
                selected={practicalSelected}
                onSelect={() => {
                  setSelected(3);
                  setPracticalSelected(true);
                }}

                onEnter={onPractical}
                panelTarget={panelTarget}
              />
            )}
            {stops.map((stop, index) => (
              <button
                key={stop.name}
                ref={(element) => {
                  pointButtons.current[index] = element;
                }}
                className={styles.point}
                data-next={next === index}
                aria-current={publishStop === index ? "step" : undefined}
                aria-label={`${stop.number} ${stop.name}${available[index] ? " 선택" : index === 1 ? " · 공개 전 두 화면과 버튼·공개할 내용을 먼저 확인해요" : " · 주소와 친구 접속 예시를 먼저 확인해요"}`}
                disabled={!available[index]}
                style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
                onClick={() => {
                  setPracticalSelected(false);
                  setSelected(index);
                  requestAnimationFrame(() => startButton.current?.focus());
                }}
              >
                <span aria-hidden="true">{stop.number}</span>
                <strong>
                  {stop.name}
                  {done[index] && <small>학습 확인</small>}
                  {next === index && <em>다음 목표</em>}
                </strong>
              </button>
            ))}
          </div>
        </div>
      </div>
      {renderPanel(
        <div className={styles.mapPanel}>
          <WorkbookMapLessonCard
            completed={done[selectedStep]}
            hidden={selected === null || practicalSelected}
            title={stops[selectedStep].name}
            meta={`${stops[selectedStep].number} · ${done[selectedStep] ? "학습 확인" : selectedStep === next ? "다음 수업" : "선택한 수업"}`}
            description={stops[selectedStep].task}
            startRef={startButton}
            disabled={!available[selectedStep]}
            onStart={() => onEnter(selectedStep)}
          >
            <WorkbookMapTopics stage="publish" point={selectedStep} />
          </WorkbookMapLessonCard>
        </div>,
      )}
    </div>
  );
}

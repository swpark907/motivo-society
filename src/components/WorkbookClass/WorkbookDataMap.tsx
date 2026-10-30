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
import { dataProgress } from "@/lib/workbook-data";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookMap.module.scss";

const stops = [
  {
    x: 22,
    y: 67,

    task: "한 줄을 입력하고 버튼이 화면을 바꾸는지 확인해요.",
  },
  {
    x: 50,
    y: 29,

    task: "저장 전후 다시 여는 예시에서 같은 글이 남는지 비교해요.",
  },
  {
    x: 79,
    y: 70,

    task: "다른 기기의 예시를 보고 함께 읽기에 필요한 것을 판단해요.",
  },
].map((stop, point) => ({
  ...stop,
  name: getWorkbookCourseLesson("data", point).title,
  number: getWorkbookCourseLesson("data", point).number,
}));
export function WorkbookDataMap({
  onEnter,
  panelTarget,
  onPractical,
}: {
  onEnter: (step: number) => void;
  onPractical?: () => void;
  panelTarget?: HTMLElement | null;
}) {
  const { data, dataCompleted, dataStop } = useWorkbookProgress();
  const progress = dataProgress(data);
  const done = [progress.displayed, progress.stored, dataCompleted];
  const available = progress.available;
  const next = done.findIndex((value) => !value);
  const [selected, setSelected] = useState<number | null>(dataStop);
  const [practicalSelected, setPracticalSelected] = useWorkbookLessonState(
    "map-practical-data",
    false,
  );
  const pointButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const startButton = useRef<HTMLButtonElement>(null);
  const current = stops[dataStop];
  const selectedStep = selected !== null && available[selected] ? selected : dataStop;
  const renderPanel = (content: ReactNode) =>
    panelTarget ? createPortal(content, panelTarget) : content;
  return (
    <div className={styles.wrapper}>
      <div className={styles.mapViewport}>
        <div className={styles.map} role="region" tabIndex={0} aria-label="기능과 데이터 저장 지도">
          <div className={styles.canvas}>
            <Image
              src="/images/workbook/journey/data-alpine-archive-v1.png"
              alt="높은 산과 침엽수 숲 사이 입력 작업실·기록 창고·연결 관측소를 잇는 데이터 마을"
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
              <polyline
                points="22,67 32,65 38,59 33,54 27,50 30,43 34,37 39,30 50,29"
                data-next={next === 1}
              />
              <polyline
                points="50,29 61,35 66,41 72,47 77,51 73,57 70,64 79,70"
                data-next={next === 2}
              />
            </svg>
            <span
              className={styles.avatar}
              style={{ left: `${current.x}%`, top: `calc(${current.y}% - var(--space-4))` }}
              aria-hidden="true"
            />
            {onPractical && (
              <WorkbookPracticalPoint
                stage="data"
                available={progress.stored}
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
                aria-current={dataStop === index ? "step" : undefined}
                aria-label={`${stop.number} ${stop.name}${available[index] ? " 선택" : index === 1 ? " · 메모를 입력하고 표시해요" : " · 저장 전후 새로고침을 먼저 비교해요"}`}
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
            <WorkbookMapTopics stage="data" point={selectedStep} />
          </WorkbookMapLessonCard>
        </div>,
      )}
    </div>
  );
}

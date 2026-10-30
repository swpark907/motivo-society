"use client";

// 고정된 학습 항목의 상세 표시만 바꾼다. 실제 프로젝트 파일이나 저장소에는 쓰지 않는다.
import { useId, useRef } from "react";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import system from "./WorkbookLesson.module.scss";
import styles from "./WorkbookClass.module.scss";
const items = [
  { name: "소개 페이지", detail: "목적·독자·주요 내용을 한 페이지에 배치한 작업이에요." },
  {
    name: "화면 개선 기록",
    detail: "PC·모바일을 비교하고 가독성과 목록 간격을 판단한 작업이에요.",
  },
];
export function WorkbookDetailExample({ appearance }: { appearance?: "lesson" }) {
  const lesson = appearance === "lesson";
  const [selected, setSelected] = useWorkbookLessonState<number | null>(
    "data-detail-example",
    null,
  );
  const id = useId();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  return (
    <section
      className={lesson ? system.practiceStage : styles.purposeConnection}
      aria-label="항목 상세 보기 학습 예시"
    >
      <h3>항목을 고르면 그 항목의 설명이 보여요</h3>
      <p>
        클릭이나 Enter·Space 같은 <strong>이벤트</strong>가 일어나면 선택한 항목을{" "}
        <strong>상태</strong>로 기억하고, JavaScript가 보여줄 설명을 바꿀 수 있어요. 표시와 저장은
        별도예요.
      </p>
      <div className={lesson ? system.choices : styles.choices}>
        {items.map((item, i) => (
          <button
            ref={(el) => {
              buttons.current[i] = el;
            }}
            className={lesson ? system.choice : styles.choice}
            key={item.name}
            aria-pressed={selected === i}
            aria-expanded={selected === i}
            aria-controls={id}
            onClick={() => setSelected(i)}
          >
            {item.name} · 예시 상세 보기
          </button>
        ))}
      </div>
      <div id={id} aria-live="polite">
        {selected !== null && (
          <>
            <h4>{items[selected].name}</h4>
            <p>{items[selected].detail}</p>
            <button
              className={styles.quiet}
              onClick={() => {
                const previous = selected;
                setSelected(null);
                buttons.current[previous]?.focus();
              }}
            >
              예시 상세 닫기
            </button>
          </>
        )}
      </div>
      <small>준비된 학습 예시 · 자기 파일의 동작·실제 저장 결과가 아니에요</small>
    </section>
  );
}

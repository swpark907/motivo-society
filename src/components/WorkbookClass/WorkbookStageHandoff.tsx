import { workbookCourse } from "@/lib/workbook-course";
import styles from "./WorkbookMapPanel.module.scss";

// 학습 완료와 다음 진입을 함께 보여준다. 실제 파일/공개 완료 표시는 아니다.
export function WorkbookStageHandoff({
  unit,
  nextLesson,
  nextAvailable = true,
  requiredTitle,
  onRequired,
  onStart,
  onMap,
  onSummary,
}: {
  unit: number;
  nextLesson?: number;
  nextAvailable?: boolean;
  requiredTitle?: string;
  onRequired: () => void;
  onStart: () => void;
  onMap: () => void;
  onSummary: () => void;
}) {
  const current = workbookCourse[unit - 1];
  const next = workbookCourse[unit];
  const lesson = next?.lessons[nextLesson ?? 0];
  return (
    <section className={styles.lessonCard} aria-label="단원 학습 완료와 다음 학습">
      <div className={styles.cardHeader}>
        <small>{current.number}단원 학습을 마쳤어요</small>
      </div>
      <h2 className={styles.title}>
        {!nextAvailable
          ? "앞선 학습을 먼저 이어가요"
          : next
            ? `다음은 ${next.number}단원 · ${next.title}`
            : "배운 내용과 내 프로젝트를 정리해요"}
      </h2>
      <p className={styles.description}>
        {!nextAvailable
          ? "남긴 기록은 보존돼요. 다음 단원으로 가기 전에 먼저 할 학습을 확인해요."
          : next
            ? `${current.title}에서 배운 내용을 이어서 다음 수업을 시작해요. 지도는 필요할 때 살펴볼 수 있어요.`
            : "기본 학습과 직접 확인한 프로젝트 결과, 아직 남은 일을 나눠 봐요."}
      </p>
      <button
        className={styles.start}
        onClick={!nextAvailable ? onRequired : next ? onStart : onSummary}
      >
        {!nextAvailable
          ? `${requiredTitle ?? "먼저 할 학습"} 이어가기 →`
          : lesson
            ? `${lesson.number} ${lesson.title} 시작 →`
            : "클래스 학습 정리 보기 →"}
      </button>
      {next && nextAvailable && (
        <button className={styles.nextShortcut} onClick={onMap}>
          {next.number}단원 지도 먼저 보기
        </button>
      )}
    </section>
  );
}

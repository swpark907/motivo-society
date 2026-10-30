import { useWorkbookProgress } from "./WorkbookProgressContext";
import { WorkbookApplicationRecord } from "./WorkbookApplicationRecord";
import styles from "./WorkbookLesson.module.scss";

// 추가 실습과 과거 기록은 기본 학습의 완료·다음 단계 조건에 연결하지 않는다.
export function WorkbookOptionalPractice({
  stage,
  className,
}: {
  stage: "experience" | "data";
  className?: string;
}) {
  const p = useWorkbookProgress();
  const previous =
    stage === "experience"
      ? [
          p.experience.own?.observation,
          p.experience.own?.reason,
          p.experience.own?.request,
          p.experience.own?.comparison,
        ]
      : [
          p.data.own?.details.reason,
          p.data.own?.details.request,
          p.data.own?.details.result,
          p.data.own?.storage.reason,
          p.data.own?.storage.request,
          p.data.own?.storage.result,
          p.data.own?.scopeReason,
        ];
  const confirmations = Object.entries(p.projectWorkflow.checkpoints)
    .filter(([key]) => key.startsWith(`${stage}.`))
    .map(([, value]) => value.confirmation?.evidence);
  const notes = [
    ...new Set([...previous, ...confirmations].filter((value): value is string => !!value?.trim())),
  ];
  return (
    <details className={className ?? styles.preparationMore}>
      <summary>선택 · 내 파일에서 더 해보기</summary>
      <p>
        이 내용은 선택 실습이에요. 읽거나 기록하지 않아도 기본 수업을 마치고 다음으로 갈 수 있어요.
      </p>
      {stage === "experience" ? (
        <p>
          앞에서 만든 같은 index.html을 PC·모바일 폭에서 살펴보세요. 불편한 곳이 있으면 중요한 한두
          곳만 수정해도 좋아요. 이미 읽기 좋다면 그대로 두면 돼요.
        </p>
      ) : (
        <>
          <p>
            항목마다 긴 설명이 있다면 선택해서 자세히 보는 동작을 더해볼 수 있어요. 짧은 내용은 지금
            목록만으로도 충분해요.
          </p>
          <p>
            재방문 때 다시 찾을 관심 선택이 있을 때만 브라우저 저장을 시도해보세요. 저장했다면
            추가·해제 뒤 내 사이트 탭을 새로고침해 확인해요. 다른 기기로 자동 동기화되지는 않아요.
          </p>
        </>
      )}
      <WorkbookApplicationRecord stage={stage} />
      {notes.length > 0 && (
        <details className={styles.preparationMore}>
          <summary>보존한 이전 추가 실습 기록</summary>
          {notes.map((text, index) => (
            <p className={styles.aiCodeNote} key={index}>
              {text}
            </p>
          ))}
        </details>
      )}
    </details>
  );
}

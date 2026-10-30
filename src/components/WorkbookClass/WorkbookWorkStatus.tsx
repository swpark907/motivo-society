import { applicationProgress } from "@/lib/workbook-application";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookClass.module.scss";

export function WorkbookWorkStatus() {
  const p = useWorkbookProgress();
  const applied = applicationProgress(p.applications);
  const learned = [
    p.projectCompleted,
    p.experienceCompleted,
    p.dataCompleted,
    p.publishCompleted,
  ].filter(Boolean).length;
  return (
    <dl className={styles.workStatus} aria-label="배움과 내 파일 적용 상태">
      <div>
        <dt>워크북에서 배운 것</dt>
        <dd>
          <strong>제작 {learned}/4단원</strong>
          <span>AI 도구 준비하기 {p.completed.length}/5수업</span>
        </dd>
      </div>
      <div>
        <dt>내 파일 적용 기록</dt>
        <dd>
          <strong>{applied.confirmed.length}/4단원 확인</strong>
          <span>직접 확인한 본인 기록</span>
        </dd>
      </div>
      <div>
        <dt>아직 남은 확인</dt>
        <dd>
          <strong>
            {applied.pending.length
              ? `${applied.pending.length}단원 적용 확인`
              : "남긴 문제·다음 개선"}
          </strong>
          <span>
            {applied.pending.length ? "예시 완료와 별개 · 선택" : "작성한 기록을 다시 살펴봐요"}
          </span>
        </dd>
      </div>
    </dl>
  );
}

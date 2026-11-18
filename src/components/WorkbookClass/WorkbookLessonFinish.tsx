"use client";

// 수업 정리 화면의 하단 버튼. 모든 수업이 같은 방식으로 넘어간다(2026-11-18 승우 결정 "합친 방식"):
// 주 버튼은 다음 수업(단원 마지막 수업이면 다음 단원)으로 바로 가고, 옆의 작은 "단원 지도로"는 지도로 간다.
// 두 버튼 모두 누르는 순간 이 수업을 마친 것으로 기록하는 일은 부르는 쪽(onNext·onMap)이 한다.

/** 이전 버튼·단계 점 뒤에 놓는다. 지도 버튼이 없으면 주 버튼 하나만 그린다. */
export function WorkbookLessonFinish({
  label,
  shortLabel,
  ariaLabel,
  onNext,
  onMap,
}: {
  label: string;
  /** 좁은 화면에서 대신 보일 짧은 문구. 읽기 도구에는 ariaLabel(없으면 label)이 읽힌다. */
  shortLabel?: string;
  ariaLabel?: string;
  onNext: () => void;
  onMap?: () => void;
}) {
  return (
    <>
      {onMap && (
        <button type="button" data-action-role="lesson-map" onClick={onMap}>
          단원 지도로
        </button>
      )}
      <button
        type="button"
        data-action-role="lesson-next"
        aria-label={ariaLabel ?? (shortLabel ? label : undefined)}
        onClick={onNext}
      >
        {shortLabel ? (
          <>
            <span data-finish-label="long">{label}</span>
            <span data-finish-label="short" aria-hidden="true">
              {shortLabel}
            </span>
          </>
        ) : (
          label
        )}
      </button>
    </>
  );
}

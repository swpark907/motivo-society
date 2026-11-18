import { workbookLessonId } from "@/lib/workbook-course";
import type { CheckpointKey } from "@/lib/workbook-project-progress";
import { emptyPractice, type PracticeRecord } from "./WorkbookPracticeLesson";
import { useWorkbookProgress } from "./WorkbookProgressContext";

/** The three things the learner does on their own computer in "첫 코드 만들기", in order. */
export const FIRST_FILE_CHECKS = ["파일이 만들어졌어요", "화면을 봤어요", "고친 화면을 봤어요"];

/** The real-file checkpoints each stamp stands for (the next unit reads these). */
const STAMP_CHECKPOINTS: readonly (readonly CheckpointKey[])[] = [
  ["setup.folder", "setup.file"],
  ["setup.opened"],
  ["setup.changed"],
];

/**
 * The practice record of "첫 코드 만들기", shared by its screens. Stamps are the learner's own
 * word (nothing checks their computer). Any stamp marks the lesson as done on a computer; removing
 * the last one takes that back.
 */
export function useFirstFilePractice() {
  const { practice, setPractice, projectWorkflow, dispatchProjectWorkflow } = useWorkbookProgress();
  const record = practice[workbookLessonId.firstFile] ?? emptyPractice();

  function update(change: (current: PracticeRecord) => PracticeRecord) {
    setPractice((previous) => ({
      ...previous,
      [workbookLessonId.firstFile]: change(previous[workbookLessonId.firstFile] ?? emptyPractice()),
    }));
  }
  function save(patch: Partial<PracticeRecord>) {
    update((current) => ({ ...current, ...patch }));
  }
  function toggleCheck(index: number) {
    // 최신 기록에서 계산한다(연달아 눌러도 앞의 변경을 덮어쓰지 않게).
    update((current) => {
      const checks = current.checks.map((value, at) => (at === index ? !value : value));
      const mode = checks.some(Boolean)
        ? "computer"
        : current.mode === "computer"
          ? null
          : current.mode;
      return { ...current, checks, mode };
    });
    // 이미 확인됨으로 남은 실제 파일 기록은 도장을 지우는 즉시 "시도함"으로 낮춘다.
    if (record.checks[index]) {
      for (const key of STAMP_CHECKPOINTS[index]) {
        const checkpoint = projectWorkflow.checkpoints[key];
        if (checkpoint.outcome !== "confirmed") continue;
        dispatchProjectWorkflow({
          type: "record",
          key,
          outcome: "attempted",
          evidence: checkpoint.evidence,
          projectId: projectWorkflow.projectId,
          revision: checkpoint.revision,
        });
      }
    }
  }
  return { record, save, toggleCheck };
}

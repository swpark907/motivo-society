"use client";

// 2-1 홈페이지 기획하기: 쓰지 않고 고른다(2026-11-18 승우: 입력 칸을 줄이고 톡톡 튀는 표현으로).
// 같은 페이지, 다른 눈(읽을 사람) → 간판과 출구(제목 스티커·맨 아래 버튼) → 지금과 나중(카드 분류)
// → 위에서부터(정보 구조) → AI에게 캐물어 달라고 하기(그릴링·스킬 소개) → 오늘 알게 된 것 + 설계도.
// 고른 것은 기획 칸(읽을 사람·목적·제목·소개·내용·나중에)에 들어가 2-2·2-3과 3단원 이후가 같은 이름으로 읽는다.
// 카드는 담을 것의 "종류"이고, 실제 내용은 2-2의 요청에서 AI가 학습자에게 물어보며 채운다.
// 다음 버튼은 막지 않는다. 빈 조각은 정리 화면에서 이름을 대고, 2-2로 가기 전에 고르러 가게 한다.
import { useCallback, useEffect, useRef } from "react";
import {
  ASK_INTRO,
  findPlanButton,
  planReaders,
  type PlanReader,
} from "@/lib/workbook-plan-readers";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";
import type { ProjectLessonProps, ProjectRecord } from "./WorkbookProjectLesson";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import { FIRST_INTRO_NOTE, FIRST_PAGE_TITLE } from "./WorkbookFileAsk";
import { WorkbookPlanReaders } from "./WorkbookPlanReaders";
import { WorkbookPlanSign } from "./WorkbookPlanSign";
import { WorkbookPlanOrder } from "./WorkbookPlanOrder";
import { WorkbookPlanGrill } from "./WorkbookPlanGrill";
import { WorkbookLessonFinish } from "./WorkbookLessonFinish";
import { workbookCourse } from "@/lib/workbook-course";
import { WorkbookPlanContent } from "./WorkbookPlanContent";
import { WorkbookPlanRecap, type PlanBlank } from "./WorkbookPlanRecap";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const LAST = 5;
const nextLesson = workbookCourse[1].lessons[1];

export function WorkbookPlanningLesson({ record, onBack, onStep }: ProjectLessonProps) {
  const p = useWorkbookProgress();
  const [screen, setScreen] = useWorkbookLessonState("planning-screen", 0);
  const [asked, setAsked] = useWorkbookLessonState("plan-asked", false);
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const blanksRef = useRef<HTMLDivElement>(null);
  const safeScreen = Math.min(screen, LAST);
  const firstIntro = p.projectWorkflow.notes[FIRST_INTRO_NOTE]?.text ?? "";
  // 읽을 사람은 기록(읽을 사람 칸)에서 되찾는다. 화면 상태에 따로 두지 않아 계정 기록만으로 복원된다.
  const picked = planReaders.find((reader) => reader.audience === record.audience) ?? null;
  // 앞 화면을 건너뛰어도 뒤 화면이 비지 않게, 처음 고른 목적 → 첫 사람 순으로 대신 쓴다.
  const reader: PlanReader =
    picked ?? planReaders.find((item) => item.id === p.purpose) ?? planReaders[0];
  const button = findPlanButton(record.purpose);
  const blanks: PlanBlank[] = [
    { label: "읽을 사람", screen: 0, empty: !record.audience.trim() },
    { label: "제목", screen: 1, empty: !record.title.trim() },
    { label: "맨 아래 버튼", screen: 1, empty: !record.purpose.trim() },
    { label: "넣을 내용", screen: 2, empty: !record.content.trim() },
  ]
    .filter((blank) => blank.empty)
    .map(({ label, screen: at }) => ({ label, screen: at }));

  // 기획이 바뀌면 2-3의 확인 표시는 다시 해야 하므로 지운다(예전 2-1과 같은 규칙).
  const { setProject } = p;
  const update = useCallback(
    (patch: Partial<ProjectRecord>) =>
      setProject((current) =>
        Object.entries(patch).every(([key, value]) => current[key as keyof ProjectRecord] === value)
          ? current
          : { ...current, ...patch, checks: [false, false, false], previewConfirmed: false },
      ),
    [setProject],
  );

  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [safeScreen]);
  function move(next: number) {
    setScreen(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function toRequest() {
    if (blanks.length > 0) {
      setAsked(true);
      requestAnimationFrame(() => blanksRef.current?.focus());
      return;
    }
    // 소개 글이 없으면 요청에서 AI가 묻게 한다.
    if (!record.intro.trim()) update({ intro: firstIntro || ASK_INTRO });
    onStep(1);
  }

  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="project"
        point={0}
        headingRef={heading}
        onBack={onBack}
        current={safeScreen + 1}
        total={LAST + 1}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        {safeScreen === 0 && (
          <WorkbookPlanReaders
            pageTitle={FIRST_PAGE_TITLE}
            pageIntro={firstIntro}
            picked={picked}
            purposeId={p.purpose}
            onPick={(next) =>
              update({
                audience: next.audience,
                intro: record.intro.trim() ? record.intro : firstIntro || ASK_INTRO,
              })
            }
          />
        )}
        {safeScreen === 1 && (
          <WorkbookPlanSign
            reader={reader}
            title={record.title}
            button={button}
            onTitle={(title) => update({ title })}
            onButton={(next) => update({ purpose: next.purpose })}
          />
        )}
        {safeScreen === 2 && (
          <WorkbookPlanContent record={record} reader={reader} update={update} />
        )}
        {safeScreen === 3 && (
          <WorkbookPlanOrder record={record} reader={reader} button={button} update={update} />
        )}
        {safeScreen === 4 && <WorkbookPlanGrill record={record} />}
        {safeScreen === 5 && (
          <WorkbookPlanRecap
            record={record}
            reader={picked}
            button={button}
            blanks={blanks}
            blanksRef={blanksRef}
            asked={asked}
            onJump={move}
            update={update}
          />
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>누가 방문할지 정하고, 그에 맞게 페이지를 기획하기</h2>
          <p>1단원에서 만든 같은 폴더와 index.html을 이어서 써요.</p>
          <small>여기서 정한 기획으로 다음 수업에서 요청을 만들어요.</small>
        </div>
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={safeScreen + 1}>
            {safeScreen > 0 && (
              <button data-action-role="lesson-back" onClick={() => move(safeScreen - 1)}>
                이전 설명
              </button>
            )}
          </WorkbookLessonPrevious>
          {safeScreen < LAST ? (
            <button data-action-role="lesson-next" onClick={() => move(safeScreen + 1)}>
              다음으로
            </button>
          ) : (
            <WorkbookLessonFinish
              label={`다음: ${nextLesson.number} ${nextLesson.title} →`}
              shortLabel="다음 수업 →"
              ariaLabel={`다음 수업 ${nextLesson.number} ${nextLesson.title} 시작`}
              onNext={toRequest}
              onMap={onBack}
            />
          )}
        </nav>
      </aside>
    </section>
  );
}

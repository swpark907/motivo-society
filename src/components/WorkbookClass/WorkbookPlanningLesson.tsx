"use client";

import { workbookLessonLabel } from "@/lib/workbook-course";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";

// 기획은 첫 파일을 발전시킬 기준이다. 입력만으로 외부 파일을 바꾸거나 실제 결과를 확정하지 않는다.
import { useEffect, useId, useRef } from "react";
import { workbookPlanFields, workbookPlanExample } from "@/lib/workbook-page-plan";
import type { ProjectLessonProps, ProjectRecord } from "./WorkbookProjectLesson";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import { WorkbookActionReturn } from "./WorkbookActionReturn";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const screens = [
  ["첫 파일에서 이어가기", "새로 만들지 않고, 내 내용으로 발전시켜요"],
  ["읽을 사람과 목적", "누가 읽고, 무엇을 하면 좋을까요?"],
  ["제목과 소개", "첫 화면에서 주제가 보이게 써요"],
  ["담을 내용", "소개할 실제 내용을 모아요"],
  ["기획 정리", "이 기획으로 같은 파일을 고칠 거예요"],
];
type PlanKey = (typeof workbookPlanFields)[number][0];
const screenFields: PlanKey[][] = [
  [],
  ["audience", "purpose"],
  ["title", "intro"],
  ["content"],
  [],
];

export function WorkbookPlanningLesson({ record, onChange, onBack, onStep }: ProjectLessonProps) {
  const p = useWorkbookProgress();
  const [screen, setScreen] = useWorkbookLessonState("planning-screen", 0);
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const id = useId();
  const allReady = workbookPlanFields.every(([key]) => record[key].trim());
  const blocked =
    screen === 4 ? !allReady : screenFields[screen].some((key) => !record[key].trim());
  const firstIntro = p.projectWorkflow.notes["first-intro"]?.text ?? "";
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [screen]);
  function move(next: number) {
    setScreen(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function update(patch: Partial<ProjectRecord>) {
    if (Object.entries(patch).every(([key, value]) => record[key as keyof ProjectRecord] === value))
      return;
    onChange({ ...record, ...patch, checks: [false, false, false], previewConfirmed: false });
  }
  function fillExample() {
    update(
      Object.fromEntries(
        workbookPlanFields
          .filter(([key]) => !record[key].trim())
          .map(([key]) => [
            key,
            key === "intro" && firstIntro.trim() ? firstIntro : workbookPlanExample[key],
          ]),
      ),
    );
    requestAnimationFrame(() =>
      body.current?.querySelector<HTMLElement>("input, textarea")?.focus(),
    );
  }
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="project"
        point={0}
        headingRef={heading}
        onBack={onBack}
        current={screen + 1}
        total={5}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        <h2 className={system.screenTitle}>{screens[screen][1]}</h2>
        {screen === 0 && (
          <div className={system.aiConceptSlide}>
            <p>
              1-5 수업의 <strong>my-first-web/index.html</strong>을 그대로 이어가요.
              제목·소개·목록에 담을 내 내용을 먼저 정해요. 기획은 거창한 문서보다{" "}
              <strong>누가 읽고, 무엇을 알고, 어떤 행동을 할지</strong> 정하는 일에서 시작해요.
            </p>
            <p>
              설명에서는 ‘좋아하는 장소 세 곳을 소개하는 페이지’를 예로 들게요. 내 페이지는
              책·작업물·추천 도구처럼 다른 소재여도 괜찮아요. 이미 적은 기획도 그대로 이어가세요.
            </p>
            <table
              className={`${system.aiResultTable} ${system.aiCheckTable}`}
              aria-label="첫 파일에서 자기 기획으로"
            >
              <thead>
                <tr>
                  <th scope="col">1-5 수업에서 배운 것</th>
                  <th scope="col">이제 정할 것</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>파일을 만들고 화면 열기</td>
                  <td>누가 읽고 무엇을 할지</td>
                </tr>
                <tr>
                  <td>제목·소개·목록과 버튼 확인</td>
                  <td>그 자리에 넣을 내 실제 내용</td>
                </tr>
              </tbody>
            </table>
            <details className={system.preparationMore}>
              <summary>아직 첫 파일이 없어요</summary>
              <p>
                기획은 그대로 진행할 수 있어요. 실제 파일 작업은 1-5 수업에서 첫 파일을 만든 뒤
                이어가요. 뒤의 기획 미리보기는 실제 파일 제작과 구분해요.
              </p>
            </details>
          </div>
        )}
        {screen === 1 && (
          <section className={system.practiceStage} aria-label="대상과 목적 정하기">
            <p data-current-action tabIndex={-1}>
              읽을 사람 한 명과, 그 사람이 페이지에서 할 일 하나를 떠올려 적어주세요.
            </p>
            <p className={system.planningHint}>
              <strong>대상</strong>은 읽을 사람, <strong>목적</strong>은 읽은 뒤 하길 바라는
              일이에요.
            </p>
            <p>
              ‘카페를 좋아하는 사람’보다 ‘주말에 혼자 책 읽을 곳을 찾는 사람’을 떠올려보세요. ‘관심
              갖기’보다 ‘세 장소를 비교해 가볼 곳 고르기’로 정하면, 자리·소음·혼잡 시간처럼 무엇을
              소개할지 구체적이 됩니다.
            </p>
            {screenFields[screen].map((key) => {
              const field = workbookPlanFields.find(([name]) => name === key)!;
              return (
                <label className={system.practiceField} key={key} htmlFor={`${id}-${key}`}>
                  {field[1]}
                  <input
                    id={`${id}-${key}`}
                    value={record[key]}
                    onChange={(event) => update({ [key]: event.target.value })}
                    placeholder={workbookPlanExample[key]}
                  />
                </label>
              );
            })}
            {!allReady && (
              <div className={system.practiceActions}>
                <button onClick={fillExample}>빈 항목에 구성 예시 넣기</button>
              </div>
            )}
            <small>
              학습용 예시예요. 이미 작성한 항목은 유지하고 빈 곳만 채워요. 내 페이지에 맞게 바꿔도
              좋아요.
            </small>
          </section>
        )}
        {screen === 2 && (
          <section className={system.practiceStage} aria-label="제목과 소개 정하기">
            <p data-current-action tabIndex={-1}>
              무엇을 소개하는지 제목에, 어떤 내용이 있는지 첫 문장에 적어주세요.
            </p>
            <p>
              제목 ‘나의 취향’은 분위기는 있지만 주제를 짐작하기 어려워요. ‘혼자 책 읽기 좋았던 세
              곳’은 무엇을 소개하는지 보여줘요. 소개에 ‘자리와 소음을 기준으로 비교했어요’를 더하면{" "}
              <strong>읽어서 얻을 정보</strong>도 알 수 있습니다.
            </p>
            <label className={system.practiceField} htmlFor={`${id}-title`}>
              홈페이지 제목
              <input
                id={`${id}-title`}
                value={record.title}
                onChange={(event) => update({ title: event.target.value })}
                placeholder={workbookPlanExample.title}
              />
            </label>
            <label className={system.practiceField} htmlFor={`${id}-intro`}>
              첫 소개 문장
              <textarea
                id={`${id}-intro`}
                value={record.intro}
                onChange={(event) => update({ intro: event.target.value })}
                placeholder="직접 한 일이나 지금 소개할 사실을 한 문장으로 적어요."
              />
            </label>
            {!allReady && (
              <div className={system.practiceActions}>
                {firstIntro.trim() && !record.intro.trim() && (
                  <button onClick={() => update({ intro: firstIntro })}>
                    앞에서 확인한 소개 이어받기
                  </button>
                )}
                <button onClick={fillExample}>빈 항목에 구성 예시 넣기</button>
              </div>
            )}
            <small>
              앞에서 확인한 소개가 있다면 이어 쓸 수 있어요. 이미 쓴 소개와 직접 편집한 제작 요청은
              덮어쓰지 않아요.
            </small>
          </section>
        )}
        {screen === 3 && (
          <section className={system.practiceStage} aria-label="소개할 내용 정하기">
            <p data-current-action tabIndex={-1}>
              실제로 소개할 작업·활동·정보를 한 줄에 하나씩 적어주세요.
            </p>
            <p>
              특별한 경력이나 완성작이 없어도 괜찮아요. 최근 읽은 책, 자주 쓰는 도구, 배우면서 남긴
              기록도 소재가 됩니다. 장소 소개라면 세 곳 모두 이름·특징·방문 경험을 같은 순서로
              적으면 비교하기 쉬워요. 직접 확인하지 않은 정보는 억지로 채우지 않아도 돼요.
            </p>
            <label className={system.practiceField} htmlFor={`${id}-content`}>
              소개할 내용 · 한 줄에 하나
              <textarea
                id={`${id}-content`}
                value={record.content}
                onChange={(event) => update({ content: event.target.value })}
                placeholder={workbookPlanExample.content}
                rows={5}
              />
            </label>
            {!allReady && (
              <div className={system.practiceActions}>
                <button onClick={fillExample}>빈 항목에 구성 예시 넣기</button>
              </div>
            )}
            <p className={system.aiKeyTakeaway}>
              <strong>한 가지만 있어도 괜찮아요.</strong> 없는 실적을 채우기보다 소개할 수 있는 실제
              내용으로 작게 시작해요.
            </p>
          </section>
        )}
        {screen === 4 && (
          <>
            <section aria-labelledby="plan-recap-title">
              <h3 id="plan-recap-title">{record.title}</h3>
              <p>{record.intro}</p>
              <dl className={system.recapPoints}>
                <div>
                  <dt>읽을 사람</dt>
                  <dd>{record.audience || "아직 입력하지 않았어요"}</dd>
                </div>
                <div>
                  <dt>바라는 행동</dt>
                  <dd>{record.purpose || "아직 입력하지 않았어요"}</dd>
                </div>
              </dl>
            </section>
            <details className={system.preparationMore}>
              <summary>소개할 내용 보기</summary>
              <ul>
                {record.content
                  .split("\n")
                  .filter((line) => line.trim())
                  .map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
              </ul>
            </details>
            <section className={system.nextLesson}>
              <small>다음 수업</small>
              <h3>{workbookLessonLabel("project", 1)}</h3>
              <p>
                이 기획을 요청 초안으로 옮겨 같은 <code>index.html</code>을 고쳐요.
              </p>
            </section>
            <p className={system.recapScope}>
              기획을 적었다고 파일이 바뀌지는 않아요. 편집해둔 제작 요청과 기존 기록도 유지돼요.
            </p>
          </>
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>첫 파일에 내 주제와 내용을</h2>
          <p>읽을 사람과 바라는 행동을 정하고, 제목·소개·목록을 준비해요.</p>
          <small>실제 파일 반영은 뒤 수업에서 진행해요.</small>
        </div>
        <WorkbookActionReturn body={body} enabled={screen >= 1 && screen <= 3} />
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={screen + 1}>
            {screen > 0 && <button onClick={() => move(screen - 1)}>이전 설명</button>}
          </WorkbookLessonPrevious>
          {screen < 4 ? (
            <button disabled={blocked} onClick={() => move(screen + 1)}>
              다음으로
            </button>
          ) : (
            <button disabled={!allReady} onClick={() => onStep(1)}>
              제작 요청 다듬기로 →
            </button>
          )}
        </nav>
      </aside>
    </section>
  );
}

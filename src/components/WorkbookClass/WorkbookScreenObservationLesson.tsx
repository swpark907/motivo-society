"use client";

import { useEffect, useId, useRef, useState } from "react";
import { workbookLessonLabel } from "@/lib/workbook-course";
import { workbookPlanExample } from "@/lib/workbook-page-plan";
import { experienceProgress } from "@/lib/workbook-experience";
import type { ExperienceLessonProps } from "./WorkbookExperienceLesson";
import { ResponsivePagePreview } from "../WorkbookJourney/ResponsivePagePreview";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";
import { WorkbookActionReturn } from "./WorkbookActionReturn";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const titles = [
  "같은 내용도 화면 폭에 따라 달라 보여요",
  "PC와 모바일 폭을 번갈아 살펴봐요",
  "어디에서 무엇이 불편했나요?",
  "관찰한 한 가지를 개선 요청으로",
];

export function WorkbookScreenObservationLesson({
  project,
  record,
  onChange,
  onBack,
  onStep,
}: ExperienceLessonProps) {
  const [page, setPage] = useWorkbookLessonState("screen-observation-page", 0);
  const [size, setSize] = useWorkbookLessonState<"mobile" | "desktop">(
    "experience-screen",
    "desktop",
  );
  const [message, setMessage] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const id = useId();
  const hasPlan = [project.title, project.intro, project.content].every((value) => value.trim());
  const content = hasPlan ? project : workbookPlanExample;
  const observed = experienceProgress(record).observed;
  const blocked = page === 1 ? !record.before.every(Boolean) : page >= 2 ? !observed : false;
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [page]);
  function move(next: number) {
    setPage(next);
    setMessage("");
    requestAnimationFrame(() => heading.current?.focus());
  }
  function check() {
    const index = size === "mobile" ? 0 : 1;
    onChange({ ...record, before: record.before.map((value, i) => value || i === index) });
    setMessage(
      size === "mobile"
        ? "모바일 폭 확인을 남겼어요. 오른쪽으로 밀어 가려진 내용도 살펴보세요."
        : "PC 폭 확인을 남겼어요. 모바일 폭에서도 같은 내용을 비교해보세요.",
    );
  }
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="experience"
        point={0}
        headingRef={heading}
        onBack={onBack}
        current={page + 1}
        total={4}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        <h2 className={system.screenTitle}>{titles[page]}</h2>
        {page === 0 && (
          <section className={system.practiceStage}>
            <p>
              앞에서 살펴본 같은 제목·소개·목록을 <strong>넓은 폭과 좁은 폭</strong>에서 비교해요.
              읽을 수 있는지, 무엇부터 보이는지, 다음 행동을 찾을 수 있는지가 기준이에요.
            </p>
            <dl className={system.recapPoints}>
              <div>
                <dt>살펴볼 페이지</dt>
                <dd>{content.title}</dd>
              </div>
            </dl>
            <table
              className={`${system.aiResultTable} ${system.aiCheckTable}`}
              aria-label="두 화면의 관찰 기준"
            >
              <thead>
                <tr>
                  <th scope="col">살펴볼 것</th>
                  <th scope="col">비교할 질문</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">글과 목록</th>
                  <td>오른쪽이 잘리거나 읽으려고 좌우로 밀어야 하나요?</td>
                </tr>
                <tr>
                  <th scope="row">내용 보기 버튼</th>
                  <td>버튼을 찾고 누를 수 있나요? 같은 목록으로 이동하나요?</td>
                </tr>
              </tbody>
            </table>
            <p className={system.aiKeyTakeaway}>
              {hasPlan ? "앞에서 적은 기획을 배치한" : "아직 기획이 없어 준비된 내용을 쓰는"}{" "}
              <strong>비교 연습 예시</strong>예요. 너비 문제를 넣어뒀으며, 내 실제 파일에도 같은
              문제가 있다는 뜻은 아니에요.
            </p>
            <p>
              이번에는 첫 번째 기준인 ‘잘리지 않고 읽기’를 연습해요. 화면 폭에 맞춰 배치를 조정하는
              것이 <strong>반응형 웹</strong>의 핵심입니다. HTML이 내용의 구조를 나타낸다면,{" "}
              <strong>CSS</strong>는 글자 크기·간격·배치처럼 보이는 방식을 정해요.
            </p>
            <details className={system.preparationMore}>
              <summary>연습 화면의 폭과 내 파일 확인 방법</summary>
              <p>
                560px·280px는 비교하기 쉬운 연습용 폭이에요. px는 웹에서 크기를 나타내는 단위로,
                이번에는 같은 페이지를 넓은 창과 그 절반 폭의 좁은 창에서 보는 셈이에요. 실제 기기의
                크기는 다양하므로 이 숫자를 기기별 정답으로 외우지 않아도 돼요. 넓은 예시가 기기보다
                크면 바깥 영역을 좌우로 밀어볼 수 있어요.
              </p>
              <p>
                같은 my-first-web/index.html을 PC 브라우저로 열고 창을 넓혔다 좁혀보세요. 휴대폰으로
                파일을 옮길 필요는 없어요. 이미 읽기 좋다면 없는 문제를 만들거나 수정할 필요가
                없어요. 이 선택 실습 없이도 기본 학습은 진행할 수 있어요.
              </p>
            </details>
          </section>
        )}
        {page === 1 && (
          <section className={system.practiceStage}>
            <section className={system.learningGroup} aria-label="폭 선택과 같은 화면 비교">
              <div className={system.resultTabs} aria-label="비교 화면 크기">
                {(["desktop", "mobile"] as const).map((value) => (
                  <button
                    key={value}
                    aria-label={`${value === "desktop" ? "PC 폭 560px" : "모바일 폭 280px"} · ${record.before[value === "mobile" ? 0 : 1] ? "확인 완료" : "확인 전"}`}
                    aria-pressed={size === value}
                    onClick={() => {
                      setSize(value);
                      setMessage("");
                    }}
                  >
                    <span>{value === "desktop" ? "PC 폭 560px" : "모바일 폭 280px"}</span>
                    <small>
                      {record.before[value === "mobile" ? 0 : 1] ? "확인 완료" : "확인 전"}
                    </small>
                  </button>
                ))}
              </div>
              <ResponsivePagePreview
                screen={size}
                fluid={false}
                stack
                page={content}
                appearance="lesson"
                label="두 화면 비교 연습"
                onButton={() =>
                  setMessage(
                    "내용 보기 버튼이 목록으로 이동해요. 화면 폭에 따라 글과 목록이 어떻게 보이는지도 비교해보세요.",
                  )
                }
              />
            </section>
            <section className={system.learningGroup} aria-label="비교한 화면 확인">
              <p className={system.planningHint}>
                {size === "mobile"
                  ? "예시는 내용 폭이 고정되어 있어요. 안쪽을 좌우로 밀어 화면 밖으로 나간 부분을 찾아보세요."
                  : "같은 페이지의 PC 폭이에요. 모바일에서도 제목·소개·목록이 그대로 보이는지 비교하세요."}
              </p>
              <div className={system.practiceActions}>
                <button onClick={check}>이 화면 확인했어요</button>
              </div>
              {message && (
                <p className={system.planningHint} role="status">
                  {message}
                </p>
              )}
            </section>
          </section>
        )}
        {page === 2 && (
          <section className={system.practiceStage}>
            <p data-current-action tabIndex={-1}>
              예시에서 관찰한 불편함을 <strong>화면 조건 → 보인 현상</strong> 순서로 한 가지
              적어주세요.
            </p>
            <table
              className={`${system.aiResultTable} ${system.aiCheckTable}`}
              aria-label="관찰 기록 비교"
            >
              <thead>
                <tr>
                  <th scope="col">막연한 표현</th>
                  <th scope="col">다음 요청에 쓸 수 있는 관찰</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>모바일이 이상해요</td>
                  <td>모바일 폭에서 목록의 오른쪽이 잘려, 내용을 읽으려면 좌우로 밀어야 해요.</td>
                </tr>
              </tbody>
            </table>
            <label className={system.practiceField} htmlFor={`${id}-observation`}>
              예시의 작은 화면에서 불편한 한 가지
              <textarea
                id={`${id}-observation`}
                rows={4}
                value={record.observation}
                onChange={(event) => onChange({ ...record, observation: event.target.value })}
                placeholder="어느 화면에서, 무엇을 읽거나 누르기 어려웠나요?"
              />
            </label>
            <p className={system.planningHint}>
              지금은 관찰만 남겨요. 어떻게 고칠지 쓰거나 CSS 코드를 알 필요는 없어요.
            </p>
          </section>
        )}
        {page === 3 && (
          <>
            <dl className={system.recapPoints}>
              <div>
                <dt>비교한 것</dt>
                <dd>같은 제목·소개·목록을 PC·모바일 폭에서</dd>
              </div>
              <div>
                <dt>남긴 관찰</dt>
                <dd>{record.observation}</dd>
              </div>
            </dl>
            <p className={system.aiKeyTakeaway}>
              <strong>화면 크기를 바꿔보면</strong> 한 화면에서 놓친 불편함을 찾을 수 있어요.
            </p>
            <section className={system.nextLesson}>
              <small>다음 수업</small>
              <h3>{workbookLessonLabel("experience", 1)}</h3>
              <p>이 관찰을 바탕으로 바꿀 한 부분과 유지할 내용을 요청해요.</p>
            </section>
            <p className={system.recapScope}>
              이번 기록은 예시 비교 학습이에요. 실제 파일 수정·확인 기록과는 구분해요.
            </p>
          </>
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>다른 폭에서 같은 내용을</h2>
          <p>글과 목록이 읽히는지, 버튼을 누를 수 있는지 살펴봐요.</p>
          <small>수정하기 전에, 보이는 현상부터</small>
        </div>
        <WorkbookActionReturn body={body} enabled={page === 2} />
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={page + 1}>
            {page > 0 && <button onClick={() => move(page - 1)}>이전 설명</button>}
          </WorkbookLessonPrevious>
          {page < 3 ? (
            <button disabled={blocked} onClick={() => move(page + 1)}>
              다음으로
            </button>
          ) : (
            <button disabled={!observed} onClick={() => onStep(1)}>
              개선 요청 쓰기로 →
            </button>
          )}
        </nav>
      </aside>
    </section>
  );
}

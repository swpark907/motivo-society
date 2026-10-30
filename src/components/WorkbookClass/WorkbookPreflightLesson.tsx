"use client";

import { useEffect, useRef } from "react";
import { workbookLessonLabel } from "@/lib/workbook-course";
import { workbookPlanExample } from "@/lib/workbook-page-plan";
import { publishProgress } from "@/lib/workbook-publish";
import type { PublishLessonProps } from "./WorkbookPublishLesson";
import { ResponsivePagePreview } from "../WorkbookJourney/ResponsivePagePreview";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const titles = [
  "보여주기 전에, 읽고 눌러봐요",
  "누구나 봐도 되는 내용인가요?",
  "PC 폭에서 제목·소개·목록을 읽어요",
  "모바일 폭에서도 같은 내용을 읽어요",
  "내용 보기 버튼도 직접 눌러요",
  "공개 전 점검과 실제 공개는 달라요",
];
const options = ["테스트 계정 비밀번호", "공개 여부를 확인한 제목·소개·작업 목록"];

export function WorkbookPreflightLesson({
  project,
  record,
  onChange,
  onBack,
  onStep,
}: PublishLessonProps) {
  const [screen, setScreen] = useWorkbookLessonState("publish-preflight-screen", 0);
  const [size, setSize] = useWorkbookLessonState<"mobile" | "desktop">("publish-screen", "mobile");
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const hasPlan = [project.title, project.intro, project.content].every((value) => value.trim());
  const content = hasPlan ? project : workbookPlanExample;
  const currentSize = screen === 2 ? "desktop" : screen === 3 ? "mobile" : size;
  const blocked =
    screen === 1
      ? record.privacyChoice !== 1
      : screen === 2
        ? !record.checked[1]
        : screen === 3
          ? !record.checked.every(Boolean)
          : screen === 4
            ? !record.buttonChecked
            : screen === 5
              ? !publishProgress(record).inspected
              : false;
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [screen]);
  function move(next: number) {
    setScreen(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function buttonChecked() {
    if (!record.buttonChecked) onChange({ ...record, buttonChecked: true });
  }
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="publish"
        point={0}
        headingRef={heading}
        onBack={onBack}
        current={screen + 1}
        total={6}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        <h2 className={system.screenTitle}>{titles[screen]}</h2>
        {screen === 0 && (
          <section className={system.practiceStage}>
            <p>
              공개하기 전에 <strong>내용이 맞는지, 다른 사람이 읽고 누를 수 있는지</strong>{" "}
              점검해요. 앞에서는 만드는 사람으로 봤다면, 이제는 <strong>처음 방문한 사람</strong>
              처럼 읽어봅니다. 이 사람은 우리가 AI와 나눈 대화나 제작 의도를 모르니까요.
            </p>
            <dl className={system.recapPoints}>
              <div>
                <dt>살펴볼 페이지</dt>
                <dd>{content.title}</dd>
              </div>
            </dl>
            <table
              className={`${system.aiResultTable} ${system.aiCheckTable}`}
              aria-label="공개 전 점검 기준"
            >
              <thead>
                <tr>
                  <th scope="col">점검할 것</th>
                  <th scope="col">확인할 질문</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">내용·자료</th>
                  <td>사실과 맞고 공개해도 되는 내용인가요?</td>
                </tr>
                <tr>
                  <th scope="row">두 화면</th>
                  <td>제목·소개·목록이 읽히고 잘린 곳이 없나요?</td>
                </tr>
                <tr>
                  <th scope="row">버튼</th>
                  <td>내용 보기 버튼이 같은 목록으로 이동하나요?</td>
                </tr>
              </tbody>
            </table>
            <p className={system.recapScope}>
              {hasPlan ? "작성한 기획을 배치한" : "기획이 없어 준비된 내용을 쓰는"} 학습 예시예요.
              실제 파일을 자동으로 검사하거나 공개하지 않아요. 앞 단원의 메모 저장도 실제 페이지에
              연결한 기능은 아니에요.
            </p>
            <details className={system.preparationMore}>
              <summary>내 실제 파일에서는 어떻게 점검하나요?</summary>
              <p>
                같은 my-first-web/index.html을 브라우저로 열어 내용과 버튼을 직접 확인하고, 창을
                넓혔다 좁혀 읽어보세요. 문제가 있으면 고친 뒤 같은 조건으로 다시 확인해요. 실제로
                넣은 기능만 점검하며 없는 기능을 만들 필요는 없어요.
              </p>
            </details>
          </section>
        )}
        {screen === 1 && (
          <section className={system.practiceStage}>
            <p>
              장소 사진을 고를 때도 ‘내가 볼 수 있는 사진’과 ‘내 페이지에 공개해도 되는 사진’은
              달라요. 직접 찍었는지, 다른 사람이 찍혀 있는지, 이용할 권한이 있는 자료인지
              살펴보세요.
            </p>
            <p>누구나 보는 페이지에 넣어도 되는 자료를 골라주세요.</p>
            <div className={system.choices} role="group" aria-label="공개할 내용 확인">
              {options.map((text, index) => (
                <button
                  key={text}
                  className={system.choice}
                  aria-pressed={record.privacyChoice === index}
                  data-answer={
                    record.privacyChoice === index
                      ? index === 1
                        ? "correct"
                        : "incorrect"
                      : undefined
                  }
                  onClick={() => onChange({ ...record, privacyChoice: index })}
                >
                  <span>{text}</span>
                  {record.privacyChoice === index && (
                    <span className={system.answerMark}>
                      {index === 1 ? "✓ 확인" : "× 다시 생각"}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className={system.quizFeedback}>
              {record.privacyChoice === 0
                ? "테스트용 비밀번호도 공개할 내용은 아니에요. 보여줘도 되는 제목·소개·목록을 다시 골라보세요."
                : "비밀번호·비밀 API 키는 공개 파일에 넣지 않아요. 연락처·사진·다른 사람의 자료도 공개해도 되는지 먼저 확인해요."}
            </p>
            <details className={system.preparationMore}>
              <summary>비밀 API 키는 무엇인가요?</summary>
              <p>
                프로그램이 외부 서비스를 사용할 때 권한을 확인하는 문자열이에요. 공개 페이지에
                넣으면 다른 사람이 가져갈 수 있어요. 이번 페이지에 API를 추가하라는 뜻은 아니에요.
              </p>
            </details>
          </section>
        )}
        {(screen === 2 || screen === 3) && (
          <section className={system.practiceStage}>
            <p className={system.planningHint}>
              {screen === 2 ? "PC 560px" : "모바일 280px"} · 같은 주제와 내용이 읽히는지 살펴보세요.
              긴 내용은 예시 안에서 스크롤할 수 있어요.
            </p>
            <ResponsivePagePreview
              screen={currentSize}
              fluid
              stack
              page={content}
              appearance="lesson"
              label="공개 전 점검 예시"
              onButton={buttonChecked}
            />
            <div className={system.setupChecks}>
              <label>
                <input
                  type="checkbox"
                  checked={record.checked[screen === 2 ? 1 : 0]}
                  onChange={(event) =>
                    onChange({
                      ...record,
                      checked: record.checked.map((value, i) =>
                        i === (screen === 2 ? 1 : 0) ? event.target.checked : value,
                      ),
                    })
                  }
                />
                {screen === 2 ? "PC" : "모바일"} 예시의 제목·소개·목록을 읽었어요
              </label>
            </div>
          </section>
        )}
        {screen === 4 && (
          <section className={system.practiceStage}>
            <div className={system.resultTabs} role="group" aria-label="버튼 점검 화면 크기">
              {(["mobile", "desktop"] as const).map((value) => (
                <button key={value} aria-pressed={size === value} onClick={() => setSize(value)}>
                  {value === "mobile" ? "모바일 280px" : "PC 560px"}
                </button>
              ))}
            </div>
            <ResponsivePagePreview
              screen={size}
              fluid
              stack
              page={content}
              appearance="lesson"
              label="공개 전 버튼 점검 예시"
              onButton={buttonChecked}
            />
            <p className={system.planningHint}>
              예시의 <strong>내용 보기</strong>를 눌러 목록으로 이동하는지 확인하세요.
            </p>
            {record.buttonChecked && (
              <p className={system.planningHint} role="status">
                내용 보기 버튼으로 같은 목록에 도착했어요.
              </p>
            )}
          </section>
        )}
        {screen === 5 && (
          <>
            <dl className={system.recapPoints}>
              <div>
                <dt>확인한 기준</dt>
                <dd>공개할 내용·두 화면에서 읽기·버튼 이동</dd>
              </div>
              <div>
                <dt>기록의 범위</dt>
                <dd>워크북 예시 점검 · 실제 파일 점검과 배포는 별도</dd>
              </div>
            </dl>
            <p className={system.aiKeyTakeaway}>
              점검을 마친 것과 <strong>다른 사람이 접속할 수 있도록 공개한 것</strong>은 달라요.
            </p>
            <section className={system.nextLesson}>
              <small>다음 수업</small>
              <h3>{workbookLessonLabel("publish", 1)}</h3>
              <p>
                내 컴퓨터의 주소와 공개 주소를 비교하고, 주소를 적는 것과 배포하는 것의 차이를
                알아봐요.
              </p>
            </section>
          </>
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>보여줄 내용과 동작부터 점검</h2>
          <p>두 화면에서 읽고, 버튼을 누르고, 공개해도 되는 자료인지 확인해요.</p>
          <small>예시 점검 · 실제 공개는 별도</small>
        </div>
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={screen + 1}>
            {screen > 0 && <button onClick={() => move(screen - 1)}>이전 설명</button>}
          </WorkbookLessonPrevious>
          {screen < 5 ? (
            <button disabled={blocked} onClick={() => move(screen + 1)}>
              다음으로
            </button>
          ) : (
            <button disabled={!publishProgress(record).inspected} onClick={() => onStep(1)}>
              주소와 배포로 →
            </button>
          )}
        </nav>
      </aside>
    </section>
  );
}

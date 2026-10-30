"use client";

import { workbookLearningExample } from "@/lib/workbook-learning-example";
import { workbookLessonLabel } from "@/lib/workbook-course";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";

// 첫 파일 실습의 화면·예시와 실제 프로젝트 결과를 분리한다.
import { useEffect, useRef, useState } from "react";
import type { PracticeLessonProps, PracticeRecord } from "./WorkbookPracticeLesson";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { WorkbookActionReturn } from "./WorkbookActionReturn";
import {
  WorkbookFirstProjectResult,
  WorkbookFirstProjectStatus,
  useRecordFirstProjectResult,
} from "./WorkbookFirstProjectResult";
import { WorkbookPracticalLab } from "./WorkbookPracticalLab";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const screens = [
  ["파일 작업의 기본", "코드 답변에서 실제 파일 작업으로"],
  ["실습 방식", "어떻게 따라갈까요?"],
  ["제작 요청", "같은 폴더에 첫 파일을 만들어요"],
  ["파일 열기", "만든 파일을 브라우저로 열어요"],
  ["결과 확인", "화면과 버튼을 직접 확인해요"],
  ["수정 요청", "한 곳을 바꾸고 나머지는 유지해요"],
  ["수정 결과", "같은 파일을 새로고침해 다시 봐요"],
  ["학습 확인", "완료 메시지보다 실제 결과를 봐요"],
  ["실제 결과", "직접 확인한 만큼 기록해요"],
  ["학습 정리", "같은 파일을 만들고, 열고, 고쳐요"],
];
const exampleScreenTitles: Record<number, string> = {
  2: "첫 파일 제작 요청을 살펴봐요",
  3: "준비된 첫 파일 화면을 살펴봐요",
  6: "수정된 예시 화면을 다시 확인해요",
};
const revisionExample =
  "현재 연결된 my-first-web 폴더의 index.html에서 제목을 ‘혼자 책 읽기 좋은 세 곳’로 바꿔줘. 소개 문구와 목록, ‘작업 보기’ 버튼의 목록 이동은 유지해줘. 다른 파일은 바꾸지 마. 바꾼 파일과 다시 확인할 것을 알려줘.";

export function WorkbookFirstFileLesson({
  record,
  ready,
  onChange,
  onBack,
  onComplete,
}: PracticeLessonProps) {
  const p = useWorkbookProgress();
  const recordResult = useRecordFirstProjectResult();
  const firstIntro = p.projectWorkflow.notes["first-intro"]?.text.trim() ?? "";
  const filePrompt = [
    "[폴더 확인] 현재 연결된 my-first-web 폴더를 먼저 확인해줘. index.html이 이미 있으면 내용을 먼저 설명하고 보존할 부분과 수정 범위를 확인한 뒤 작업해줘.",
    `[만들 내용] 파일이 없으면 이 파일 하나로 작은 한국어 페이지를 만들어줘. 제목은 ‘나의 첫 웹페이지’, 소개는 ‘${firstIntro || "자리와 소음을 기준으로 세 장소를 비교하는 연습용 페이지예요."}’로 써줘. 목록에는 아래 가상 장소 예시를 넣어줘. 내 실제 방문 경험으로 표현하지 마. ${workbookLearningExample.content}`,
    "[버튼] ‘작업 보기’ 버튼은 목록으로 이동하게 해줘.",
    "[보존 범위] 없는 실적이나 숫자를 만들지 마. 다른 파일·설치·외부 서비스·로그인·배포는 건드리지 마.",
    "[확인 방법] 변경 파일과 브라우저로 확인할 방법을 알려줘.",
  ].join("\n\n");
  const [screen, setScreen] = useWorkbookLessonState("first-file-screen", 0);
  const [answer, setAnswer] = useWorkbookLessonState<number | null>("practice-4-answer", null);
  const [exampleStage, setExampleStage] = useWorkbookLessonState("practice-4-exampleStage", 0);
  const [exampleJumped, setExampleJumped] = useWorkbookLessonState(
    "practice-4-exampleJumped",
    false,
  );
  const [copyStatus, setCopyStatus] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLElement>(null);
  const revisedPreview = useRef<HTMLElement>(null);
  const exampleList = useRef<HTMLDivElement>(null);
  const computer = record.mode === "computer";
  const written = [record.request, record.observation, record.revision].every((value) =>
    value.trim(),
  );
  const complete =
    written &&
    answer === 1 &&
    (computer ? ready : record.mode === "example" && exampleStage === 2 && exampleJumped);
  const blocked = [
    false,
    record.mode === null,
    !record.request.trim(),
    !computer && exampleStage < 1,
    !record.observation.trim(),
    !record.revision.trim(),
    !computer && (exampleStage !== 2 || !exampleJumped),
    answer !== 1,
    !complete,
    !complete,
  ][screen];
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [screen]);
  function move(next: number) {
    setCopyStatus("");
    setScreen(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function update(patch: Partial<PracticeRecord>) {
    setCopyStatus("");
    onChange({ ...record, ...patch });
    p.dispatchProjectWorkflow({ type: "learn", unit: "ai-5", status: "in-progress" });
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus("요청을 복사했어요. AI 앱에 붙여넣고 보내주세요.");
    } catch {
      setCopyStatus("복사하지 못했어요. 요청문을 선택해 직접 복사해주세요.");
    }
  }
  function uncheck(index: number) {
    const keys =
      index === 0
        ? (["setup.folder", "setup.file"] as const)
        : index === 1
          ? (["setup.opened"] as const)
          : (["setup.changed"] as const);
    for (const key of keys)
      p.dispatchProjectWorkflow({
        type: "record",
        key,
        outcome: "attempted",
        evidence: record.observation,
        projectId: p.projectWorkflow.projectId,
        revision: p.projectWorkflow.checkpoints[key].revision,
      });
  }
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="agent"
        point={4}
        headingRef={heading}
        onBack={onBack}
        current={screen + 1}
        total={10}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        <h2 className={system.screenTitle}>
          {record.mode === "example"
            ? (exampleScreenTitles[screen] ?? screens[screen][1])
            : screens[screen][1]}
        </h2>
        {screen === 0 && (
          <div className={system.aiConceptSlide}>
            <p>
              앞에서는 장소 소개문을 읽었어요. 이번에는 같은 주제로 장소를 모은 파일과 화면을
              만들어봐요. <strong>바이브코딩</strong>은 만들고 싶은 것을 말로 설명하고, AI가 만든
              코드를 실행·확인하며 고쳐가는 방식이에요.
            </p>
            <table className={system.aiResultTable} aria-label="답변과 파일 작업의 차이">
              <thead>
                <tr>
                  <th scope="col">1-4 수업에서</th>
                  <th scope="col">이번에는</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>소개문을 답변으로 받기</td>
                  <td>소개를 담은 파일 만들기</td>
                </tr>
                <tr>
                  <td>문장을 읽고 확인하기</td>
                  <td>브라우저로 열고 버튼 눌러보기</td>
                </tr>
              </tbody>
            </table>
            <p>
              <strong>요청문 → index.html 파일 → 브라우저 화면</strong>으로 이어집니다. 제목을
              넣어달라는 요청이 파일에 반영되면 브라우저에서 그 제목을 볼 수 있어요. 말로 받은
              답변에서, 직접 열어볼 작업물로 한 걸음 나아가는 거예요.
            </p>
          </div>
        )}
        {screen === 1 && (
          <section className={system.exampleQuestion} aria-label="실습 방식 선택">
            <p data-current-action tabIndex={-1}>
              지금 사용할 방식을 하나 골라주세요.
            </p>
            <div className={system.choices}>
              <button
                className={system.choice}
                disabled={!ready}
                aria-pressed={computer}
                onClick={() => {
                  update({ mode: "computer", checks: [false, false, false] });
                  setExampleStage(0);
                  setExampleJumped(false);
                }}
              >
                내 컴퓨터에서 실습하기
              </button>
              <button
                className={system.choice}
                aria-pressed={record.mode === "example"}
                onClick={() => {
                  update({ mode: "example", checks: [false, false, false] });
                  setExampleStage(0);
                  setExampleJumped(false);
                }}
              >
                예시로 복습하기
              </button>
            </div>
            <p>
              {ready
                ? "컴퓨터에서는 1-3 수업의 my-first-web 폴더를 연결한 AI 앱을 열어요. 예시 복습에서는 준비된 화면을 조작해요."
                : "컴퓨터 실습은 1-3 수업의 준비 확인 후 사용할 수 있어요. 지금은 예시로 복습할 수 있어요."}
            </p>
            <small>
              방식을 바꿔도 요청·관찰·수정 기록은 유지돼요. 체크와 예시 조작은 다시 시작해요.
            </small>
          </section>
        )}
        {screen === 2 && (
          <section className={system.practiceStage} aria-label="첫 파일 제작 요청">
            <section className={system.learningGroup}>
              <p data-current-action tabIndex={-1}>
                {computer
                  ? "연결된 폴더가 my-first-web인지 확인한 뒤 제작 요청을 보내주세요."
                  : "예시 요청을 가져오거나 적어보세요. 다음 화면에서 준비된 결과를 열어요."}
              </p>
              <label className={system.practiceField}>
                제작 요청
                <textarea
                  rows={8}
                  value={record.request}
                  onChange={(e) =>
                    update({ request: e.target.value, checks: [false, false, false] })
                  }
                  placeholder={filePrompt}
                />
              </label>
              <div className={system.practiceActions}>
                <button
                  onClick={() => update({ request: filePrompt, checks: [false, false, false] })}
                >
                  예시 요청 가져오기
                </button>
                {computer && (
                  <button
                    disabled={!record.request.trim()}
                    onClick={() => void copy(record.request)}
                  >
                    요청 복사하기
                  </button>
                )}
              </div>
              {copyStatus && <p role="status">{copyStatus}</p>}
            </section>
            <p>
              <strong>index.html</strong>은 이번 웹페이지 파일의 이름이에요. HTML은
              제목·소개·목록처럼 웹 화면의 구조를 적는 방식이에요. 예를 들어 ‘장소 이름은 제목,
              설명은 문단, 세 장소의 모음은 목록’처럼 내용의 역할을 구분해요. 지금은 코드를
              외우기보다 파일 속 구조가 화면에 나타난다는 점을 이해하면 됩니다.
            </p>
            <p className={system.aiKeyTakeaway}>
              같은 이름의 파일이 이미 있다면 <strong>내용과 수정 범위를 먼저 확인</strong>해요. 이
              폴더를 다음 단원에서도 계속 써요.
            </p>
          </section>
        )}
        {screen === 3 && (
          <section className={system.practiceStage} aria-label="첫 파일 열기">
            <p data-current-action tabIndex={-1}>
              {computer
                ? "AI 작업이 끝나면 변경 파일을 확인하고 브라우저로 열어주세요."
                : "준비된 파일 결과를 열어보세요. 내 컴퓨터의 파일이 만들어지는 것은 아니에요."}
            </p>
            {computer ? (
              <>
                <ol className={system.decisionSteps}>
                  <li>
                    <strong>변경 파일 찾기</strong>
                    <span>
                      앱의 변경 목록과 my-first-web 폴더에서 <code>index.html</code>을 찾아요.
                    </span>
                  </li>
                  <li>
                    <strong>브라우저로 열기</strong>
                    <span>
                      파일 탐색기(Windows)나 Finder(Mac)에서 파일을 더블 클릭해요. 안 열리면 ‘연결
                      프로그램·다음으로 열기’에서 브라우저를 선택해요.
                    </span>
                  </li>
                </ol>
                <p>
                  브라우저는 웹페이지를 보는 앱이에요. Chrome·Edge·Safari 등을 사용할 수 있어요.
                </p>
                <details className={system.preparationMore}>
                  <summary>파일이 없거나 화면을 열 수 없어요</summary>
                  <p>
                    코드 답변만 왔다면 연결된 폴더의 파일에 반영해달라고 요청해요. 열리지 않으면
                    표시된 오류와 파일 위치를 AI에게 알려주고 여는 방법을 물어봐요.
                  </p>
                </details>
              </>
            ) : (
              <>
                {exampleStage === 0 && (
                  <button
                    className={system.practiceReveal}
                    onClick={() => {
                      setExampleStage(1);
                      requestAnimationFrame(() => preview.current?.focus());
                    }}
                  >
                    미리 만든 결과 살펴보기
                  </button>
                )}
                {exampleStage > 0 && (
                  <section
                    ref={preview}
                    tabIndex={-1}
                    className={`${system.preview} ${system.filePreview}`}
                    aria-label="첫 파일 예시"
                  >
                    <small>사전 제작 예시 · index.html 새 파일</small>
                    <h3>나의 첫 웹페이지</h3>
                    <p>
                      {firstIntro || "자리와 소음을 기준으로 세 장소를 비교하는 연습용 페이지예요."}
                    </p>
                    <button
                      className={system.practiceReveal}
                      onClick={() => {
                        exampleList.current?.focus({ preventScroll: true });
                        exampleList.current?.scrollIntoView({
                          block: "nearest",
                          behavior: "instant",
                        });
                      }}
                    >
                      작업 보기
                    </button>
                    <div ref={exampleList} data-example-list tabIndex={-1}>
                      <h4>소개할 장소 · 가상 예시</h4>
                      <ul>
                        {workbookLearningExample.content.split("\n").map((place) => (
                          <li key={place}>{place}</li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}
              </>
            )}
          </section>
        )}
        {screen === 4 && (
          <section className={system.practiceStage} aria-label="첫 파일 결과 확인">
            <p data-current-action tabIndex={-1}>
              화면을 읽고 버튼도 눌러본 뒤, 확인한 점이나 막힌 점을 하나 적어주세요.
            </p>
            <dl className={system.checkCriteria}>
              <div>
                <dt>내용</dt>
                <dd>부탁한 제목·소개·목록이 보이나요?</dd>
              </div>
              <div>
                <dt>동작</dt>
                <dd>‘작업 보기’를 누르면 목록으로 이동하나요?</dd>
              </div>
              {computer && (
                <div>
                  <dt>파일</dt>
                  <dd>AI가 바꾼 파일과 내가 연 파일이 같나요?</dd>
                </div>
              )}
            </dl>
            <label className={system.practiceField}>
              확인한 점 하나
              <textarea
                value={record.observation}
                onChange={(e) => update({ observation: e.target.value })}
                placeholder={
                  computer
                    ? "예: 제목과 목록이 보여요. 버튼도 목록으로 이동해요. 또는 실제로 막힌 점을 적어요."
                    : "예시 화면에서 제목·소개·목록과 버튼을 확인한 내용을 적어보세요."
                }
              />
            </label>
            <small>
              {computer
                ? "완료 메시지만 보고 성공으로 판단하지 않아요. 문제가 남아 있어도 실제 관찰을 적고 이어갈 수 있어요."
                : "예시에서 확인한 내용으로 적어요. 실제 내 파일 제작 성공으로 기록되지는 않아요."}
            </small>
          </section>
        )}
        {screen === 5 && (
          <section className={system.practiceStage} aria-label="첫 파일 수정 요청">
            <p data-current-action tabIndex={-1}>
              {computer
                ? "같은 AI 대화에서 수정할 부분과 유지할 부분을 알려주세요."
                : "이번 예시에서는 제목만 바꾸고 내용·동작은 유지해볼게요."}
            </p>
            <table
              className={`${system.aiResultTable} ${system.aiCheckTable}`}
              aria-label="첫 파일 수정 기준"
            >
              <thead>
                <tr>
                  <th scope="col">구분</th>
                  <th scope="col">수정 예시</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">바꿀 것</th>
                  <td>제목 → 혼자 책 읽기 좋은 세 곳</td>
                </tr>
                <tr>
                  <th scope="row">유지할 것</th>
                  <td>소개·목록·버튼의 목록 이동</td>
                </tr>
              </tbody>
            </table>
            <section className={system.learningGroup}>
              <label className={system.practiceField}>
                수정 요청
                <textarea
                  value={record.revision}
                  onChange={(e) =>
                    update({ revision: e.target.value, checks: [false, false, false] })
                  }
                  placeholder={revisionExample}
                />
              </label>
              <div className={system.practiceActions}>
                <button
                  onClick={() =>
                    update({ revision: revisionExample, checks: [false, false, false] })
                  }
                >
                  수정 예시 가져오기
                </button>
                {computer && (
                  <button
                    disabled={!record.revision.trim()}
                    onClick={() => void copy(record.revision)}
                  >
                    수정 요청 복사하기
                  </button>
                )}
              </div>
              {copyStatus && <p role="status">{copyStatus}</p>}
            </section>
          </section>
        )}
        {screen === 6 && (
          <section className={system.practiceStage} aria-label="첫 파일 수정 결과">
            <p data-current-action tabIndex={-1}>
              {computer
                ? "수정이 끝나면 같은 파일을 다시 열거나 브라우저를 새로고침해주세요."
                : "수정된 예시를 열고 버튼 동작까지 다시 확인해보세요."}
            </p>
            {computer ? (
              <ol className={system.decisionSteps}>
                <li>
                  <strong>파일 변경 확인</strong>
                  <span>
                    요청한 <code>my-first-web/index.html</code>이 바뀌었는지 봐요.
                  </span>
                </li>
                <li>
                  <strong>화면 다시 보기</strong>
                  <span>저장한 파일을 새로고침하고 요청한 변경이 반영됐는지 봐요.</span>
                </li>
                <li>
                  <strong>동작 다시 확인</strong>
                  <span>소개·목록이 남아 있는지 읽고 ‘작업 보기’를 다시 눌러요.</span>
                </li>
              </ol>
            ) : (
              <>
                {exampleStage !== 2 && (
                  <button
                    className={system.practiceReveal}
                    onClick={() => {
                      setExampleStage(2);
                      setExampleJumped(false);
                      requestAnimationFrame(() => revisedPreview.current?.focus());
                    }}
                  >
                    미리 만든 수정 결과 보기
                  </button>
                )}
                {exampleStage === 2 && (
                  <section
                    ref={revisedPreview}
                    tabIndex={-1}
                    className={`${system.preview} ${system.filePreview}`}
                    aria-label="수정된 첫 파일 예시"
                  >
                    <small>사전 제작 예시 · index.html 제목 수정</small>
                    <p className={system.beforeAfterTitle}>
                      <span>나의 첫 웹페이지</span>
                      <span aria-hidden="true">→</span>
                      <strong>혼자 책 읽기 좋은 세 곳</strong>
                    </p>
                    <p>
                      {firstIntro || "자리와 소음을 기준으로 세 장소를 비교하는 연습용 페이지예요."}
                    </p>
                    <button
                      className={system.practiceReveal}
                      onClick={() => {
                        setExampleJumped(true);
                        exampleList.current?.focus({ preventScroll: true });
                        exampleList.current?.scrollIntoView({
                          block: "nearest",
                          behavior: "instant",
                        });
                      }}
                    >
                      수정된 작업 보기
                    </button>
                    <div ref={exampleList} data-example-list tabIndex={-1}>
                      <h4>소개할 장소 · 가상 예시</h4>
                      <ul>
                        {workbookLearningExample.content.split("\n").map((place) => (
                          <li key={place}>{place}</li>
                        ))}
                      </ul>
                    </div>
                    {exampleJumped && (
                      <p role="status">수정 후에도 버튼에 연결된 목록을 확인했어요.</p>
                    )}
                  </section>
                )}
              </>
            )}
            <p className={system.aiKeyTakeaway}>
              바꾼 부분과 함께 <strong>유지해달라고 한 내용·동작</strong>도 확인해요.
            </p>
          </section>
        )}
        {screen === 7 && (
          <section className={system.exampleQuestion} aria-label="실제 파일 결과 확인 문제">
            <p data-current-action tabIndex={-1}>
              AI가 ‘완료했어요’라고 답했어요. 제작 결과는 무엇으로 판단할까요?
            </p>
            <div className={system.choices}>
              {[
                "완료 메시지를 받았으니 화면도 잘 동작해요",
                "바뀐 파일과 브라우저 화면·버튼을 직접 확인해요",
              ].map((value, index) => (
                <button
                  key={value}
                  className={system.choice}
                  aria-label={value}
                  aria-pressed={answer === index}
                  data-answer={
                    answer === index ? (index === 1 ? "correct" : "incorrect") : undefined
                  }
                  onClick={() => {
                    setAnswer(index);
                    p.dispatchProjectWorkflow({
                      type: "learn",
                      unit: "ai-5",
                      status: "in-progress",
                    });
                  }}
                >
                  {value}
                  {answer === index && (
                    <span className={system.answerMark}>{index === 1 ? "✓ 정답" : "× 오답"}</span>
                  )}
                </button>
              ))}
            </div>
            <p role="status" className={system.quizFeedback}>
              {answer === null
                ? ""
                : answer === 1
                  ? "맞아요. 파일 반영·실행·동작은 직접 확인해요. 완료 메시지만으로는 알 수 없어요."
                  : "파일이 없거나 버튼이 동작하지 않을 수도 있어요. 실제 파일과 화면으로 확인해볼까요?"}
            </p>
          </section>
        )}
        {screen === 8 && (
          <section className={system.practiceStage} aria-label="첫 파일 실제 결과 기록">
            <p data-current-action tabIndex={-1}>
              {computer
                ? "실제 컴퓨터에서 확인한 항목만 표시해주세요. 남은 문제는 관찰에 적고 계속할 수 있어요."
                : "워크북 예시에서 파일 제작과 수정 흐름을 살펴봤어요. 실제 파일 제작 기록과는 구분해요."}
            </p>
            {computer && (
              <div className={system.setupChecks}>
                {[
                  "실습 폴더의 변경 파일을 확인했어요",
                  "브라우저에서 화면을 열고 버튼을 눌러봤어요",
                  "수정 후 새로고침해 제목과 동작을 다시 확인했어요",
                ].map((value, index) => (
                  <label key={value}>
                    <input
                      type="checkbox"
                      checked={record.checks[index]}
                      onChange={(e) => {
                        update({
                          checks: record.checks.map((checked, i) =>
                            i === index ? e.target.checked : checked,
                          ),
                        });
                        if (!e.target.checked) uncheck(index);
                      }}
                    />
                    {value}
                  </label>
                ))}
              </div>
            )}
            <WorkbookFirstProjectResult
              className={system.projectResult}
              confirmationMessage="마지막 화면에서 학습을 마치면 체크와 관찰을 실제 파일의 본인 확인으로 함께 저장해요."
              stage="setup"
              computer={computer}
              checksReady={ready && record.checks.every(Boolean)}
              evidence={record.observation}
            />
          </section>
        )}
        {screen === 9 && (
          <>
            <section aria-labelledby="file-recap-title">
              <h3 id="file-recap-title">배운 핵심</h3>
              <dl className={system.recapPoints}>
                <div>
                  <dt>만들기</dt>
                  <dd>작업 폴더와 파일·변경 범위를 정해 요청해요.</dd>
                </div>
                <div>
                  <dt>실행·확인</dt>
                  <dd>같은 파일을 브라우저로 열고 내용과 동작을 확인해요.</dd>
                </div>
                <div>
                  <dt>수정</dt>
                  <dd>작은 부분을 바꾼 뒤 다시 열어 유지할 내용과 동작도 봐요.</dd>
                </div>
              </dl>
            </section>
            <details className={system.preparationMore}>
              <summary>내 기록·추가 연습 보기</summary>
              <dl className={system.recapPoints}>
                <div>
                  <dt>제작 요청</dt>
                  <dd>{record.request}</dd>
                </div>
                <div>
                  <dt>확인한 점</dt>
                  <dd>{record.observation}</dd>
                </div>
                <div>
                  <dt>수정 요청</dt>
                  <dd>{record.revision}</dd>
                </div>
              </dl>
              <details className={system.preparationMore}>
                <summary>저장된 실제 결과 보기</summary>
                <WorkbookFirstProjectStatus stage="setup" />
              </details>
              <WorkbookPracticalLab stage="agent" />
            </details>
            <section className={system.nextLesson}>
              <small>다음 수업</small>
              <h3>{workbookLessonLabel("project", 0)}</h3>
              <p>같은 폴더의 첫 파일에 나의 대상·내용·목적을 담을 계획을 세워요.</p>
            </section>
            <p className={system.recapScope}>
              {computer ? "외부 도구 실습 · 본인 확인" : "사전 제작 예시 복습"}. 학습 완료와 실제
              파일 결과는 따로 남겨요.
            </p>
          </>
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>파일과 화면을 확인하는 힘</h2>
          <p>첫 파일을 만들고, 열고, 한 곳을 고친 뒤 다시 확인해요.</p>
          <small>
            {screen > 1
              ? computer
                ? "외부 앱에서 직접 실습"
                : "미리 만든 예시로 복습"
              : "실제 실습과 예시 복습을 구분해요."}
          </small>
        </div>
        <WorkbookActionReturn body={body} enabled={screen >= 2 && screen <= 8} />
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={screen + 1}>
            {screen > 0 && <button onClick={() => move(screen - 1)}>이전 설명</button>}
          </WorkbookLessonPrevious>
          {screen < 9 ? (
            <button disabled={blocked} onClick={() => move(screen + 1)}>
              {screen === 8 ? "학습 정리 보기" : "다음으로"}
            </button>
          ) : (
            <button
              disabled={!complete}
              onClick={() => {
                recordResult(
                  "setup",
                  computer,
                  ready && record.checks.every(Boolean),
                  record.observation,
                );
                p.dispatchProjectWorkflow({
                  type: "learn",
                  unit: "ai-5",
                  status: "confirmed",
                  source: computer ? "computer" : "example",
                });
                onComplete();
              }}
            >
              {[0, 1, 2, 3].every((index) => p.completed.includes(index))
                ? "1단원 마치고 다음 학습 보기 →"
                : "수업 마치고 단원 지도로 →"}
            </button>
          )}
        </nav>
      </aside>
    </section>
  );
}

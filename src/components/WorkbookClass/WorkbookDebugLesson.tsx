"use client";

import { useEffect, useId, useRef } from "react";
import { publishProgress, type PublishRecord } from "@/lib/workbook-publish";
import type { PublishLessonProps } from "./WorkbookPublishLesson";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";
import { WorkbookActionReturn } from "./WorkbookActionReturn";
import { WorkbookApplicationRecord } from "./WorkbookApplicationRecord";
import { WorkbookPracticalLab } from "./WorkbookPracticalLab";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const titles = [
  "같은 버튼을 눌러 문제를 확인해요",
  "어느 화면에서 무엇을 했나요?",
  "기대한 결과와 실제 결과를 나눠요",
  "한 부분만 고치는 요청으로",
  "요청과 예시 수정은 별개예요",
  "고친 뒤 같은 버튼을 다시 눌러요",
  "다시 눌러 확인한 변화를 남겨요",
  "재현 → 요청 → 수정 → 재확인",
];
const fields = [
  ["device", "어느 화면에서 눌렀나요?", "예: 컴퓨터 브라우저의 연습 예시"],
  ["action", "무엇을 눌렀나요?", "예: 추가 내용 보기 버튼을 한 번 눌렀어요"],
  ["expected", "무엇이 나타나야 하나요?", "예: 추가 내용 목록"],
  ["actual", "실제로 무엇이 보였나요?", "예: 버튼은 그대로 있고 추가 목록은 안 보였어요"],
] as const;

export function WorkbookDebugLesson({
  project,
  record,
  onChange,
  onBack,
  onStep,
  onComplete,
}: PublishLessonProps) {
  const [screen, setScreen] = useWorkbookLessonState("publish-debug-screen", 0);
  const report = JSON.stringify(fields.map(([key]) => record[key]));
  const [basis, setBasis] = useWorkbookLessonState(
    "publish-debug-report",
    record.request ? report : "",
  );
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const id = useId();
  const progress = publishProgress(record);
  const stale = Boolean(record.request && basis && basis !== report);
  const blocked =
    !progress.addressed ||
    (screen === 0 && !record.issueChecked) ||
    (screen === 1 && (!record.device.trim() || !record.action.trim())) ||
    (screen === 2 && !progress.reportReady) ||
    (screen === 3 && (!progress.reportReady || !record.request.trim())) ||
    (screen === 4 && !record.fixed) ||
    (screen === 5 && !record.verified) ||
    (screen >= 6 && !progress.verified);
  const opened = record.fixed && record.verified;
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [screen]);
  function move(next: number) {
    setScreen(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function patch(value: Partial<PublishRecord>) {
    if (Object.entries(value).every(([key, next]) => record[key as keyof PublishRecord] === next))
      return;
    onChange({ ...record, ...value });
  }
  function updateRequest(request: string) {
    setBasis(report);
    if (record.request !== request) patch({ request, fixed: false, verified: false });
  }
  function issue() {
    if (record.fixed) patch({ verified: true });
    else patch({ issueChecked: true });
  }
  function example() {
    return (
      <section className={system.preview} role="region" aria-label="운영 오류 예시">
        <small>{project.title} · 학습용 예시</small>
        <h3>추가 내용 목록 · {record.fixed ? "수정한 예시" : "연습용 결함"}</h3>
        <div className={system.practiceActions}>
          <button aria-expanded={opened} aria-controls={`${id}-extra`} onClick={issue}>
            추가 내용 보기
          </button>
        </div>
        <div id={`${id}-extra`} hidden={!opened}>
          <p>추가 내용 목록이 나타났어요.</p>
          <ul>
            <li>버튼 동작을 확인한 기록</li>
          </ul>
        </div>
        <p role="status">
          {opened
            ? "같은 버튼을 다시 눌러 수정 결과를 확인했어요."
            : record.fixed
              ? "예시 버튼을 고쳤어요. 다시 눌러 결과를 확인해요."
              : record.issueChecked
                ? "버튼을 눌렀지만 추가 목록이 나타나지 않았어요."
                : "추가 내용 보기를 눌러보세요."}
        </p>
      </section>
    );
  }
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="publish"
        point={2}
        headingRef={heading}
        onBack={onBack}
        current={screen + 1}
        total={8}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        <h2 className={system.screenTitle}>{titles[screen]}</h2>
        {!progress.addressed ? (
          <section className={system.practiceStage}>
            <p>
              먼저 5-2에서 두 주소 예시를 비교하고 이유를 남겨주세요. 기존 문제 기록과 요청은
              유지돼요.
            </p>
            <div className={system.practiceActions}>
              <button onClick={() => onStep(1)}>5-2 주소 비교로 돌아가기</button>
            </div>
          </section>
        ) : (
          <>
            {screen === 0 && (
              <section className={system.practiceStage}>
                <p>
                  같은 행동을 해 같은 현상이 나는지 확인하는 것을 <strong>재현</strong>이라고 해요.
                  아래의 추가 내용 보기 버튼을 눌러보세요.
                </p>
                <p>
                  처음부터 원인을 맞힐 필요는 없어요. ‘서버 문제 같아요’라고 추측하기보다{" "}
                  <strong>어디까지 되고 어디부터 안 되는지</strong> 나눠 말하면 원인을 좁히기
                  쉬워요. 이번에는 페이지는 보이지만 버튼만 반응하지 않는 경우를 연습합니다.
                </p>
                {example()}
                <p className={system.recapScope}>
                  이 버튼에는 연습용 결함을 넣었어요. 내 실제 페이지의 오류를 찾았다는 뜻은
                  아니에요. 이미 수정한 기록이 있다면 그 상태로 이어져요.
                </p>
                <details className={system.preparationMore}>
                  <summary>실제 공개 페이지에서 문제가 생겼다면</summary>
                  <p>
                    같은 공개 주소에서 어떤 화면·어떤 행동일 때 생기는지 다시 살펴보세요. 확인한
                    현상만 기록하고, 문제가 없으면 없는 오류를 만들거나 수정할 필요는 없어요.
                  </p>
                </details>
              </section>
            )}
            {(screen === 1 || screen === 2) && (
              <section className={system.practiceStage}>
                <p data-current-action tabIndex={-1}>
                  {screen === 1
                    ? "다른 사람도 같은 행동을 해볼 수 있게 화면 조건과 누른 곳을 적어주세요."
                    : "일어나길 바란 일과 실제로 본 일을 구분해 적어주세요."}
                </p>
                {fields
                  .slice(screen === 1 ? 0 : 2, screen === 1 ? 2 : 4)
                  .map(([key, label, placeholder]) => (
                    <label key={key} className={system.practiceField} htmlFor={`${id}-${key}`}>
                      {label}
                      {screen === 1 ? (
                        <input
                          id={`${id}-${key}`}
                          value={record[key]}
                          placeholder={placeholder}
                          onChange={(event) => {
                            if (record[key] !== event.target.value)
                              patch({ [key]: event.target.value, fixed: false, verified: false });
                          }}
                        />
                      ) : (
                        <textarea
                          id={`${id}-${key}`}
                          rows={2}
                          value={record[key]}
                          placeholder={placeholder}
                          onChange={(event) => {
                            if (record[key] !== event.target.value)
                              patch({ [key]: event.target.value, fixed: false, verified: false });
                          }}
                        />
                      )}
                    </label>
                  ))}
                {screen === 1 && (
                  <p>
                    페이지가 안 열리면 접속한 주소와 오류 안내를, 사진만 없으면 어느 사진인지와 다른
                    내용은 보이는지를 알려주세요. 버튼 문제라면 누른 곳과 그 뒤의 반응을 설명하면
                    돼요. <strong>원인 추측보다 관찰한 현상</strong>이 먼저예요.
                  </p>
                )}
                {screen === 2 && (
                  <p className={system.planningHint}>
                    ‘안 돼요’ 대신 ‘목록이 나타나야 하는데 버튼만 그대로 보여요’처럼 적으면 요청이
                    분명해져요.
                  </p>
                )}
              </section>
            )}
            {screen === 3 && (
              <section className={system.practiceStage}>
                {stale && (
                  <p className={system.quizFeedback} role="status">
                    <strong>문제 기록이 바뀌었어요.</strong> 편집한 요청은 보존했어요. 바뀐
                    조건·현상을 요청에도 맞춰주세요.
                  </p>
                )}
                <div className={system.practiceActions}>
                  <button
                    disabled={!progress.reportReady}
                    onClick={() =>
                      updateRequest(
                        `“${project.title}” 학습 예시에서 확인한 문제야.\n화면: ${record.device}\n행동: ${record.action}\n기대: ${record.expected}\n실제: ${record.actual}\n\n추가 내용 보기 버튼만 고쳐줘. ‘추가 내용 보기’ 버튼 이름은 유지해줘. 같은 버튼을 다시 눌렀을 때 추가 목록이 나타나는지 확인하고 달라진 점을 알려줘.`,
                      )
                    }
                  >
                    {record.request
                      ? "현재 문제 기록으로 요청 초안 바꾸기"
                      : "문제 기록으로 수정 요청 만들기"}
                  </button>
                </div>
                <label className={system.practiceField} htmlFor={`${id}-request`}>
                  예시 버튼의 수정 요청
                  <textarea
                    id={`${id}-request`}
                    rows={6}
                    value={record.request}
                    onChange={(event) => updateRequest(event.target.value)}
                  />
                </label>
                <p className={system.planningHint}>
                  {record.request
                    ? "다시 만들면 직접 편집한 요청도 현재 기록의 초안으로 교체돼요. 이미 맞는 요청은 그대로 사용해도 괜찮아요."
                    : "버튼을 누르면 네 항목을 준비된 요청 틀에 넣어요. AI를 호출하거나 파일을 바꾸지는 않아요."}
                </p>
              </section>
            )}
            {screen === 4 && (
              <section className={system.practiceStage}>
                <table
                  className={`${system.aiResultTable} ${system.aiCheckTable}`}
                  aria-label="수정 범위 확인"
                >
                  <tbody>
                    <tr>
                      <th scope="row">바꿀 부분</th>
                      <td>추가 내용 보기 버튼의 목록 표시</td>
                    </tr>
                    <tr>
                      <th scope="row">유지할 부분</th>
                      <td>‘추가 내용 보기’ 버튼 이름</td>
                    </tr>
                    <tr>
                      <th scope="row">다시 확인</th>
                      <td>같은 버튼으로 추가 목록이 나타나는지</td>
                    </tr>
                  </tbody>
                </table>
                <details className={system.preparationMore}>
                  <summary>내가 쓴 수정 요청 보기</summary>
                  <p style={{ whiteSpace: "pre-wrap" }}>{record.request}</p>
                </details>
                <div className={system.practiceActions}>
                  <button
                    disabled={!progress.reportReady || !record.request.trim() || record.fixed}
                    onClick={() => patch({ fixed: true, verified: false })}
                  >
                    {record.fixed ? "예시 버튼 수정 적용됨" : "예시 버튼 수정 적용하기"}
                  </button>
                </div>
                <p className={system.aiKeyTakeaway}>
                  준비된 예시 버튼만 고쳐요.{" "}
                  <strong>입력한 요청을 AI가 실행한 결과나 실제 파일 수정은 아니에요.</strong>
                </p>
              </section>
            )}
            {screen === 5 && (
              <section className={system.practiceStage}>
                <p>
                  완료 안내만 보고 끝내지 말고 <strong>같은 추가 내용 보기 버튼</strong>을 다시 눌러
                  결과를 확인하세요.
                </p>
                {record.fixed ? (
                  example()
                ) : (
                  <div className={system.practiceActions}>
                    <button onClick={() => move(4)}>수정 적용으로 돌아가기</button>
                  </div>
                )}
                <p className={system.planningHint}>수정 전과 같은 버튼으로 비교해요.</p>
              </section>
            )}
            {screen === 6 && (
              <section className={system.practiceStage}>
                <p data-current-action tabIndex={-1}>
                  같은 버튼을 누르기 전후에 무엇이 달라졌는지 적어주세요.
                </p>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>처음 본 결과</dt>
                    <dd>{record.actual}</dd>
                  </div>
                  <div>
                    <dt>다시 확인할 기준</dt>
                    <dd>{record.expected}</dd>
                  </div>
                </dl>
                <label className={system.practiceField} htmlFor={`${id}-comparison`}>
                  예시 버튼을 다시 눌러 확인한 변화
                  <textarea
                    id={`${id}-comparison`}
                    rows={4}
                    value={record.comparison}
                    onChange={(event) => patch({ comparison: event.target.value })}
                    placeholder="예: 전에는 목록이 안 보였고, 수정 후 같은 버튼을 누르니 추가 목록이 나타났어요."
                  />
                </label>
                {!record.verified && (
                  <div className={system.practiceActions}>
                    <button onClick={() => move(record.fixed ? 5 : 4)}>
                      수정과 재확인으로 돌아가기
                    </button>
                  </div>
                )}
              </section>
            )}
            {screen === 7 && (
              <>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>처음 기록한 문제</dt>
                    <dd>{record.actual}</dd>
                  </div>
                  <div>
                    <dt>다시 확인한 변화</dt>
                    <dd>{record.comparison}</dd>
                  </div>
                </dl>
                <p className={system.aiKeyTakeaway}>
                  <strong>
                    조건과 현상을 기록하고, 한 부분을 요청한 뒤 같은 행동으로 다시 확인해요.
                  </strong>
                </p>
                <section className={system.nextLesson}>
                  <small>다음 화면</small>
                  <h3>클래스 학습 정리</h3>
                  <p>
                    학습한 내용과 내 프로젝트에서 확인한 결과, 실제 공개까지 남은 일을 나눠
                    살펴봐요.
                  </p>
                </section>
                <p>
                  이제 책 모음이나 작업 소개처럼 다른 소재에도{" "}
                  <strong>내용 정하기 → 요청하기 → 결과를 읽고 필요한 변화 설명하기</strong>를
                  활용할 수 있어요. 예시로 익힌 기준은 실제 제작에서도 이어집니다.
                </p>
                <details className={system.preparationMore}>
                  <summary>선택 · 내 파일 적용과 심화 실습</summary>
                  <WorkbookApplicationRecord stage="publish" />
                  <WorkbookPracticalLab stage="publish" />
                </details>
                <p className={system.recapScope}>
                  이번 기록은 예시 문제 해결이에요. 실제 파일 수정·공개 주소 접속·재배포 완료로
                  기록하지 않아요.
                </p>
                {!progress.verified && (
                  <div className={system.practiceActions}>
                    <button onClick={() => move(record.fixed ? 5 : 4)}>
                      수정과 재확인으로 돌아가기
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>같은 행동으로 해결 여부 확인</h2>
          <p>문제 재현·기록·요청과 수정 후 확인을 순서대로 이어가요.</p>
          <small>연습용 결함 · 실제 파일 수정 별도</small>
        </div>
        <WorkbookActionReturn
          body={body}
          enabled={screen === 1 || screen === 2 || screen === 3 || screen === 6}
        />
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={screen + 1}>
            <button onClick={() => (screen > 0 ? move(screen - 1) : onStep(1))}>
              {screen > 0 ? "이전 설명" : "5-2 주소와 배포로"}
            </button>
          </WorkbookLessonPrevious>
          {screen < 7 ? (
            <button disabled={blocked} onClick={() => move(screen + 1)}>
              다음으로
            </button>
          ) : (
            <button disabled={!progress.verified} onClick={onComplete}>
              학습 기록하고 클래스 정리로 →
            </button>
          )}
        </nav>
      </aside>
    </section>
  );
}

"use client";

import { useEffect, useId, useRef } from "react";
import { workbookLessonLabel } from "@/lib/workbook-course";
import { publishProgress } from "@/lib/workbook-publish";
import type { PublishLessonProps } from "./WorkbookPublishLesson";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";
import { WorkbookActionReturn } from "./WorkbookActionReturn";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const titles = [
  "주소를 보내는 것과 공개하는 것은 달라요",
  "두 주소를 친구 기기에서 열어본다면?",
  "실제 배포는 파일을 올리고 확인하는 일",
  "주소만으로 배포가 되지 않는 이유",
  "공개한 뒤에도 다시 확인해요",
];
const addresses = [
  ["내 컴퓨터 주소", "http://localhost:3211"],
  ["공개 서버 주소 예시", "https://my-work.example.invalid"],
] as const;

export function WorkbookAddressLesson({ record, onChange, onBack, onStep }: PublishLessonProps) {
  const [screen, setScreen] = useWorkbookLessonState("publish-address-screen", 0);
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const id = useId();
  const progress = publishProgress(record);
  const blocked =
    !progress.inspected ||
    (screen === 1 && !record.visited.every(Boolean)) ||
    (screen >= 3 && !progress.addressed);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [screen]);
  function move(next: number) {
    setScreen(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function simulate() {
    if (record.addressChoice === null) return;
    onChange({
      ...record,
      addressResult: record.addressChoice,
      visited: record.visited.map((value, index) => value || index === record.addressChoice),
    });
  }
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="publish"
        point={1}
        headingRef={heading}
        onBack={onBack}
        current={screen + 1}
        total={5}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        <h2 className={system.screenTitle}>{titles[screen]}</h2>
        {!progress.inspected ? (
          <section className={system.practiceStage}>
            <p>
              먼저 5-1에서 공개할 내용과 두 화면·버튼을 점검해주세요. 기존 기획과 기록은 유지돼요.
            </p>
            <div className={system.practiceActions}>
              <button onClick={() => onStep(0)}>5-1 점검으로 돌아가기</button>
            </div>
          </section>
        ) : (
          <>
            {screen === 0 && (
              <section className={system.practiceStage}>
                <p>
                  5-1에서 페이지를 읽고 눌러봤어요. 이제{" "}
                  <strong>다른 사람이 어디에서 내 페이지를 읽을지</strong> 생각해봐요.
                </p>
                <table
                  className={`${system.aiResultTable} ${system.aiCheckTable}`}
                  aria-label="주소 호스팅 배포의 의미"
                >
                  <thead>
                    <tr>
                      <th scope="col">이름</th>
                      <th scope="col">의미</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">주소</th>
                      <td>브라우저가 어디로 접속할지 알려주는 위치예요.</td>
                    </tr>
                    <tr>
                      <th scope="row">호스팅</th>
                      <td>다른 사람이 접속할 수 있는 서버에 웹사이트를 두는 것이에요.</td>
                    </tr>
                    <tr>
                      <th scope="row">배포</th>
                      <td>만든 파일의 버전을 그곳에 올려 사용할 수 있게 하는 일이에요.</td>
                    </tr>
                  </tbody>
                </table>
                <p>
                  친구에게 내 컴퓨터의 문서 위치만 알려줘도 친구 컴퓨터에 그 파일이 생기지는 않죠.
                  웹페이지도 다른 사람이 읽을 수 있는 곳에 두는 과정이 필요해요.
                </p>
                <p>
                  <strong>내 파일 → 호스팅 서버에 배포 → 공개 주소로 접속 → 방문자의 화면</strong>
                  으로 이어집니다. 주소는 찾아가는 위치이고, 배포는 그곳에서 사용할 버전을 반영하는
                  일이에요.
                </p>
                <p className={system.aiKeyTakeaway}>
                  <strong>주소를 적거나 보내는 것만으로</strong> 내 컴퓨터의 파일이 공개되지는
                  않아요.
                </p>
                <details className={system.preparationMore}>
                  <summary>file 주소와 localhost는 무엇인가요?</summary>
                  <p>
                    <code>file:///…/index.html</code>은 그 기기에 있는 파일의 위치예요.{" "}
                    <code>localhost</code>는 주소를 연 기기 자신을 가리켜요. 친구에게 내 localhost
                    주소를 보내도 친구의 컴퓨터가 내 파일을 읽는 것은 아니에요.
                  </p>
                </details>
                <p className={system.recapScope}>
                  이 수업은 주소와 공개 흐름을 비교하는 예시예요. 파일을 업로드하거나 실제 사이트를
                  만들지 않아요.
                </p>
              </section>
            )}
            {screen === 1 && (
              <section className={system.practiceStage}>
                <p>
                  주소 하나를 고르고 <strong>접속 예시 확인하기</strong>를 눌러 결과를 비교해보세요.
                </p>
                <section className={system.learningGroup} aria-label="주소 선택과 접속 예시 실행">
                  <div className={system.choices} role="group" aria-label="공유 주소 예시">
                    {addresses.map(([label, url], index) => (
                      <button
                        key={url}
                        className={system.choice}
                        aria-label={`${label} · ${url}`}
                        aria-pressed={record.addressChoice === index}
                        onClick={() => onChange({ ...record, addressChoice: index })}
                      >
                        <span>
                          <strong>{label}</strong>{" "}
                          <span className={system.planningHint}>
                            · {record.visited[index] ? "확인 완료" : "확인 전"}
                          </span>
                          <br />
                          {url}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className={system.practiceActions}>
                    <button disabled={record.addressChoice === null} onClick={simulate}>
                      접속 예시 확인하기
                    </button>
                  </div>
                </section>
                <section
                  className={system.preview}
                  role="region"
                  aria-label="주소별 접속 결과 예시"
                  aria-live="polite"
                >
                  <h3>
                    {record.addressResult === null
                      ? "아직 확인한 주소가 없어요"
                      : `${addresses[record.addressResult][0]} · 마지막 확인 결과`}
                  </h3>
                  <p>
                    {record.addressResult === null
                      ? "두 주소를 각각 골라 예시 결과를 확인해주세요."
                      : record.addressResult === 0
                        ? "친구의 localhost는 친구 컴퓨터를 가리켜요. 이 주소로 내 컴퓨터의 페이지를 읽는 것은 아니에요."
                        : "파일을 공개 서버에 올려 접속 가능하게 했다면 친구도 읽을 수 있어요. 지금은 설명용 결과이며 실제 접속 확인은 아니에요."}
                  </p>
                </section>
                <p className={system.planningHint}>
                  접속할 수 없는 설명용 주소예요. 실제 네트워크 접속은 하지 않아요.
                </p>
              </section>
            )}
            {screen === 2 && (
              <section className={system.practiceStage}>
                <ol className={system.decisionSteps}>
                  <li>
                    <strong>공개할 파일 준비</strong>
                    <span>5-1처럼 내용·자료·두 화면·버튼을 점검해요.</span>
                  </li>
                  <li>
                    <strong>호스팅에 파일 올리기</strong>
                    <span>공개할 페이지 파일을 올리고 접속할 수 있는 주소를 받아요.</span>
                  </li>
                  <li>
                    <strong>받은 주소 직접 열기</strong>
                    <span>내 파일 위치나 localhost가 아니라 받은 공개 주소인지 확인해요.</span>
                  </li>
                  <li>
                    <strong>다른 기기에서도 확인</strong>
                    <span>같은 제목·소개·목록이 보이는지, 버튼이 동작하는지 확인해요.</span>
                  </li>
                </ol>
                <p className={system.aiKeyTakeaway}>
                  파일 업로드가 끝났다는 안내 뒤에도 <strong>실제 주소에서 내용과 동작</strong>을
                  확인해야 해요.
                </p>
                <details className={system.preparationMore}>
                  <summary>공개한 파일을 수정했다면?</summary>
                  <p>
                    오늘 내 컴퓨터에서 제목을 바꿨어도 공개 서버에는 어제 파일이 남아 있을 수
                    있어요. 같은 사이트에 새 버전을 반영한 뒤 대표 주소에서 다시 확인해요.{" "}
                    <strong>내 파일과 공개된 파일은 서로 다른 버전일 수 있기 때문</strong>이에요. 이
                    수업에서는 배포 서비스를 고르거나 업로드하지 않아요.
                  </p>
                </details>
              </section>
            )}
            {screen === 3 && (
              <section className={system.practiceStage}>
                <p data-current-action tabIndex={-1}>
                  내 컴퓨터 주소를 보내는 것과 실제 공개가 어떻게 다른지 한 가지를 적어주세요.
                </p>
                <table
                  className={`${system.aiResultTable} ${system.aiCheckTable}`}
                  aria-label="주소별 파일 위치 비교"
                >
                  <tbody>
                    <tr>
                      <th scope="row">localhost</th>
                      <td>주소를 연 기기 자신의 웹 서버를 가리켜요.</td>
                    </tr>
                    <tr>
                      <th scope="row">공개 주소</th>
                      <td>다른 사람이 접속할 수 있게 둔 사이트를 찾아가요.</td>
                    </tr>
                  </tbody>
                </table>
                <label className={system.practiceField} htmlFor={`${id}-reason`}>
                  주소와 실제 배포가 다른 이유
                  <textarea
                    id={`${id}-reason`}
                    rows={4}
                    value={record.addressReason}
                    onChange={(event) => onChange({ ...record, addressReason: event.target.value })}
                    placeholder="파일을 어디에 두고, 어느 주소에서 확인해야 하나요?"
                  />
                </label>
              </section>
            )}
            {screen === 4 && (
              <>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>비교한 것</dt>
                    <dd>내 컴퓨터 주소와 공개 주소</dd>
                  </div>
                  <div>
                    <dt>내가 정리한 이유</dt>
                    <dd>{record.addressReason}</dd>
                  </div>
                </dl>
                <p className={system.aiKeyTakeaway}>
                  공개 후 문제를 발견하면{" "}
                  <strong>같은 현상을 확인하고, 고친 뒤 다시 눌러봐요.</strong>
                </p>
                <section className={system.nextLesson}>
                  <small>다음 수업</small>
                  <h3>{workbookLessonLabel("publish", 2)}</h3>
                  <p>버튼 문제 예시를 재현하고, 구체적인 수정 요청과 재확인을 연습해요.</p>
                </section>
                <p className={system.recapScope}>
                  이번 기록은 주소 비교 학습이에요. 실제 배포·다른 기기 접속·공유 완료로 기록하지
                  않아요.
                </p>
              </>
            )}
          </>
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>파일의 위치와 접속 주소 구분</h2>
          <p>주소를 비교하고 실제 배포의 준비·업로드·확인 순서를 알아봐요.</p>
          <small>접속 결과는 설명용 예시</small>
        </div>
        <WorkbookActionReturn body={body} enabled={screen === 3} />
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={screen + 1}>
            <button onClick={() => (screen > 0 ? move(screen - 1) : onStep(0))}>
              {screen > 0 ? "이전 설명" : "5-1 공개 전 점검으로"}
            </button>
          </WorkbookLessonPrevious>
          {screen < 4 ? (
            <button disabled={blocked} onClick={() => move(screen + 1)}>
              다음으로
            </button>
          ) : (
            <button disabled={!progress.addressed} onClick={() => onStep(2)}>
              공개 후 문제 해결로 →
            </button>
          )}
        </nav>
      </aside>
    </section>
  );
}

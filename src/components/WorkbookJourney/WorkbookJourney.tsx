"use client";

// 지도 이동, 실제 CSS 실험, 퀴즈와 브라우저 기록을 한 여정으로 연결한다.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { initialProgress, stops } from "@/lib/workbook-journey";
import { useJourneyProgress } from "./useJourneyProgress";
import styles from "./WorkbookJourney.module.scss";
import { ResponsivePagePreview } from "./ResponsivePagePreview";

const route = [
  [22, 60],
  [36, 60],
  [36, 43],
  [50, 43],
  [63, 43],
  [63, 60],
  [78, 60],
];
const routeStops = [0, 3, 6];
const requestText =
  "소개 페이지가 휴대폰에서 가로로 넘쳐요. 고정 너비를 화면에 맞는 유연한 너비로 바꾸고, 좁은 화면에서는 카드가 세로로 배치되게 해줘. 넓은 화면에서는 가로 배치를 유지해줘. 긴 제목과 주요 버튼이 잘리지 않는지 두 화면에서 확인해줘.";
export function WorkbookJourney() {
  const { progress, ready, storageError, update } = useJourneyProgress();
  const [position, setPosition] = useState([22, 60]);
  const [moving, setMoving] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [screen, setScreen] = useState<"mobile" | "desktop">("mobile");
  const [fluid, setFluid] = useState(false);
  const [stack, setStack] = useState(false);
  const [mobileChecked, setMobileChecked] = useState(false);
  const [desktopChecked, setDesktopChecked] = useState(false);
  const [quiz, setQuiz] = useState<number | null>(null);
  const [story, setStory] = useState(false);
  const [message, setMessage] = useState("");
  const [resetConfirm, setResetConfirm] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const timer = useRef<number | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  useEffect(
    () => () => {
      if (timer.current) cancelAnimationFrame(timer.current);
    },
    [],
  );
  const current = stops[progress.chapter];
  const shownPosition = moving ? position : [current.x, current.y];
  function travel(target: number) {
    if (moving || target > progress.completed) return;
    setMessage("");
    const arrive = () => {
      update({ ...progress, chapter: target });
      setMoving(false);
      requestAnimationFrame(() => {
        heading.current?.focus();
        heading.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
      });
    };
    if (
      target === progress.chapter ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      arrive();
      return;
    }
    let index = routeStops[progress.chapter];
    const end = routeStops[target];
    const step = end > index ? 1 : -1;
    setPosition(route[index]);
    setFacingLeft(step < 0);
    setMoving(true);
    let startedAt: number | null = null;
    const tick = (now: number) => {
      if (startedAt === null) startedAt = now;
      const from = route[index];
      const to = route[index + step];
      const duration = Math.hypot(to[0] - from[0], to[1] - from[1]) * 65;
      const ratio = Math.min(1, (now - startedAt) / duration);
      setPosition([from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio]);
      if (ratio === 1) {
        index += step;
        startedAt = now;
        if (index === end) {
          timer.current = null;
          arrive();
          return;
        }
      }
      timer.current = requestAnimationFrame(tick);
    };
    timer.current = requestAnimationFrame(tick);
  }
  function complete(stage: number) {
    update({ ...progress, completed: Math.max(progress.completed, stage + 1) });
    setMessage("");
  }
  function changeExperiment(type: "fluid" | "stack", value: boolean) {
    if (type === "fluid") setFluid(value);
    else setStack(value);
    setMobileChecked(false);
    setDesktopChecked(false);
    setMessage("");
  }
  function checkPreview() {
    const element = preview.current;
    if (screen === "mobile") {
      if (!fluid || !stack || (element && element.scrollWidth > element.clientWidth + 1)) {
        setMessage(
          !fluid
            ? "페이지 자체가 560px로 고정되어 있어요. 화면에 맞는 너비부터 골라볼까요?"
            : "카드가 나란히 놓여 좁은 화면 밖으로 나가요. 휴대폰에서는 세로로 놓아보세요.",
        );
      } else {
        setMobileChecked(true);
        setMessage("휴대폰에서 제목과 버튼이 모두 보여요. 넓은 화면도 확인해봐요.");
      }
    } else {
      if (!fluid || !stack) {
        setMessage("넓은 화면은 괜찮지만 휴대폰 문제는 아직 남아 있어요.");
        return;
      }
      setDesktopChecked(true);
      setMessage("넓은 화면에서는 카드가 나란히 유지돼요.");
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(requestText);
      setMessage("요청 문장을 복사했어요.");
    } catch {
      setMessage("자동 복사가 안 돼요. 아래 문장을 직접 선택해 복사해주세요.");
    }
  }
  if (!ready)
    return (
      <main className={styles.page}>
        <p role="status">여정을 불러오는 중이에요.</p>
      </main>
    );
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/workbook">← 나의 워크북</Link>
          <p className={styles.eyebrow}>화면 배치를 바꿔보는 짧은 실험</p>
          <h1>작은 화면, 새로운 발견</h1>
          <p>카피바라가 보낸 첫 페이지. 휴대폰에서는 무슨 일이 생겼을까요?</p>
        </div>
        <span className={styles.counter}>{progress.completed} / 3 장소 탐험</span>
      </header>
      <div className={styles.map} aria-label="작은 웹의 마을 지도">
        <Image
          src="/images/workbook/journey/map.png"
          alt="가을빛 섬의 작업실, 정류장, 광장이 산책길로 연결된 픽셀 아트 지도"
          fill
          priority
          sizes="(min-width: 1024px) 80vw, 100vw"
        />
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className={styles.path}
          aria-hidden="true"
        >
          <polyline points="22,60 36,60 36,43 50,43 63,43 63,60 78,60" />
        </svg>
        {stops.map((stop, i) => (
          <button
            key={stop.title}
            className={styles.stop}
            style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
            disabled={moving || i > progress.completed}
            aria-current={i === progress.chapter ? "step" : undefined}
            onClick={() => travel(i)}
            aria-label={`${stop.title}${i > progress.completed ? " · 앞 장소를 마치면 열려요" : `${stop.particle} 이동`}`}
          >
            <span>{i < progress.completed ? "✓" : `0${i + 1}`}</span>
            <strong>{stop.title}</strong>
          </button>
        ))}
        <div
          className={`${styles.capy} ${moving ? styles.walking : ""}`}
          style={{ left: `${shownPosition[0]}%`, top: `${shownPosition[1]}%` }}
          aria-hidden="true"
        >
          <span className={styles.sprite} data-facing={facingLeft ? "left" : "right"} />
        </div>
        <span className={styles.mapCaption}>
          {moving ? "카피바라가 길을 따라 이동 중이에요…" : "장소를 누르면 함께 걸어가요"}
        </span>
      </div>
      <nav className={styles.stopList} aria-label="장소 목록">
        {stops.map((stop, i) => (
          <button
            key={stop.title}
            disabled={moving || i > progress.completed}
            onClick={() => travel(i)}
            aria-current={i === progress.chapter ? "step" : undefined}
          >
            {i < progress.completed ? "✓" : `0${i + 1}`} {stop.title}
            <small>{i > progress.completed ? "앞 장소를 마치면 열려요" : stop.subtitle}</small>
          </button>
        ))}
      </nav>
      <section
        className={styles.activity}
        aria-labelledby="activity-heading"
        aria-busy={moving}
        inert={moving}
      >
        <p className={styles.eyebrow}>
          0{progress.chapter + 1} / {current.title}
        </p>
        <h2 id="activity-heading" ref={heading} tabIndex={-1}>
          {current.subtitle}
        </h2>
        {progress.chapter === 0 && (
          <>
            <div className={styles.story}>
              <Image
                src="/images/workbook/study-v3.png"
                alt="노트북 앞에서 차를 마시는 카피바라"
                width={800}
                height={450}
              />
              <div>
                <small>카피바라의 작업실 · 짧은 이야기</small>
                <h3>“드디어 내 작업실 페이지를 만들었어.”</h3>
                <p>
                  컴퓨터에서는 사진도, 소개도 마음에 들어요. 카피바라는 친구에게 링크를 보냈어요.
                </p>
                <button className={styles.secondary} onClick={() => setStory(true)}>
                  {story ? "친구의 답장을 다시 보기" : "친구의 답장 보기"}
                </button>
                {story && (
                  <blockquote>
                    “사진 예쁘다! 그런데 폰에서는 옆으로 밀어야 보여. 문의 버튼은 어디 있어?”
                  </blockquote>
                )}
              </div>
            </div>
            {story && (
              <div className={styles.note}>
                <h3>컴퓨터에서 괜찮으면, 휴대폰에서도 괜찮을까요?</h3>
                <p>
                  글과 사진은 같아도 화면의 너비는 달라요. 정류장으로 가서 친구의 화면을 직접
                  살펴봐요.
                </p>
                <button
                  className={styles.primary}
                  onClick={() => {
                    complete(0);
                    setMessage("정류장이 열렸어요. 지도나 아래 버튼에서 이동해보세요.");
                  }}
                >
                  이야기 확인하기
                </button>
              </div>
            )}
            {progress.completed >= 1 && (
              <button className={styles.secondary} onClick={() => travel(1)}>
                정류장으로 걸어가기 →
              </button>
            )}
          </>
        )}
        {progress.chapter === 1 && (
          <>
            <p>
              한 번에 하나씩 바꿔보세요. 아래 화면은 실제 CSS로 배치되는 연습용 소개 페이지예요.
            </p>
            <div className={styles.lab}>
              <div>
                <div className={styles.segment} aria-label="미리보기 화면 크기">
                  {(["mobile", "desktop"] as const).map((s) => (
                    <button
                      key={s}
                      aria-pressed={screen === s}
                      onClick={() => {
                        setScreen(s);
                        setMessage("");
                      }}
                    >
                      {s === "mobile" ? "휴대폰 280px" : "넓은 화면 560px"}
                    </button>
                  ))}
                </div>
                <ResponsivePagePreview
                  screen={screen}
                  fluid={fluid}
                  stack={stack}
                  previewRef={preview}
                  onButton={() =>
                    setMessage(
                      "문의 버튼까지 확인했어요. 실제 서비스라면 이동한 화면도 확인해야 해요.",
                    )
                  }
                />
                <small className={styles.muted}>
                  넓은 화면이 기기보다 크면 바깥 영역을 좌우로 밀어 확인하세요.
                </small>
              </div>
              <div className={styles.settings}>
                <fieldset>
                  <legend>페이지 너비</legend>
                  <button aria-pressed={!fluid} onClick={() => changeExperiment("fluid", false)}>
                    560px로 고정
                  </button>
                  <button aria-pressed={fluid} onClick={() => changeExperiment("fluid", true)}>
                    화면에 맞추기
                  </button>
                </fieldset>
                <fieldset>
                  <legend>휴대폰의 카드 배치</legend>
                  <button aria-pressed={!stack} onClick={() => changeExperiment("stack", false)}>
                    가로 유지
                  </button>
                  <button aria-pressed={stack} onClick={() => changeExperiment("stack", true)}>
                    좁을 때 세로
                  </button>
                </fieldset>
                <button className={styles.primary} onClick={checkPreview}>
                  현재 화면 확인하기
                </button>
                <ul>
                  <li>{mobileChecked ? "✓" : "○"} 휴대폰의 넘침 확인</li>
                  <li>{desktopChecked ? "✓" : "○"} 넓은 화면의 배치 확인</li>
                </ul>
                <details>
                  <summary>왜 두 가지를 바꾸나요?</summary>
                  <p>
                    유연한 너비는 페이지가 화면에 맞게 줄어들도록 해요. 카드의 배치도 좁은 공간에
                    맞춰 바꿔야 내용이 넘치지 않아요. 실제 프로젝트에서는 미디어 쿼리로 화면 폭에
                    따라 규칙을 적용할 수 있어요.
                  </p>
                </details>
              </div>
            </div>
            {mobileChecked && desktopChecked && (
              <div className={styles.note}>
                <h3>작은 화면과 큰 화면, 둘 다 확인했어요.</h3>
                <p>같은 내용을 화면에 맞게 배치하는 반응형 디자인을 경험했어요.</p>
                <button
                  className={styles.primary}
                  onClick={() => {
                    complete(1);
                    setMessage("광장이 열렸어요. 이번 발견을 내 작업으로 옮겨봐요.");
                  }}
                >
                  실험 마치기
                </button>
              </div>
            )}
            {progress.completed >= 2 && (
              <button className={styles.secondary} onClick={() => travel(2)}>
                광장으로 걸어가기 →
              </button>
            )}
          </>
        )}
        {progress.chapter === 2 && (
          <>
            <p>다음에는 제목이 더 긴 카드가 들어온대요. 이제 무엇을 확인하면 좋을까요?</p>
            <fieldset className={styles.quiz}>
              <legend>다른 상황에도 적용해보기</legend>
              {[
                "글자를 아주 작게 줄이면 모두 해결돼요.",
                "긴 제목을 넣고 좁은 화면과 넓은 화면을 다시 확인해요.",
                "AI가 완료했다고 하면 확인을 마쳐도 돼요.",
              ].map((answer, i) => (
                <button key={answer} aria-pressed={quiz === i} onClick={() => setQuiz(i)}>
                  {answer}
                </button>
              ))}
            </fieldset>
            {quiz !== null && (
              <p role="status" className={styles.feedback}>
                {quiz === 1
                  ? "맞아요. 배치를 고쳐도 내용이 달라지면 다시 확인해야 해요."
                  : "읽기 쉬운지와 실제 동작은 직접 살펴봐야 해요. 내용이 달라진 상황까지 확인할 선택을 찾아보세요."}
              </p>
            )}
            <div className={styles.note}>
              <h3>내 페이지에서 써보기</h3>
              <p>
                실제 AI 호출은 여기서 하지 않아요. 사용 중인 도구에 아래 요청을 내 상황에 맞게 바꿔
                전달해보세요.
              </p>
              <label htmlFor="journey-prompt">수정 요청 예시</label>
              <textarea id="journey-prompt" value={requestText} readOnly rows={5} />
              <button className={styles.secondary} onClick={copy}>
                요청 문장 복사
              </button>
            </div>
            <label htmlFor="discovery">
              오늘 발견한 것 한 줄 <span className={styles.muted}>(선택)</span>
            </label>
            <textarea
              id="discovery"
              maxLength={1200}
              rows={3}
              value={progress.note}
              onChange={(e) => update({ ...progress, note: e.target.value })}
              placeholder="예: 화면 너비뿐 아니라 안에 있는 카드 배치도 확인해야 한다."
            />
            <button
              className={styles.primary}
              disabled={quiz !== 1}
              onClick={() => {
                complete(2);
                setMessage("첫 여정을 마쳤어요. 발견은 이 브라우저에 남겨둘게요.");
              }}
            >
              예제 여정 완료하기
            </button>
            {progress.completed === 3 && (
              <div className={styles.note}>
                <h3>첫 여정을 마쳤어요.</h3>
                <p>
                  예제 완료와 내 프로젝트 적용은 달라요. 실제로 수정하고 두 화면을 확인했다면 아래에
                  표시해두세요.
                </p>
                <label>
                  <input
                    type="checkbox"
                    checked={progress.applied}
                    onChange={(e) => update({ ...progress, applied: e.target.checked })}
                  />{" "}
                  내 프로젝트에도 적용하고 확인했어요
                </label>
                <Link className={styles.secondary} href="/workbook">
                  내 발견을 가지고 홈으로 →
                </Link>
              </div>
            )}
          </>
        )}
        <p className={styles.feedback} role="status">
          {message}
        </p>
      </section>
      <footer className={styles.footer}>
        <p role={storageError ? "alert" : undefined}>
          {storageError
            ? "브라우저 저장이 막혀 있어요. 현재 화면에서는 계속할 수 있지만, 나가기 전에 메모를 복사해주세요."
            : "진행과 메모는 이 브라우저에만 저장돼요. 다른 기기와 동기화되지 않아요."}
        </p>
        <button disabled={moving} onClick={() => setResetConfirm(true)}>
          여정 초기화
        </button>
        {resetConfirm && (
          <div>
            <p>이 여정의 진행과 메모를 지울까요?</p>
            <button
              onClick={() => {
                update({ ...initialProgress });
                setStory(false);
                setFluid(false);
                setStack(false);
                setMobileChecked(false);
                setDesktopChecked(false);
                setQuiz(null);
                setMessage("");
                setResetConfirm(false);
              }}
            >
              기록 지우기
            </button>
            <button onClick={() => setResetConfirm(false)}>취소</button>
          </div>
        )}
      </footer>
    </main>
  );
}

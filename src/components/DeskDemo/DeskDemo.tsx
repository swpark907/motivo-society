"use client";

// 조작 결과·도전 피드백·클립보드 상태를 브라우저에서 즉시 갱신하는 학습 데모.
import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import styles from "./DeskDemo.module.scss";

type Direction = "row" | "column";
type Alignment = "flex-start" | "center" | "flex-end";
const deskItems = [
  { id: "book", name: "책" },
  { id: "cup", name: "찻잔" },
  { id: "plant", name: "화분" },
] as const;
const alignmentNames = { "flex-start": "시작", center: "가운데", "flex-end": "끝" };

export function DeskDemo() {
  const [direction, setDirection] = useState<Direction>("row");
  const [gap, setGap] = useState(8);
  const [alignment, setAlignment] = useState<Alignment>("flex-start");
  const [attempted, setAttempted] = useState(false);
  const [discovered, setDiscovered] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [hint, setHint] = useState(false);
  const [applied, setApplied] = useState(false);
  const [copied, setCopied] = useState("");
  const solved = direction === "row" && gap >= 16 && gap <= 32 && alignment === "center";
  const feedback = !attempted
    ? "우리, 함께 정리해볼까요?"
    : solved
      ? "딱 좋아요. 같은 간격으로 나란히, 책상 가운데 모였네요!"
      : direction !== "row"
        ? "먼저 가로 방향으로 바꿔볼까요? 세 물건이 나란히 놓일 거예요."
        : gap < 16
          ? "물건 사이에 조금 더 여유를 줘볼까요? 16px 이상이면 좋아요."
          : "이제 가운데 정렬을 골라 물건들을 중앙으로 모아봐요.";
  const code = `.${applied ? "cards" : "desk"} {\n  display: flex;\n  flex-direction: ${direction};\n  gap: ${gap}px;\n  justify-content: ${alignment};\n  align-items: center;\n}`;
  const prompt = `${applied ? "소개, 작업, 기록 카드를 순서대로 담은 영역" : "책, 찻잔, 화분을 순서대로 담은 영역"}을 CSS Flex로 만들어줘.\n방향은 ${direction === "row" ? "가로(row)" : "세로(column)"}, 물건 사이 간격은 ${gap}px, 주축 정렬은 ${alignmentNames[alignment]}(${alignment})로 해줘. 교차축은 가운데 정렬해줘.\n컨테이너에 여유 공간을 두고, 좁은 화면에서도 물건이 잘리지 않게 해줘. 변경한 CSS와 확인할 점도 알려줘.`;

  function change() {
    setCopied("");
  }
  function reset() {
    setDirection("row");
    setGap(8);
    setAlignment("flex-start");
    setAttempted(false);
    setDiscovered(false);
    setShowGuides(false);
    setHint(false);
    setApplied(false);
    setCopied("");
  }
  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied("요청 문장을 복사했어요.");
    } catch {
      setCopied("자동 복사가 안 돼요. 아래 문장을 직접 선택해 복사해주세요.");
    }
  }

  return (
    <main className={styles.demo}>
      <div className={styles.topline}>
        <Link href="/workbook">← 워크북 홈</Link>
        <span>
          PLAY LAB / 001 <span className={styles.pill}>학습 데모</span>
        </span>
      </div>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>A LITTLE SPACE, A LITTLE DISCOVERY</p>
          <h1>
            카피바라의
            <br className={styles.mobileBreak} /> 책상 정리
          </h1>
          <p>조금 움직이면, 새로운 규칙이 보여요.</p>
        </div>
        <span className={styles.duration}>약 3분 · 처음이어도 괜찮아요</span>
      </header>
      <ol className={styles.steps} aria-label="경험 순서">
        <li>
          <b>01</b> 만져보기
        </li>
        <li>
          <b>02</b> 작은 도전
        </li>
        <li>
          <b>03</b> 내 작업으로
        </li>
      </ol>
      <div className={styles.workspace}>
        <section className={styles.experiment} aria-labelledby="desk-title">
          <h2 id="desk-title" className={styles.srOnly}>
            오늘의 작은 작업실
          </h2>
          <div className={styles.scene}>
            <Image
              src="/images/workbook/desk/room-v3.png"
              alt="노을이 드는 작업실에서 책상 너머로 함께하는 카피바라"
              fill
              priority
              sizes="(min-width: 1024px) 74vw, 100vw"
              className={styles.roomImage}
            />
            <div className={styles.companion}>
              <p aria-live="polite">{feedback}</p>
            </div>
            <div className={styles.guideToolbar}>
              <span className={styles.sceneNote}>MAKE ROOM FOR IDEAS.</span>
              <button aria-pressed={showGuides} onClick={() => setShowGuides(!showGuides)}>
                영역·간격 {showGuides ? "숨기기" : "보기"}
              </button>
            </div>
            <div
              className={styles.deskViewport}
              data-direction={direction}
              tabIndex={direction === "column" ? 0 : undefined}
              role="region"
              aria-label={
                direction === "column" ? "세로 배치 영역, 위아래로 스크롤" : "Flex 배치 영역"
              }
            >
              <div
                className={`${styles.desk} ${showGuides ? styles.guides : ""}`}
                data-direction={direction}
                data-gap={`${gap}px`}
                role="group"
                aria-label="책상 위 물건"
                style={
                  {
                    flexDirection: direction,
                    gap,
                    justifyContent: alignment,
                    "--demo-gap": `${gap}px`,
                  } as CSSProperties
                }
              >
                {deskItems.map((item) => (
                  <div key={item.id} className={styles.object} data-gap={`${gap}px`}>
                    <Image
                      src={`/images/workbook/desk/${item.id}.png`}
                      alt=""
                      width={240}
                      height={240}
                      sizes="(min-width: 1024px) 180px, 80px"
                    />
                    <span className={styles.objectName}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.sceneFooter}>
              <span>
                {direction === "row" ? "가로" : "세로"} · {gap}px · {alignmentNames[alignment]}
              </span>
              <span>LIVE PREVIEW · 점선은 물건이 담긴 칸</span>
            </div>
          </div>
          <p className={styles.observation}>
            물건 사이 간격과, 물건 묶음의 위치는 서로 다르게 움직여요.
          </p>
        </section>
        <aside className={styles.controls} aria-label="책상 조작">
          <div className={styles.controlHeader}>
            <div>
              <p className={styles.eyebrow}>01 / PLAY</p>
              <h2>이 모습으로 정리해볼까요?</h2>
            </div>
            <button className={styles.reset} onClick={reset}>
              처음으로
            </button>
          </div>
          <div
            className={styles.target}
            role="img"
            aria-label="목표: 책, 찻잔, 화분이 가로로 나란히, 여유 있는 같은 간격으로 중앙에 모인 모습"
          >
            {deskItems.map((item) => (
              <Image
                key={item.id}
                src={`/images/workbook/desk/${item.id}.png`}
                alt=""
                width={100}
                height={100}
                sizes="90px"
              />
            ))}
          </div>
          <p className={styles.targetCaption}>나란히, 여유 있게, 가운데로.</p>
          <fieldset>
            <legend>어느 방향으로 놓을까요?</legend>
            <div className={styles.options}>
              {(["row", "column"] as const).map((value) => (
                <button
                  key={value}
                  aria-pressed={direction === value}
                  onClick={() => {
                    setDirection(value);
                    change();
                  }}
                >
                  {value === "row" ? "↔ 가로" : "↕ 세로"}
                </button>
              ))}
            </div>
          </fieldset>
          <div className={styles.slider}>
            <label htmlFor="desk-gap">
              얼마나 떨어뜨릴까요? <output htmlFor="desk-gap">{gap}px</output>
            </label>
            <input
              id="desk-gap"
              type="range"
              min="0"
              max="32"
              step="4"
              value={gap}
              onChange={(event) => {
                setGap(Number(event.target.value));
                change();
              }}
            />
            <div>
              <span>붙여 놓기 · 0</span>
              <span>넉넉하게 · 32</span>
            </div>
          </div>
          <fieldset>
            <legend>어디에 모아둘까요?</legend>
            <div className={styles.options}>
              {(["flex-start", "center", "flex-end"] as const).map((value) => (
                <button
                  key={value}
                  aria-pressed={alignment === value}
                  onClick={() => {
                    setAlignment(value);
                    change();
                  }}
                >
                  {alignmentNames[value]}
                </button>
              ))}
            </div>
            <p className={styles.axisHint}>
              {direction === "row"
                ? "가로일 때 시작은 왼쪽, 끝은 오른쪽이에요."
                : "세로일 때 시작은 위쪽, 끝은 아래쪽이에요. 책상 영역을 위아래로 스크롤해보세요."}
            </p>
          </fieldset>
          <div className={styles.challenge}>
            <button className={styles.reset} aria-expanded={hint} onClick={() => setHint(!hint)}>
              힌트 {hint ? "접기" : "보기"}
            </button>
            {hint && (
              <p>가로 방향 → 16~32px 간격 → 가운데 정렬. 간격과 묶음의 위치를 따로 관찰해봐요.</p>
            )}
            <button
              className={styles.primary}
              onClick={() => {
                setAttempted(true);
                if (solved) setDiscovered(true);
              }}
            >
              배치 확인하기 <span aria-hidden="true">↗</span>
            </button>
            <p className={styles.result} role="status">
              {attempted
                ? solved
                  ? "도전 성공! 아래 웹 카드에도 이 배치를 옮겨보세요."
                  : feedback
                : "횟수 제한 없이, 편하게 실험해요."}
            </p>
          </div>
        </aside>
      </div>
      <section className={styles.discovery} aria-labelledby="discovery-title">
        <div className={styles.discoveryHeader}>
          <div>
            <p className={styles.eyebrow}>03 / UNDERSTAND & BUILD</p>
            <h2 id="discovery-title">방금, CSS를 움직인 거예요.</h2>
            <p>책상 대신 웹페이지의 카드에도 같은 규칙을 쓸 수 있어요.</p>
          </div>
          <button
            className={styles.secondary}
            aria-expanded={discovered}
            aria-controls="desk-explanation"
            onClick={() => setDiscovered(!discovered)}
          >
            {discovered ? "원리 접기" : "원리 먼저 살펴보기"}
          </button>
        </div>
        <div className={styles.transfer}>
          <div>
            <h3>책상에서 웹페이지로</h3>
            <p>
              내용은 달라도 배치 규칙은 같아요. 현재 책상 배치를 옮긴 뒤 위의 조작을 다시
              바꿔보세요.
            </p>
            <button
              className={styles.secondary}
              onClick={() => {
                setApplied(true);
                setDiscovered(true);
                setCopied("");
              }}
            >
              {applied ? "같은 규칙으로 연결됐어요" : "웹 카드에 적용하기"}
            </button>
          </div>
          <div className={styles.cardViewport}>
            <div
              className={styles.webCards}
              role="group"
              aria-label="웹 카드 미리보기"
              style={{
                flexDirection: applied ? direction : "column",
                gap: applied ? gap : 8,
                justifyContent: applied ? alignment : "flex-start",
              }}
            >
              {["소개", "작업", "기록"].map((name, index) => (
                <article key={name}>
                  <Image
                    src={`/images/workbook/desk/${deskItems[index].id}.png`}
                    alt=""
                    width={120}
                    height={120}
                    sizes="120px"
                  />
                  <strong>{name}</strong>
                  <span className={styles.cardDescription}>
                    {["작은 생각이 시작되는 곳", "오늘의 시도를 모아요", "발견을 내 것으로"][index]}
                  </span>
                </article>
              ))}
            </div>
          </div>
          <p className={styles.transferStatus} role="status">
            {applied
              ? `책상과 연결됨 · ${direction === "row" ? "가로" : "세로"} · ${gap}px · ${alignmentNames[alignment]}`
              : "아직 적용 전 · 세로로 놓인 기본 카드"}
          </p>
        </div>
        {discovered && (
          <div id="desk-explanation" className={styles.explanation}>
            <div>
              <h3>지금 배치의 실제 CSS</h3>
              <pre>
                <code>{code}</code>
              </pre>
              <p>
                <code>flex-direction</code>은 방향, <code>gap</code>은 칸 사이 간격,{" "}
                <code>justify-content</code>는 그 방향으로 남은 공간에서 묶음을 놓는 위치예요.
              </p>
              <p>
                물건은 같은 크기의 칸에 담겨요. 화면 크기와 방향에 따라 칸 크기는 달라져요.{" "}
                <code>gap</code>은 그림 가장자리가 아닌 칸과 칸 사이의 거리입니다.
              </p>
            </div>
            <div>
              <h3>AI와 내 화면에 적용해보기</h3>
              <label htmlFor="desk-prompt">현재 설정으로 만든 요청 문장</label>
              <textarea id="desk-prompt" readOnly value={prompt} rows={7} />
              <button className={styles.secondary} onClick={copyPrompt}>
                요청 문장 복사
              </button>
              <p role="status">{copied}</p>
              <p>
                사용 중인 AI에 요청하고, 방향·간격·위치가 예상대로인지 직접 확인해보세요. 이
                데모에서는 AI를 호출하지 않아요.
              </p>
            </div>
          </div>
        )}
      </section>
      <footer className={styles.footer}>
        작은 실험이 쌓여, 내 것이 되는 시간.<span>진행 내용은 저장되지 않는 데모입니다.</span>
      </footer>
    </main>
  );
}

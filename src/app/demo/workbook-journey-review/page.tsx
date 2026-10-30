import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "전체 여정 비교 · Workbook",
  robots: { index: false, follow: false },
};
const maps = [
  {
    title: "AI 도구 준비하기",
    file: "ai-beginner-five-places-v1.png",
    goal: "AI의 도움과 확인할 일을 구분해요",
    result: "요청하고 결과를 확인한 기록",
    condition: "학습 중 · 2/5 확인",
    chapter: "이해하고 요청하기",
  },
  {
    title: "기획하고 첫 화면 만들기",
    file: "map.png",
    goal: "읽을 사람과 보여줄 내용을 정해요",
    result: "내 자기 소개의 기획과 첫 화면",
    condition: "AI 도구 준비하기를 마치면 열려요",
    chapter: "내 이야기를 첫 화면으로",
  },
  {
    title: "반응형 화면 만들기",
    file: "experience-river-garden-v1.png",
    goal: "작은 화면과 넓은 화면을 비교해요",
    result: "관찰과 화면 개선 요청",
    condition: "첫 제작을 마치면 열려요",
    chapter: "읽고 누르기 편하게",
  },
  {
    title: "기능과 데이터 저장",
    file: "data-alpine-archive-v1.png",
    goal: "표시·저장·함께 읽기를 구분해요",
    result: "메모 동작과 저장 범위 판단",
    condition: "화면 단원을 마치면 열려요",
    chapter: "내 페이지가 반응하도록",
  },
  {
    title: "배포하고 고치기",
    file: "publish-harbour-v1.png",
    goal: "공개 전 점검과 문제 재확인을 익혀요",
    result: "공개 점검과 수정 기록",
    condition: "데이터 단원을 마치면 열려요",
    chapter: "보여주고 다시 살펴보기",
  },
];
const modes = {
  a: "A · 지도 전체 탐색",
  b: "B · 단계가 펼쳐지는 여정",
  c: "C · 내 결과물 중심",
  compact: "A+B · 펼쳐진 지도 여정",
};
export default async function JourneyReview({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const query = await searchParams;
  const mode =
    query.view === "b" || query.view === "c" || query.view === "compact" ? query.view : "a";
  return (
    <main className={styles.page}>
      <header>
        <span className="label">WORKBOOK · EXPERIENCE REVIEW</span>
        <h1>전체 여정, 어떻게 만나볼까요?</h1>
        <p>
          같은 지도와 같은 예시 진행으로 표현만 비교해요. 실제 학습 기록·포인트는 바뀌지 않아요.
        </p>
        <Link href="/workbook/classes/vibe-web">비교 닫고 클래스로 →</Link>
      </header>
      <nav aria-label="여정 비교안" className={styles.tabs}>
        {Object.entries(modes).map(([key, title]) => (
          <Link key={key} href={`?view=${key}`} aria-current={mode === key ? "page" : undefined}>
            {title}
          </Link>
        ))}
      </nav>
      <section className={`${styles.stage} ${styles[mode]}`} aria-labelledby="review-title">
        <div className={styles.current}>
          <span className="label">현재 위치 · AI 도구 준비하기</span>
          <h2 id="review-title">{modes[mode]}</h2>
          <p>2/5 학습 확인 · 실제 파일 적용 전</p>
          <a href="#next">다음 행동 · 도구 준비하기 →</a>
        </div>
        {mode === "c" && (
          <div className={styles.project}>
            <span className="label">MY FIRST WEB</span>
            <h2>나를 소개하는 작은 웹페이지</h2>
            <p>아직 제작 전이에요. 이해하고, 기획하고, 내 파일을 확인하며 결과를 쌓아요.</p>
          </div>
        )}
        <div className={styles.maps}>
          {maps.map((map, index) => (
            <article
              key={map.file}
              className={styles.card}
              aria-label={`${index + 1}. ${map.title}`}
            >
              {mode === "compact" ? (
                <details className={styles.journeyCard} name="journey-place">
                  <summary aria-label={`${map.title}에서 배울 것 살펴보기`}>
                    <span className="label">
                      {String(index + 1).padStart(2, "0")} ·{" "}
                      {index === 0 ? "현재 지역" : "아직 열리지 않음"}
                    </span>
                    <div className={styles.image}>
                      <Image
                        src={`/images/workbook/journey/${map.file}`}
                        alt={`${map.title} 지도`}
                        width={1536}
                        height={1024}
                        sizes="(min-width: 1024px) 20vw, 260px"
                      />
                    </div>
                    <h3>{map.title}</h3>
                    <p>{map.condition}</p>
                    <p className={styles.goal}>{map.goal}</p>
                    <span className={styles.expandLabel}>상세 보기 / 접기</span>
                  </summary>
                  <div className={styles.cardDetail}>
                    <p>
                      <strong>남길 결과</strong> · {map.result}
                    </p>
                    <p>
                      지역 내용은 살펴볼 수 있어요. 이 비교 화면에서 수업을 시작하거나 완료하지
                      않아요.
                    </p>
                  </div>
                </details>
              ) : (
                <>
                  {" "}
                  <div className={styles.image}>
                    <Image
                      src={`/images/workbook/journey/${map.file}`}
                      alt={`${map.title} 지도`}
                      width={1536}
                      height={1024}
                      sizes="(min-width: 768px) 45vw, 100vw"
                    />
                  </div>
                  <div className={styles.info}>
                    <span className="label">
                      {String(index + 1).padStart(2, "0")} ·{" "}
                      {index === 0 ? "현재 지역" : "아직 열리지 않음"}
                    </span>
                    <h3>{map.title}</h3>
                    {mode === "c" && <p className={styles.chapter}>{map.chapter}</p>}
                    <p>{map.condition}</p>
                    <details>
                      <summary>{map.title}에서 배울 것 살펴보기</summary>
                      <p>
                        <strong>목표</strong> · {map.goal}
                      </p>
                      <p>
                        <strong>남길 결과</strong> · {map.result}
                      </p>
                      <p>
                        지역 내용은 살펴볼 수 있어요. 이 비교 화면에서 수업을 시작하거나 완료하지
                        않아요.
                      </p>
                    </details>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
        <section id="next" className={styles.next} tabIndex={-1}>
          <h2>다음 행동 · 도구 준비하기</h2>
          <p>
            실습할 컴퓨터에서 코드 에이전트와 작업 폴더를 준비해요. 이곳은 비교용 안내이며 실제 준비
            완료를 기록하지 않아요.
          </p>
          <Link href="/workbook/classes/vibe-web">실제 클래스에서 이어가기 →</Link>
        </section>
      </section>
    </main>
  );
}

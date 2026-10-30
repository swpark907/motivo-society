"use client";

// 클래스 방문 context와 별도의 브라우저 실험 기록을 이어가기에서 구분한다. 구매 권한을 뜻하지 않는다.
import { useWorkbookProgress } from "@/components/WorkbookClass/WorkbookProgressContext";
import { workbookLessonRoutes } from "@/lib/workbook-lesson-routes";
import { getWorkbookPurpose } from "@/lib/workbook-purpose";
import { experienceProgress } from "@/lib/workbook-experience";
import { dataProgress } from "@/lib/workbook-data";
import { publishProgress } from "@/lib/workbook-publish";
import { applicationProgress } from "@/lib/workbook-application";
import Image from "next/image";
import { useState } from "react";
import type { WorkbookReadingSummary } from "@/lib/content/workbook-readings";
import { WorkbookCatalog } from "@/components/WorkbookCatalog/WorkbookCatalog";
import Link from "next/link";
import { useJourneyProgress } from "@/components/WorkbookJourney/useJourneyProgress";
import styles from "./WorkbookHome.module.scss";
import { WorkbookSpaceLauncher } from "@/components/WorkbookSpacePreview/WorkbookSpaceLauncher";
import { WorkbookActivityCalendar } from "@/components/WorkbookActivityCalendar/WorkbookActivityCalendar";

export function WorkbookHome({
  readings,
  showWorkspaceStudies = false,
}: {
  readings: WorkbookReadingSummary[];
  showWorkspaceStudies?: boolean;
}) {
  const [heroSlide, setHeroSlide] = useState(0);
  const featured = readings.find((entry) => entry.slug === "show-the-screen") ?? readings[0];
  const {
    purpose,
    lesson,
    projectStop,
    experienceStop,
    dataStop,
    publishStop,
    applications,
    setReviewView,
    completed,
    mapWorld,
    setScene,
    projectCompleted,
    experienceCompleted,
    dataCompleted,
    publishCompleted,
    experience,
    data,
    publish,
  } = useWorkbookProgress();
  const resumeStep =
    lesson !== null && lesson < 5
      ? lesson
      : mapWorld === "project"
        ? projectStop
        : mapWorld === "experience"
          ? experienceStop
          : mapWorld === "data"
            ? dataStop
            : publishStop;
  const resumeHref =
    (lesson !== null
      ? workbookLessonRoutes.find((route) => route.lesson === lesson && route.step === resumeStep)
          ?.path
      : undefined) ?? "/workbook/classes/vibe-web?view=map";
  const allLearned =
    completed.length === 5 &&
    projectCompleted &&
    experienceCompleted &&
    dataCompleted &&
    publishCompleted;
  const { pending } = applicationProgress(applications);
  const experienceState = experienceProgress(experience);
  const dataState = dataProgress(data);
  const publishState = publishProgress(publish);
  const activeProgress = {
    ai: `${completed.length}/5 학습 확인`,
    project: projectCompleted ? "첫 화면 확인 완료" : "기획·요청·첫 화면 확인 중",
    experience: `${[experienceState.observed, experienceState.requested, experienceCompleted].filter(Boolean).length}/3 학습 확인`,
    data: `${[dataState.displayed, dataState.stored, dataCompleted].filter(Boolean).length}/3 학습 확인`,
    publish: `${[publishState.inspected, publishState.addressed, publishCompleted].filter(Boolean).length}/3 학습 확인`,
  }[mapWorld];
  const { progress, ready, storageError } = useJourneyProgress();
  const started = ready && progress.completed > 0;
  return (
    <main className={styles.home}>
      {purpose && (
        <section className={`${styles.resume} ${styles.classResume}`} aria-label="클래스 이어하기">
          <div>
            <h2>{getWorkbookPurpose(purpose).goal}</h2>
            <p>
              {
                {
                  ai: "AI 도구 준비하기",
                  project: "기획하고 첫 화면 만들기",
                  experience: "반응형 화면 만들기",
                  data: "기능과 데이터 저장",
                  publish: "배포하고 고치기",
                }[mapWorld]
              }{" "}
              · {activeProgress}
            </p>
          </div>
          <div className={styles.resumeActions}>
            {allLearned && pending.length > 0 && (
              <Link
                className={styles.cta}
                href={`/workbook/classes/vibe-web?view=application&stage=${pending[0]}`}
                onClick={() => {
                  setReviewView(pending[0]);
                  setScene(2);
                }}
              >
                남은 내 파일 작업 보기 →
              </Link>
            )}
            <Link
              className={styles.cta}
              href={allLearned ? "/workbook/classes/vibe-web?view=summary" : resumeHref}
              onClick={() => {
                setReviewView(allLearned ? "summary" : null);
                setScene(2);
              }}
            >
              {allLearned ? "클래스 마지막 정리 보기 →" : "클래스 이어가기 →"}
            </Link>
          </div>
        </section>
      )}
      <section
        className={styles.hero}
        aria-labelledby="workbook-title"
        aria-roledescription="캐러셀"
      >
        <Image
          src={heroSlide === 1 && featured ? featured.thumbnail : "/images/workbook/study-v3.png"}
          alt={
            heroSlide === 1 && featured
              ? featured.thumbnailAlt
              : "차를 들고 작업하는 카피바라의 따뜻한 작업실"
          }
          fill
          preload
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroCopy}>
          <span className="label">
            {heroSlide === 1
              ? "FIELD NOTE 02 / 이번에 발견할 한 가지"
              : "모티보 워크북 · AI와 함께 만드는 공간"}
          </span>
          <h1 id="workbook-title">
            {heroSlide === 1 ? (
              <>
                어디가
                <br />
                이상한가요?
              </>
            ) : (
              <>
                만들고 싶었던 것,
                <br />
                작게 시작해봐요.
              </>
            )}
          </h1>
          <p>
            {heroSlide === 1
              ? "설명하기 어려운 순간, 화면을 보여주고 볼 곳을 짚어보세요. AI와 질문을 나누는 작은 방법."
              : "AI 활용 팁부터 나의 첫 웹페이지까지. 궁금한 것은 가볍게 살펴보고, 만들고 싶은 것은 직접 시도해봐요."}
          </p>
          {heroSlide === 1 && featured ? (
            <Link className={styles.cta} href={`/workbook/reading/${featured.slug}`}>
              화면으로 질문하는 법 읽기 →
            </Link>
          ) : (
            <Link className={styles.cta} href="/workbook/classes/vibe-web">
              웹페이지 만들기 클래스 보기 →
            </Link>
          )}
          <small>
            {heroSlide === 1
              ? "테스트 콘텐츠 · 실사용 검증 전"
              : "PC에서 제작 실습 · 모바일에서 설명과 복습"}
          </small>
        </div>
        {featured && (
          <div className={styles.heroControls} aria-label="히어로 콘텐츠 선택">
            <div>
              <button
                type="button"
                aria-label="워크북 소개 보기"
                aria-pressed={heroSlide === 0}
                onClick={() => setHeroSlide(0)}
              >
                01 <span>워크북</span>
              </button>
              <button
                type="button"
                aria-label="추천 글 보기"
                aria-pressed={heroSlide === 1}
                onClick={() => setHeroSlide(1)}
              >
                02 <span>이번의 발견</span>
              </button>
            </div>
            <button
              type="button"
              aria-label="다음 히어로 콘텐츠"
              onClick={() => setHeroSlide((current) => 1 - current)}
            >
              →
            </button>
          </div>
        )}
      </section>
      <div className={styles.body}>
        {started && (
          <section className={styles.resume} aria-label="실험 이어하기">
            <div>
              <span className="label">WELCOME BACK · 체험 기록</span>
              <h2>지난번 발견에서 이어가요.</h2>
              <p>모바일 소개 페이지 실험 · {progress.completed} / 3 장소 완료</p>
            </div>
            <Link className={styles.cta} href="/workbook/journey">
              여정 이어가기 ↗
            </Link>
          </section>
        )}
        <div className={styles.homeColumns}>
          <div className={styles.homeContent}>
            <nav className={styles.shortcuts} aria-label="홈 콘텐츠">
              <a href="#classes">클래스</a>
              <a href="#experiments">짧은 실험</a>
              <a href="#reading">읽을거리</a>
              <a href="#notes">내 기록</a>
              <a href="#activity-calendar">활동 캘린더 · 목업</a>
            </nav>
            <section id="classes" className={styles.section}>
              <header className={styles.heading}>
                <div>
                  <span className="label">LEARN BY MAKING</span>
                  <h2>만들면서 익히는 클래스</h2>
                </div>
                <Link href="/workbook/classes">목록 더보기 →</Link>
              </header>
              <p className={styles.intro}>무료로 체험할 클래스와 준비 중인 클래스를 살펴보세요.</p>
              <WorkbookCatalog layout="carousel" />
            </section>
            <section id="experiments" className={styles.section}>
              <header className={styles.heading}>
                <div>
                  <span className="label">A LITTLE PLAY</span>
                  <h2>잠깐, 손으로 생각하기</h2>
                </div>
                <span>가볍게 들어와도 좋아요</span>
              </header>
              <div className={styles.experiments}>
                <Link href="/demo/workbook-desk" className={styles.experiment}>
                  <span className={styles.number}>01</span>
                  <div>
                    <small>배치 실험 · 데모</small>
                    <h3>카피바라의 책상 정리</h3>
                    <p>방향과 간격을 바꾸며 배치 규칙을 발견해요.</p>
                  </div>
                  <span>↗</span>
                </Link>
                <Link
                  href="/workbook/journey"
                  className={styles.experiment}
                  aria-label="휴대폰에서는 왜 잘릴까?"
                >
                  <span className={styles.number}>02</span>
                  <div>
                    <small>화면 실험 · 데모</small>
                    <h3>휴대폰에서는 왜 잘릴까?</h3>
                    <p>좁은 화면과 넓은 화면을 오가며 직접 고쳐봐요.</p>
                  </div>
                  <span>↗</span>
                </Link>
              </div>
            </section>
            <div className={styles.lower}>
              <section id="reading" className={styles.section}>
                <header className={styles.heading}>
                  <div>
                    <span className="label">READ & TAKE AWAY</span>
                    <h2>읽고, 바로 써먹는 힌트</h2>
                  </div>
                  <span>FIELD NOTES · {String(readings.length).padStart(2, "0")}</span>
                </header>
                <p className={styles.intro}>
                  잠깐 읽고, 내 작업에 가져갈 한 가지. 아래 {readings.length}편은 화면 검토를 위한
                  임시 글이에요.
                </p>
                <div className={styles.readingList}>
                  {readings.map((entry, index) => (
                    <Link
                      className={styles.reading}
                      href={`/workbook/reading/${entry.slug}`}
                      key={entry.slug}
                    >
                      <span className={styles.readingThumbnail}>
                        <Image
                          src={entry.thumbnail}
                          alt={entry.thumbnailAlt}
                          width={1672}
                          height={941}
                          sizes="(min-width: 768px) 160px, 96px"
                        />
                      </span>
                      <div>
                        <small>
                          {String(index + 1).padStart(2, "0")} / {entry.tags.join(" · ")} · 테스트
                          글
                        </small>
                        <h3>{entry.title}</h3>
                        <p>{entry.summary}</p>
                      </div>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  ))}
                </div>
              </section>
              <aside id="notes" className={styles.journal} aria-label="내 발견 기록">
                <span className="label">MY LITTLE NOTES</span>
                <h2>오늘의 발견 한 조각</h2>
                <p>
                  {progress.note ||
                    "손으로 바꿔보고 알게 된 것을 남겨보세요. 작은 발견이 다음 작업의 힌트가 돼요."}
                </p>
                {progress.applied && <p>내 프로젝트에 적용하고 확인했다고 표시했어요.</p>}
                <Link href="/workbook/journey">실험에서 기록 남기기 ↗</Link>
                <small>
                  {storageError
                    ? "저장소에 접근할 수 없어요. 기록을 복사해 보관해주세요."
                    : "실험 기록은 이 브라우저에만 저장돼요. 수업 진도와는 별개예요."}
                </small>
              </aside>
            </div>
          </div>
          <div>
            <WorkbookSpaceLauncher showStudies={showWorkspaceStudies} />
            <WorkbookActivityCalendar />
          </div>
        </div>
      </div>
    </main>
  );
}

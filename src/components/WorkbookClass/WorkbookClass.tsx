"use client";

// 카피바라 지도와 수업을 연결하고 이번 방문의 학습·준비 상태를 유지한다.
import { useWorkbookLessonRoute } from "./useWorkbookLessonRoute";
import { useWorkbookKeyboardViewport } from "./useWorkbookKeyboardViewport";
import Image from "next/image";
import {
  WorkbookFeaturedClass,
  WorkbookClassFaq,
} from "@/components/WorkbookFeaturedClass/WorkbookFeaturedClass";
import { WorkbookExamples } from "@/components/WorkbookExamples/WorkbookExamples";
import Link from "next/link";
import { useContext, useEffect, useRef, useState } from "react";
import { WorkbookStageHandoff } from "./WorkbookStageHandoff";
import { WorkbookCompletionSummary } from "./WorkbookCompletionSummary";
import { WorkbookReview } from "./WorkbookReview";
import { WorkbookMap } from "./WorkbookMap";
import { WorkbookProjectMap } from "./WorkbookProjectMap";
import { WorkbookPublishMap } from "./WorkbookPublishMap";
import { availablePublishStep, publishProgress } from "@/lib/workbook-publish";
import { WorkbookDataMap } from "./WorkbookDataMap";
import { availableDataStep, dataProgress } from "@/lib/workbook-data";
import { WorkbookExperienceMap } from "./WorkbookExperienceMap";
import { availableExperienceStep, experienceProgress } from "@/lib/workbook-experience";
import { WorkbookSetupLesson } from "./WorkbookSetupLesson";
import { WorkbookPracticeLesson } from "./WorkbookPracticeLesson";
import { WorkbookPracticalLesson } from "./WorkbookPracticalLesson";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { WorkbookLessons } from "./WorkbookLessons";
import { WorkbookDataLesson } from "./WorkbookDataLesson";
import { WorkbookPublishLesson } from "./WorkbookPublishLesson";
import { WorkbookExperienceLesson } from "./WorkbookExperienceLesson";
import { WorkbookProjectLesson } from "./WorkbookProjectLesson";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import { useWorkbookRoom } from "@/components/WorkbookSpacePreview/WorkbookRoomProvider";
import { slotItems } from "@/lib/workbook-room-slots";
import { ownRoomItem, roomRewardAvailable } from "@/lib/workbook-room-collection";
import { WorkbookClassCollectibles } from "@/components/WorkbookClassCollectibles/WorkbookClassCollectibles";
import { WorkbookPanelDisclosure } from "./WorkbookPanelDisclosure";
import { WorkbookIntro } from "./WorkbookIntro";
import { WorkbookClassIntro } from "@/components/WorkbookClassIntro/WorkbookClassIntro";
import { WorkbookLessonCover } from "./WorkbookLessonCover";
import { WorkbookNavigationContext } from "./WorkbookNavigationContext";
import styles from "./WorkbookClass.module.scss";
import panelStyles from "./WorkbookMapPanel.module.scss";

import { roomRewards, type RoomRewardId } from "@/lib/workbook-room-rewards";

import { type PracticalStage } from "@/lib/workbook-practical-labs";

import { workbookCurriculum as curriculum, workbookPointTopics } from "@/lib/workbook-curriculum";

import { workbookTrial, workbookCourse } from "@/lib/workbook-course";

/** One line per unit: what the learner does there (journey list and map panel). */
const UNIT_GOALS = [
  "AI를 이해하고 요청·확인·수정 흐름을 익혀요.",
  "내 소개의 목적과 내용을 정하고 첫 화면을 만들어요.",
  "내 화면의 불편한 점을 찾고 개선해요.",
  "입력과 저장, 다른 기기에서 읽는 범위를 알아봐요.",
  "공개 전 점검과 공개 뒤 문제 해결을 익혀요.",
];

export function WorkbookClass() {
  useWorkbookLessonRoute();
  const collapseMenu = useContext(WorkbookNavigationContext);
  const { collection } = useWorkbookRoom();
  const {
    lessonUi,
    setLessonUi,
    purpose,
    setPurpose,
    reviewView,
    setReviewView,
    mapWorld,
    setMapWorld,
    projectStop,
    setProjectStop,
    experienceStop,
    setExperienceStop,
    publishStop,
    setPublishStop,
    dataStop,
    setDataStop,
    publish,
    setPublish,
    publishCompleted,
    setPublishCompleted,
    data,
    setData,
    dataCompleted,
    setDataCompleted,
    experience,
    setExperience,
    experienceCompleted,
    setExperienceCompleted,
    scene,
    setScene,
    lesson,
    setLesson,
    currentStop,
    setCurrentStop,
    setupStatus,
    setSetupStatus,
    practice,
    setPractice,
    completed,
    setCompleted,
    project,
    setProject,
    projectCompleted,
    setProjectCompleted,
  } = useWorkbookProgress();
  // 이번 방문에서 클래스 인트로(1-0)를 열어봤는지. 진행도·해금에는 쓰지 않고 지도의 시작점 표시에만 쓴다.
  const [introSeen, setIntroSeen] = useWorkbookLessonState("class-intro-seen", false);
  const [practicalView, setPracticalView] = useWorkbookLessonState<PracticalStage | null>(
    "active-practical",
    null,
  );
  useEffect(() => {
    if (scene !== 2) return;
    const location = JSON.stringify({
      mapWorld,
      lesson,
      projectStop,
      experienceStop,
      dataStop,
      publishStop,
      reviewView,
      practicalView,
    });
    setLessonUi((previous) =>
      previous["class-return-location"] === location
        ? previous
        : { ...previous, "class-return-location": location },
    );
  }, [
    scene,
    mapWorld,
    lesson,
    projectStop,
    experienceStop,
    dataStop,
    publishStop,
    reviewView,
    practicalView,
    setLessonUi,
  ]);
  function startFromIntroduction() {
    if (purpose) {
      resumeLearning();
      return;
    }
    // 처음 시작: 첫 지도의 출발점(1-0 클래스 인트로)에서 여정을 시작한다.
    setPurpose("explore");
    setReviewView(null);
    setPracticalView(null);
    setMapWorld("ai");
    setLesson(null);
    setCurrentStop(-1);
    go(2);
  }
  function resumeLearning() {
    const saved = lessonUi["class-return-location"];
    if (typeof saved === "string") {
      const location = JSON.parse(saved);
      setMapWorld(location.mapWorld);
      setLesson(location.lesson);
      setProjectStop(location.projectStop);
      setExperienceStop(location.experienceStop);
      setDataStop(location.dataStop);
      setPublishStop(location.publishStop);
      setReviewView(location.reviewView);
      setPracticalView(location.practicalView);
    }
    go(2);
  }
  // URL로 수업·인트로를 직접 열어도 일반 진입과 같은 읽기 공간을 확보한다.
  useEffect(() => {
    if ((scene === 2 && lesson !== null && lesson <= 8) || scene === 3) collapseMenu?.();
  }, [scene, lesson, projectStop, experienceStop, dataStop, publishStop, collapseMenu]);
  const page = useRef<HTMLElement>(null);
  const mapSidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    if (scene === 2 && lesson === null && reviewView === null && practicalView === null)
      mapSidebar.current?.scrollTo({ top: 0 });
  }, [scene, lesson, reviewView, practicalView, mapWorld]);
  useWorkbookKeyboardViewport(
    page,
    scene === 2 && (lesson !== null || reviewView !== null || practicalView !== null),
  );
  const title = useRef<HTMLHeadingElement>(null);
  const journey = useRef<HTMLDialogElement>(null);
  const [mapPanelTarget, setMapPanelTarget] = useState<HTMLDivElement | null>(null);
  const journeyTrigger = useRef<HTMLButtonElement>(null);
  const mapArea = useRef<HTMLDivElement>(null);
  const planReady = [
    project.title,
    project.audience,
    project.purpose,
    project.intro,
    project.content,
  ].every((value) => !!value.trim());
  const requestReady = planReady && !!project.request.trim() && project.mode !== null;
  function canOpenPractical(stage: PracticalStage) {
    if (stage === "agent") return mapWorld === "ai" && completed.includes(4);
    if (completed.length !== 5) return false;
    if (stage === "project") return mapWorld === "project" && planReady;
    if (!projectCompleted) return false;
    if (stage === "experience")
      return mapWorld === "experience" && experienceProgress(experience).observed;
    if (!experienceCompleted) return false;
    if (stage === "data") return mapWorld === "data" && dataProgress(data).stored;
    return mapWorld === "publish" && dataCompleted && publishProgress(publish).addressed;
  }
  const coverUnit = workbookCourse[lesson !== null && lesson < 5 ? 0 : (lesson ?? 5) - 4];
  const coverPoint =
    lesson !== null && lesson < 5
      ? lesson
      : lesson === 5
        ? projectStop
        : lesson === 6
          ? experienceStop
          : lesson === 7
            ? dataStop
            : publishStop;
  const openedPractical = practicalView && canOpenPractical(practicalView) ? practicalView : null;
  function enterPractical(stage: PracticalStage) {
    if (canOpenPractical(stage)) setPracticalView(stage);
  }
  const journeyStages = (
    [
      {
        id: "ai",
        image: "ai-beginner-five-places-v1.png",
        count: completed.length,
        total: 5,
        available: true,
        reason: "",
        next: workbookCourse[0].lessons.map((item) => `${item.number} ${item.title}`)[
          Array.from({ length: 5 }, (_, i) => i).find((i) => !completed.includes(i)) ?? 5
        ],
      },
      {
        id: "project",
        image: "map.png",
        count: [planReady, requestReady, projectCompleted].filter(Boolean).length,
        total: 3,
        available: completed.length === 5,
        reason: "AI 도구 준비하기의 다섯 수업을 마치면 열려요",
        next: workbookCourse[1].lessons.map((item) => `${item.number} ${item.title}`)[
          [planReady, requestReady, projectCompleted].findIndex((value) => !value)
        ],
      },
      {
        id: "experience",
        image: "experience-river-garden-v1.png",
        count: [
          experienceProgress(experience).observed,
          experienceProgress(experience).requested,
          experienceCompleted,
        ].filter(Boolean).length,
        total: 3,
        available: projectCompleted,
        reason: "기획하고 첫 화면 만들기를 마치면 열려요",
        next: workbookCourse[2].lessons.map((item) => `${item.number} ${item.title}`)[
          [
            experienceProgress(experience).observed,
            experienceProgress(experience).requested,
            experienceCompleted,
          ].findIndex((value) => !value)
        ],
      },
      {
        id: "data",
        image: "data-alpine-archive-v1.png",
        count: [dataProgress(data).displayed, dataProgress(data).stored, dataCompleted].filter(
          Boolean,
        ).length,
        total: 3,
        available: projectCompleted && experienceCompleted,
        reason: "반응형 화면 만들기까지 마치면 열려요",
        next: workbookCourse[3].lessons.map((item) => `${item.number} ${item.title}`)[
          [dataProgress(data).displayed, dataProgress(data).stored, dataCompleted].findIndex(
            (value) => !value,
          )
        ],
      },
      {
        id: "publish",
        image: "publish-harbour-v1.png",
        count: [
          publishProgress(publish).inspected,
          publishProgress(publish).addressed,
          publishCompleted,
        ].filter(Boolean).length,
        total: 3,
        available: projectCompleted && experienceCompleted && dataCompleted,
        reason: "기능과 데이터 저장까지 마치면 열려요",
        next: workbookCourse[4].lessons.map((item) => `${item.number} ${item.title}`)[
          [
            publishProgress(publish).inspected,
            publishProgress(publish).addressed,
            publishCompleted,
          ].findIndex((value) => !value)
        ],
      },
    ] as const
  ).map((stage, index) => ({
    ...stage,
    name: workbookCourse[index].title,
    number: workbookCourse[index].number,
  }));
  const requiredLearning = journeyStages.find(
    (stage) => stage.available && stage.count < stage.total,
  );
  const learningDone = {
    ai: Array.from({ length: 5 }, (_, index) => completed.includes(index)),
    project: [planReady, requestReady, projectCompleted],
    experience: [
      experienceProgress(experience).observed,
      experienceProgress(experience).requested,
      experienceCompleted,
    ],
    data: [dataProgress(data).displayed, dataProgress(data).stored, dataCompleted],
    publish: [
      publishProgress(publish).inspected,
      publishProgress(publish).addressed,
      publishCompleted,
    ],
  };
  function startRequiredLearning() {
    if (!requiredLearning) return;
    enterLearning(
      requiredLearning.id,
      learningDone[requiredLearning.id].findIndex((value) => !value),
    );
  }
  function enterLearning(world: typeof mapWorld, step: number) {
    if (step < 0) return;
    journey.current?.close();
    setReviewView(null);
    setPracticalView(null);
    setMapWorld(world);
    if (world === "ai") {
      setCurrentStop(step);
      setLesson(step);
    } else if (world === "project") {
      setProjectStop(step);
      setLesson(5);
    } else if (world === "experience") {
      setExperienceStop(step);
      setLesson(6);
    } else if (world === "data") {
      setDataStop(step);
      setLesson(7);
    } else {
      setPublishStop(step);
      setLesson(8);
    }
    requestAnimationFrame(() => {
      const heading = Array.from(
        page.current?.querySelectorAll<HTMLElement>("h1[tabindex]") ?? [],
      ).find((element) => element.getClientRects().length > 0);
      heading?.focus();
      heading?.scrollIntoView({ block: "nearest" });
    });
  }
  const [journeyTarget, setJourneyTarget] = useState<string | null>(null);
  function openRewardActivity(id: RoomRewardId) {
    const reward = roomRewards.find((entry) => entry.id === id)!;
    const stage = journeyStages.find((entry) => entry.id === reward.stage)!;
    setLesson(null);
    setReviewView(null);
    setPracticalView(null);
    go(2);
    if (stage.available) {
      setMapWorld(stage.id);
      requestAnimationFrame(() => title.current?.scrollIntoView({ block: "start" }));
    } else {
      setJourneyTarget(stage.id);
      requestAnimationFrame(() => {
        journey.current?.showModal();
        const target = journey.current?.querySelector<HTMLElement>(`#journey-stage-${stage.id}`);
        target?.scrollIntoView({ block: "center" });
        target?.focus({ preventScroll: true });
        target?.closest("details")?.querySelector("button")?.scrollIntoView({ block: "nearest" });
      });
    }
  }
  const activeStage = journeyStages.find((stage) => stage.id === mapWorld)!;
  const nextStage = journeyStages[journeyStages.indexOf(activeStage) + 1];
  const completedReward =
    activeStage.count === activeStage.total
      ? roomRewards.find(
          ({ stage, id }) =>
            stage === mapWorld &&
            roomRewardAvailable(collection, id) &&
            !ownRoomItem(collection, id),
        )
      : undefined;
  function selectMap(world: typeof mapWorld) {
    const stage = journeyStages.find((value) => value.id === world);
    if (!stage?.available) return;
    setMapWorld(world);
    if (journey.current) journey.current.close();
    requestAnimationFrame(() => {
      title.current?.focus();
      title.current?.scrollIntoView({ block: "start" });
    });
  }
  const unitOfMap = workbookCourse.find((item) => item.world === mapWorld)!;
  // 패널 목록에서 고르면 지도의 같은 지점을 누른 것과 똑같이 동작한다(카피바라 이동·패널 카드).
  function selectMapPoint(number: string) {
    const buttons = Array.from(
      mapArea.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
    );
    const target =
      number === "practical"
        ? buttons.find((button) => button.dataset.practical === "true")
        : buttons.find((button) => button.getAttribute("aria-label")?.startsWith(`${number} `));
    if (!target || target.disabled) return;
    target.click();
    target.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  function continueLearning() {
    const step = learningDone[mapWorld].findIndex((value) => !value);
    if (step >= 0) enterLearning(mapWorld, step);
    else if (nextStage?.available)
      enterLearning(
        nextStage.id,
        Math.max(
          0,
          learningDone[nextStage.id].findIndex((value) => !value),
        ),
      );
  }

  function enterExperience(step: number) {
    if (!projectCompleted || !experienceProgress(experience).available[step]) return;
    setMapWorld("experience");
    setExperienceStop(step);
    setLesson(6);
  }
  function enterData(step: number) {
    if (!projectCompleted || !experienceCompleted || !dataProgress(data).available[step]) return;
    setMapWorld("data");
    setDataStop(step);
    setLesson(7);
  }
  function enterPublish(step: number) {
    if (
      !projectCompleted ||
      !experienceCompleted ||
      !dataCompleted ||
      !publishProgress(publish).available[step]
    )
      return;
    setMapWorld("publish");
    setPublishStop(step);
    setLesson(8);
  }
  function go(next: number) {
    if (next === 2 || next === 3) collapseMenu?.();
    setScene(next);
    requestAnimationFrame(() => title.current?.focus());
  }
  const inLesson =
    scene === 2 && (lesson !== null || reviewView !== null || openedPractical !== null);
  return (
    <main
      ref={page}
      // 수업 화면은 인트로처럼 종이 위에서 읽는다(.paper가 의미 토큰을 밝은 색으로 바꾼다).
      className={`${styles.page} ${inLesson ? "paper" : ""}`}
      data-learning={
        scene === 3 ||
        ((lesson !== null || reviewView !== null || openedPractical !== null) && scene === 2)
      }
      data-map-view={
        scene === 2 && lesson === null && reviewView === null && openedPractical === null
      }
    >
      <div className={styles.top}>
        <span>WORKBOOK / VIBE WEB</span>
      </div>
      <p className={styles.notice} hidden={scene !== 1}>
        {workbookTrial.records}
      </p>
      {scene === 0 ? (
        <>
          <nav className={styles.classBreadcrumb} aria-label="현재 위치">
            <Link href="/workbook">워크북</Link>
            <span aria-hidden="true">/</span>
            <Link href="/workbook/classes">클래스</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">AI와 만드는 나의 첫 웹페이지</span>
          </nav>
          <header className={styles.courseHero}>
            <div className={styles.courseHeroCopy}>
              <div className={styles.courseLabels}>
                <span>WEB CREATION / CLASS 01</span>
                <span>{workbookTrial.label}</span>
              </div>
              <h1 ref={title} tabIndex={-1}>
                AI와 만드는
                <br />
                나의 첫 웹페이지
              </h1>
              <p>
                코딩이 처음이어도, AI와 함께 내 웹페이지를 만들어봐요.
                <br />
                AI 도구 준비부터 기획·제작·확인과 수정까지 함께 익혀요.
              </p>
              <button className={styles.heroStart} onClick={startFromIntroduction}>
                {purpose ? "학습으로 돌아가기 ↗" : "강의 시작하기 ↗"}
              </button>
              <small className={styles.trialNotice}>{workbookTrial.records}</small>
              <div className={styles.courseMeta}>
                <span>사전 코딩 경험 없이</span>
                <span>Windows · Mac 실습</span>
                <span>모티보 소사이어티</span>
              </div>
            </div>
            <div className={styles.courseHeroArt}>
              <Image
                src="/images/workbook/vibe-web-cover-v2.png"
                alt="청록빛 스튜디오에서 PC와 모바일의 웹페이지를 확인하는 선글라스와 넥타이 차림의 카피바라"
                width={1672}
                height={941}
                preload
                sizes="(min-width:1024px) 45vw, 100vw"
              />
              <span>내 소개와 작업을 담은 웹페이지 만들기</span>
            </div>
          </header>
          <nav className={styles.courseSections} aria-label="클래스 소개 바로가기">
            <a href="#class-results-title">제작 예시</a>
            <a href="#featured-class">클래스 소개</a>
            <a href="#class-curriculum-title">커리큘럼</a>
            <a href="#class-faq-title">자주 묻는 질문</a>
          </nav>
          <div className={styles.detailLayout}>
            <div className={styles.detailMain}>
              <section className={styles.section} aria-labelledby="class-results-title">
                <span className="label">YOUR FIRST PAGE</span>
                <h2 id="class-results-title">이런 웹페이지를 만들어볼 수 있어요</h2>
                <p>
                  서비스 소개, 포트폴리오, 취향 모음처럼 내게 필요한 주제로 연습해요. 아래 화면은
                  디자인 예시이며, 실제 수강생이 만든 결과물은 아니에요.
                </p>
                <div className={styles.detailExamples}>
                  <WorkbookExamples />
                </div>
              </section>
              <WorkbookFeaturedClass />
              <section className={styles.section} aria-labelledby="class-curriculum-title">
                <span className="label">CURRICULUM</span>
                <h2 id="class-curriculum-title">단원별로 배우는 내용</h2>
                <p>
                  AI 도구 준비하기부터 기획·제작·화면 개선·기능과 데이터 저장·공개 순서로 진행해요.
                  단원을 펼치면 각 수업과 활동에서 다루는 학습 주제를 볼 수 있어요.
                </p>
                <div className={styles.curriculum}>
                  {workbookCourse.map((unit, index) => (
                    <details key={unit.stage}>
                      <summary>
                        <span>{unit.number}단원</span>
                        {unit.title}
                      </summary>
                      <p>{curriculum[index].description}</p>
                      <ol aria-label={`${unit.number}단원 기본 수업`}>
                        {unit.lessons.map((lesson, point) => (
                          <li key={lesson.slug}>
                            <span className={styles.curriculumNumber}>{lesson.number}</span>
                            <span>
                              <strong>{lesson.title}</strong>
                              <small className={styles.curriculumLessonTopics}>
                                {workbookPointTopics[unit.stage][point]
                                  .map((topic) => curriculum[index].lessons[topic])
                                  .join(" · ")}
                              </small>
                            </span>
                          </li>
                        ))}
                      </ol>
                      <div
                        className={styles.curriculumOptional}
                        aria-label={`${unit.number}단원 선택 심화`}
                      >
                        <strong>{unit.number}단원 선택 심화</strong>
                        <p>{unit.optionalTitle}</p>
                        <small>선택 과정 · 기본 수업 완료 조건에 포함되지 않아요.</small>
                      </div>
                    </details>
                  ))}
                </div>
                <p>
                  기본 수업은 총 17개예요. 번호가 붙은 항목은 실제 수업이며, 아래 작은 글씨는 그
                  수업에서 다룰 주제예요. 단원별 선택 심화는 기본 수업 번호와 완료 조건에서 분리해
                  두었어요.
                </p>
                <small>
                  선택 심화는 각 단원에서 필요할 때 해보는 추가 연습이에요. 기본 수업과 별도로
                  살펴볼 수 있어요.
                </small>
              </section>
              <section className={styles.section} aria-labelledby="class-preparation-title">
                <span className="label">BEFORE YOU START</span>
                <h2 id="class-preparation-title">시작 전에 알아두세요</h2>
                <ul className={styles.preparation}>
                  <li>
                    제작 실습은 개인 컴퓨터에서 진행해요. Windows·Mac 준비 안내가 있고, 모바일에서는
                    설명과 예시를 복습할 수 있어요.
                  </li>
                  <li>
                    외부 AI 도구의 설치와 계정 준비가 필요해요. 무료 이용 범위·유료 조건은 도구마다
                    달라 준비 수업에서 확인해요.
                  </li>
                  <li>
                    워크북에서는 예시로 연습하고, 실제 웹페이지는 외부 AI 도구를 사용해 내
                    컴퓨터에서 만들어요.
                  </li>
                  <li>
                    {workbookTrial.records} {workbookTrial.browserRecords}
                  </li>
                  <li>{workbookTrial.scope}</li>
                  <li>{workbookTrial.publishing}</li>
                </ul>
              </section>
              <WorkbookClassFaq />
              <WorkbookClassCollectibles onActivity={openRewardActivity} />
            </div>
            <aside className={styles.classStart} aria-label="클래스 요약과 시작">
              <span className="label">이 클래스에서 만들 것</span>
              <h2>
                내 소개나 작업을 담은 <br />한 페이지 웹사이트
              </h2>
              <p>보여줄 내용을 정하고, AI와 초안을 만든 뒤 PC와 모바일에서 확인하며 수정해요.</p>
              <div className={styles.tokens}>
                <span>AI 도구 준비하기부터</span>
                <span>PC 제작 실습</span>
              </div>
              <dl className={styles.classFacts}>
                <div>
                  <dt>학습 구성</dt>
                  <dd>AI 도구 준비하기 5수업 + 제작 실습 12개 · 선택 심화 5개</dd>
                </div>
                <div>
                  <dt>시작 수준</dt>
                  <dd>AI·웹개발을 처음 접하는 분</dd>
                </div>
                <div>
                  <dt>제작 환경</dt>
                  <dd>Windows·Mac 개인 컴퓨터</dd>
                </div>
                <div>
                  <dt>학습 방식</dt>
                  <dd>설명 읽기 → 예시로 연습 → 내 웹페이지 제작</dd>
                </div>
              </dl>
              <p className={styles.classTech}>
                프롬프트 · 코드 에이전트 · HTML · CSS · 반응형 웹 · 데이터 저장 개념 · 배포
              </p>
              <p className={styles.classNote}>
                {workbookTrial.scope} {workbookTrial.publishing}
              </p>
              <p className={styles.classNote}>
                모바일은 설명과 예시 복습용이에요. 실제 파일 제작은 준비한 외부 AI 도구에서
                진행해요.
              </p>

              <small>
                {purpose
                  ? "이번 방문에서 보던 수업·지도 위치로 돌아가요."
                  : "첫 지도의 출발점, 1-0 클래스 인트로에서 시작해요."}
              </small>
            </aside>
          </div>
        </>
      ) : scene === 3 ? (
        // 클래스 오리엔테이션: 처음 강의를 시작하면 인트로를 보고 1-1 수업으로 바로 들어간다.
        <WorkbookClassIntro
          // 처음 시작이면 클래스 소개로, 지도에서 다시 본 경우엔 지도로 돌아간다.
          exitLabel={purpose ? "← 단원 지도 보기" : "← 클래스 소개로"}
          onExit={() => {
            setIntroSeen(true);
            go(purpose ? 2 : 0);
          }}
          onStart={() => {
            setIntroSeen(true);
            if (!purpose) setPurpose("explore");
            go(2);
            if (!purpose && completed.length === 0) enterLearning("ai", 0);
            else startRequiredLearning();
          }}
        />
      ) : scene === 2 && reviewView !== null ? (
        <WorkbookReview
          key={reviewView}
          view={reviewView}
          onBack={() => {
            setReviewView(null);
            setLesson(null);
            requestAnimationFrame(() => title.current?.focus());
          }}
        />
      ) : (
        <>
          {/* 지도 화면은 제목 줄 하나에 단원·이동을 모으므로 이 줄은 이야기 화면에서만 쓴다. */}
          {scene !== 2 && (
            <div className={styles.top}>
              <span>
                {unitOfMap.number}단원 · {unitOfMap.title}
              </span>
              <button className={styles.quiet} onClick={() => go(0)}>
                클래스 소개 보기
              </button>
            </div>
          )}
          {scene === 1 && (
            <section aria-labelledby="intro-title">
              <h1 id="intro-title" ref={title} tabIndex={-1}>
                작은 작업실에서 시작된 여행
              </h1>
              <WorkbookIntro onComplete={() => go(2)} />
            </section>
          )}
          {scene === 2 && (
            <>
              <section
                className={`${styles.section} ${styles.mapSection}`}
                hidden={lesson !== null || openedPractical !== null}
              >
                <div className={styles.journeyHeading}>
                  <div>
                    <span className={styles.unitLabel}>
                      WEB CLASS ·{" "}
                      {/* 단원 이동은 지금 단원을 보여주는 제목 옆에서. 누르면 전체 과정(1~5단원)이 열린다. */}
                      <button
                        type="button"
                        className={styles.unitSwitch}
                        aria-label="전체 과정 보기"
                        aria-haspopup="dialog"
                        onClick={(event) => {
                          journeyTrigger.current = event.currentTarget;
                          setJourneyTarget(null);
                          journey.current?.showModal();
                        }}
                      >
                        {activeStage.number}단원 / {journeyStages.length}{" "}
                        <span aria-hidden="true">▾</span>
                      </button>
                    </span>
                    <h1 ref={title} tabIndex={-1}>
                      {activeStage.name}
                    </h1>
                  </div>
                  <button className={styles.quiet} onClick={() => go(0)}>
                    클래스 소개 보기
                  </button>
                  <dialog
                    ref={journey}
                    className={styles.journeyOverlay}
                    aria-labelledby="workbook-journey-title"
                    data-testid="workbook-journey"
                    onClose={() => journeyTrigger.current?.focus()}
                  >
                    <header>
                      <div>
                        <span className="label">MY FIRST WEB · 전체 과정</span>
                        <h2 id="workbook-journey-title">배우고, 내 웹페이지를 만드는 다섯 과정</h2>
                        <p>단원별 진입 가능 여부를 확인하고, 원하는 단원 지도로 이동해요.</p>
                      </div>
                      <button
                        className={styles.quiet}
                        onClick={() => journey.current?.close()}
                        aria-label="전체 과정 닫기"
                      >
                        닫기 ×
                      </button>
                    </header>
                    <nav aria-label="학습 지도 선택">
                      <ol className={styles.roadmap}>
                        {journeyStages.map((stage, index) => (
                          <li key={stage.id}>
                            <section
                              className={styles.journeyCard}
                              id={`journey-stage-${stage.id}`}
                              tabIndex={-1}
                              aria-label={`${stage.number}단원 ${stage.name}`}
                              data-current={stage.id === (journeyTarget ?? mapWorld)}
                              data-available={stage.available}
                            >
                              <span className="label">
                                {stage.number}단원 ·{" "}
                                {stage.id === mapWorld
                                  ? "현재 단원"
                                  : stage.available
                                    ? "진입 가능"
                                    : "잠김"}
                              </span>
                              <h3>{stage.name}</h3>
                              <Image
                                src={`/images/workbook/journey/${stage.image}`}
                                alt={`${stage.name} 지도`}
                                width={1536}
                                height={1024}
                                sizes="(min-width:1024px) 20vw, 80vw"
                              />
                              <button
                                className={styles.quiet}
                                aria-label={`${stage.name} 지도로`}
                                aria-describedby={`journey-status-${stage.id}`}
                                disabled={!stage.available}
                                onClick={() => selectMap(stage.id)}
                              >
                                {stage.number}단원 지도 보기 →
                              </button>
                              <span
                                className={styles.journeyStatus}
                                id={`journey-status-${stage.id}`}
                              >
                                {stage.available
                                  ? `진입 가능 · ${stage.count}/${stage.total} 학습 확인`
                                  : stage.reason}
                              </span>
                              <small>기본 {stage.total}수업 · 선택 심화 별도</small>
                              <p>{UNIT_GOALS[index]}</p>
                            </section>
                          </li>
                        ))}
                      </ol>
                      <small>
                        선택 심화는 단원별 추가 연습이며 기본 수업 완료 조건에 포함되지 않아요.
                      </small>
                    </nav>
                  </dialog>
                </div>
                {activeStage.count === activeStage.total && (
                  <details className={panelStyles.unitReview} data-unit-review>
                    <summary>{activeStage.name}에서 배운 내용·기록 다시 보기</summary>
                    <WorkbookCompletionSummary stage={mapWorld} />
                  </details>
                )}
                <>
                  <div className={styles.mapWorkspace}>
                    <div ref={mapArea} className={styles.mapSurface}>
                      {mapWorld === "publish" && (
                        <WorkbookPublishMap
                          onPractical={() => enterPractical("publish")}
                          key={publishStop}
                          panelTarget={mapPanelTarget}
                          onEnter={enterPublish}
                        />
                      )}
                      {mapWorld === "data" && (
                        <WorkbookDataMap
                          onPractical={() => enterPractical("data")}
                          key={dataStop}
                          panelTarget={mapPanelTarget}
                          onEnter={enterData}
                        />
                      )}
                      {mapWorld === "experience" && (
                        <WorkbookExperienceMap
                          onPractical={() => enterPractical("experience")}
                          key={experienceStop}
                          panelTarget={mapPanelTarget}
                          onEnter={enterExperience}
                        />
                      )}
                      {mapWorld === "project" && (
                        <WorkbookProjectMap
                          onPractical={() => enterPractical("project")}
                          key={projectStop}
                          panelTarget={mapPanelTarget}
                          onEnter={(step) => {
                            setProjectStop(step);
                            setLesson(5);
                          }}
                        />
                      )}
                      <WorkbookMap
                        onPractical={() => enterPractical("agent")}
                        panelTarget={mapPanelTarget}
                        showMap={mapWorld === "ai"}
                        completed={completed}
                        setupStatus={setupStatus}
                        practice={practice}
                        onEnter={(next) => {
                          if (next === 8) {
                            enterPublish(availablePublishStep(publish, publishStop));
                            return;
                          }
                          if (next === 7) {
                            enterData(availableDataStep(data, dataStop));
                            return;
                          }
                          if (next === 6) {
                            enterExperience(availableExperienceStep(experience, experienceStop));
                            return;
                          }
                          if (next === 5) {
                            setMapWorld("project");
                            setProjectStop(0);
                          }
                          setLesson(next);
                        }}
                        project={project}
                        projectCompleted={projectCompleted}
                        experience={experience}
                        experienceCompleted={experienceCompleted}
                        data={data}
                        dataCompleted={dataCompleted}
                        publish={publish}
                        publishCompleted={publishCompleted}
                        currentStop={currentStop}
                        onArrive={setCurrentStop}
                        onIntro={() => go(3)}
                        introNext={!introSeen && completed.length === 0}
                      />
                    </div>
                    <aside
                      ref={mapSidebar}
                      className={`${styles.mapSidebar} ${panelStyles.sidebar}`}
                      aria-label="학습 패널"
                      data-has-next-lesson={!!activeStage.next}
                    >
                      <header className={panelStyles.unitHead} aria-label="단원 진행">
                        {/* 단원 이름은 지도 위 제목에 있으므로 여기서는 목표와 진행만 보여준다. */}
                        <small>이 단원의 목표</small>
                        <p>{UNIT_GOALS[activeStage.number - 1]}</p>
                        <div className={panelStyles.unitProgress}>
                          <span aria-hidden="true">
                            {learningDone[mapWorld].map((done, index) => (
                              <i key={index} data-done={done} />
                            ))}
                          </span>
                          {activeStage.count} / {activeStage.total} 학습 확인
                        </div>
                      </header>
                      <div className={panelStyles.nextAction} aria-label="다음 학습 안내">
                        {activeStage.count === activeStage.total && (
                          <WorkbookStageHandoff
                            unit={activeStage.number}
                            nextAvailable={!nextStage || nextStage.available}
                            requiredTitle={requiredLearning?.next}
                            onRequired={startRequiredLearning}
                            nextLesson={
                              nextStage
                                ? Math.max(
                                    0,
                                    learningDone[nextStage.id].findIndex((value) => !value),
                                  )
                                : undefined
                            }
                            onStart={() => {
                              if (nextStage?.available)
                                enterLearning(
                                  nextStage.id,
                                  Math.max(
                                    0,
                                    learningDone[nextStage.id].findIndex((value) => !value),
                                  ),
                                );
                            }}
                            onMap={() => {
                              if (nextStage?.available) selectMap(nextStage.id);
                            }}
                            onSummary={() => {
                              setReviewView("summary");
                              setScene(2);
                            }}
                          />
                        )}
                        {mapWorld === "ai" && !introSeen && completed.length === 0 ? (
                          <section
                            className={panelStyles.lessonCard}
                            aria-label="먼저 볼 것"
                            data-next-card
                          >
                            <div className={panelStyles.cardHeader}>
                              <small>여기서 시작해요</small>
                            </div>
                            <h2 className={panelStyles.title}>1-0 클래스 인트로</h2>
                            <button className={panelStyles.start} onClick={() => go(3)}>
                              인트로 보기 →
                            </button>
                          </section>
                        ) : (
                          activeStage.count !== activeStage.total &&
                          activeStage.next && (
                            // 지도에서 지점을 고르면 그 카드가 대신하므로 CSS로 숨긴다(data-next-card).
                            <section
                              className={panelStyles.lessonCard}
                              aria-label="다음 수업"
                              data-next-card
                            >
                              <div className={panelStyles.cardHeader}>
                                <small>이어서 배울 수업</small>
                              </div>
                              <h2 className={panelStyles.title}>{activeStage.next}</h2>
                              <button
                                className={panelStyles.start}
                                onClick={continueLearning}
                                aria-label={`다음 수업 시작 · ${activeStage.next} →`}
                              >
                                다음 수업 시작 →
                              </button>
                            </section>
                          )
                        )}
                      </div>
                      <div id="workbook-next-stop" data-map-panel ref={setMapPanelTarget} />
                      {completedReward && (
                        <p className={styles.completionKeepsake} aria-label="단원 완료 기념">
                          배운 기록으로 ‘{slotItems[completedReward.id]}’도 작업실에 남길 수 있어요.{" "}
                          <Link href={`/workbook#workspace-collectible-${completedReward.id}`}>
                            작업실에서 확인하기 →
                          </Link>
                        </p>
                      )}
                      <nav className={panelStyles.unitLessons} aria-label="이 단원의 수업">
                        <ol>
                          {mapWorld === "ai" && (
                            <li>
                              <button
                                type="button"
                                data-current={!introSeen && completed.length === 0}
                                onClick={() => selectMapPoint("1-0")}
                              >
                                <span>1-0</span>
                                <b>클래스 인트로</b>
                                <em>{introSeen ? "" : "시작점"}</em>
                              </button>
                            </li>
                          )}
                          {unitOfMap.lessons.map((item, index) => {
                            const done = learningDone[mapWorld][index];
                            const firstOpen = learningDone[mapWorld].findIndex((value) => !value);
                            // 첫 방문에 1-0 인트로가 시작점이면 1-1에는 "다음"을 붙이지 않는다.
                            const introFirst =
                              mapWorld === "ai" && !introSeen && completed.length === 0;
                            const open =
                              activeStage.available && (firstOpen < 0 || index <= firstOpen);
                            return (
                              <li key={item.slug}>
                                <button
                                  type="button"
                                  disabled={!open}
                                  data-current={index === firstOpen && !introFirst}
                                  onClick={() => selectMapPoint(item.number)}
                                >
                                  <span>{item.number}</span>
                                  <b>{item.title}</b>
                                  <em>
                                    {done
                                      ? "학습 확인"
                                      : index === firstOpen && !introFirst
                                        ? "다음"
                                        : open
                                          ? ""
                                          : "잠김"}
                                  </em>
                                </button>
                              </li>
                            );
                          })}
                          <li>
                            <button
                              type="button"
                              disabled={!learningDone[mapWorld].every(Boolean)}
                              onClick={() => selectMapPoint("practical")}
                            >
                              <span>심화</span>
                              <b>{unitOfMap.optionalTitle}</b>
                              <em>선택</em>
                            </button>
                          </li>
                        </ol>
                      </nav>
                      <div className={panelStyles.panelFooter}>
                        <button type="button" onClick={() => go(3)}>
                          인트로 다시 보기
                        </button>
                        <WorkbookPanelDisclosure title="이용 안내">
                          <dl className={panelStyles.infoList}>
                            <div>
                              <dt>지도 사용</dt>
                              <dd>
                                지도 위 지점이나 수업 목록을 누르면 그 수업을 볼 수 있어요. 앞
                                수업을 마치면 다음 수업이 열리고, 점선으로 표시한 선택 심화는 기본
                                완료 조건에 포함되지 않아요.
                              </dd>
                            </div>
                            <div>
                              <dt>실습 환경</dt>
                              <dd>개인 컴퓨터에서 실습하고 모바일에서는 복습해요.</dd>
                            </div>
                            <div>
                              <dt>학습 기록</dt>
                              <dd>
                                예시 학습과 실제 파일 제작을 구분해요. 기록은 이번 방문 중 유지되며
                                새로고침하면 초기화돼요.
                              </dd>
                            </div>
                            <div>
                              <dt>계정 저장</dt>
                              <dd>{workbookTrial.browserRecords}</dd>
                            </div>
                          </dl>
                          <button className={panelStyles.storyLink} onClick={() => go(1)}>
                            카피바라 이야기 더 보기 · 선택
                          </button>
                        </WorkbookPanelDisclosure>
                      </div>
                    </aside>
                  </div>
                </>
              </section>
              {openedPractical && (
                <WorkbookPracticalLesson
                  stage={openedPractical}
                  onBack={() => {
                    setPracticalView(null);
                    requestAnimationFrame(() => {
                      const point = mapArea.current?.querySelector<HTMLButtonElement>(
                        'button[data-practical="true"]',
                      );
                      point?.focus();
                      point?.scrollIntoView({ block: "nearest", inline: "nearest" });
                    });
                  }}
                />
              )}
              {lesson !== null && (
                <WorkbookLessonCover
                  key={coverUnit.lessons[coverPoint].slug}
                  unit={coverUnit}
                  point={coverPoint}
                  onPreviousLesson={
                    coverUnit.number > 1 && coverPoint > 0
                      ? () => {
                          if (lesson === 5) setProjectStop(coverPoint - 1);
                          else if (lesson === 6) setExperienceStop(coverPoint - 1);
                          else if (lesson === 7) setDataStop(coverPoint - 1);
                          else if (lesson === 8) setPublishStop(coverPoint - 1);
                        }
                      : undefined
                  }
                  onBack={() => {
                    setLesson(null);
                    requestAnimationFrame(() => title.current?.focus());
                  }}
                >
                  {lesson === 8 ? (
                    <WorkbookPublishLesson
                      step={publishStop}
                      onStep={setPublishStop}
                      project={project}
                      record={publish}
                      onChange={(record) => {
                        setPublish(record);
                        setPublishStop(availablePublishStep(record, publishStop));
                        setPublishCompleted(false);
                      }}
                      onBack={() => {
                        setLesson(null);
                        requestAnimationFrame(() => title.current?.focus());
                      }}
                      onComplete={() => {
                        setPublishCompleted(true);
                        setLesson(null);
                        setReviewView("summary");
                        requestAnimationFrame(() => title.current?.focus());
                      }}
                    />
                  ) : lesson === 7 ? (
                    <WorkbookDataLesson
                      step={dataStop}
                      onStep={setDataStop}
                      project={project}
                      record={data}
                      onChange={(record) => {
                        setData(record);
                        setDataStop(availableDataStep(record, dataStop));
                        // 4단원 학습 이력은 기록 편집·예시 전환과 별개로 보존한다.
                      }}
                      onBack={() => {
                        setLesson(null);
                        requestAnimationFrame(() => title.current?.focus());
                      }}
                      onComplete={() => {
                        setDataCompleted(true);
                        setLesson(null);
                        requestAnimationFrame(() => title.current?.focus());
                      }}
                    />
                  ) : lesson === 6 ? (
                    <WorkbookExperienceLesson
                      step={experienceStop}
                      onStep={setExperienceStop}
                      project={project}
                      record={experience}
                      onChange={(record) => {
                        setExperience(record);
                        setExperienceStop(availableExperienceStep(record, experienceStop));
                        // 3단원의 학습 이력은 기록 편집·예시 전환과 별개로 보존한다.
                      }}
                      onBack={() => {
                        setLesson(null);
                        requestAnimationFrame(() => title.current?.focus());
                      }}
                      onComplete={() => {
                        setExperienceCompleted(true);
                        setLesson(null);
                        requestAnimationFrame(() => title.current?.focus());
                      }}
                    />
                  ) : lesson === 5 ? (
                    <WorkbookProjectLesson
                      step={projectStop}
                      onStep={setProjectStop}
                      record={project}
                      ready={setupStatus === "ready"}
                      onChange={setProject}
                      onBack={() => {
                        setLesson(null);
                        requestAnimationFrame(() => title.current?.focus());
                      }}
                      onComplete={() => {
                        setProjectCompleted(true);
                        setLesson(null);
                        requestAnimationFrame(() => title.current?.focus());
                      }}
                    />
                  ) : lesson === 2 ? (
                    <WorkbookSetupLesson
                      initialStatus={setupStatus}
                      onBack={() => {
                        setLesson(null);
                        requestAnimationFrame(() => title.current?.focus());
                      }}
                      onComplete={(status) => {
                        setSetupStatus(status);
                        setCompleted((previous) =>
                          previous.includes(2) ? previous : [...previous, 2],
                        );
                        setLesson(null);
                        requestAnimationFrame(() => title.current?.focus());
                      }}
                    />
                  ) : lesson === 3 || lesson === 4 ? (
                    <WorkbookPracticeLesson
                      key={lesson}
                      lesson={lesson}
                      record={practice[lesson]}
                      ready={setupStatus === "ready"}
                      onChange={(record) => {
                        setPractice((previous) => ({ ...previous, [lesson]: record }));
                      }}
                      onBack={() => {
                        setLesson(null);
                        requestAnimationFrame(() => title.current?.focus());
                      }}
                      onComplete={() => {
                        setCompleted((previous) =>
                          previous.includes(lesson) ? previous : [...previous, lesson],
                        );
                        setLesson(null);
                        requestAnimationFrame(() => title.current?.focus());
                      }}
                    />
                  ) : (
                    <WorkbookLessons
                      key={lesson}
                      initialLesson={lesson}
                      onBack={() => {
                        setLesson(null);
                        requestAnimationFrame(() => title.current?.focus());
                      }}
                      onComplete={(index) =>
                        setCompleted((previous) =>
                          previous.includes(index) ? previous : [...previous, index],
                        )
                      }
                    />
                  )}
                </WorkbookLessonCover>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}

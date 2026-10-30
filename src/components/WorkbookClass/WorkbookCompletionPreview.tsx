"use client";

// 본편과 같은 완료 요약을 독립된 테스트 기록으로 연다. 실제 진도·수집품을 해금하지 않는다.
import Link from "next/link";
import { useState } from "react";
import { WorkbookProgressPreviewProvider, useWorkbookProgress } from "./WorkbookProgressContext";
import { WorkbookDataLesson } from "./WorkbookDataLesson";
import { WorkbookExperienceLesson } from "./WorkbookExperienceLesson";
import { WorkbookCompletionSummary } from "./WorkbookCompletionSummary";
import { emptyProject } from "./WorkbookProjectLesson";
import { emptyExperience } from "@/lib/workbook-experience";
import base from "./WorkbookClass.module.scss";
import styles from "./WorkbookCompletionPreview.module.scss";

const records = {
  project: {
    ...emptyProject(),
    title: "내가 만든 작은 웹 모음",
    audience: "내 작업이 궁금한 사람",
    purpose: "내용 보기 버튼을 눌러 만든 작업을 살펴보기",
    intro: "작은 아이디어를 웹으로 만들고, 직접 확인한 과정을 기록합니다.",
    content: "처음 만든 소개 페이지\n모바일 화면을 고친 기록\n함께 써보고 싶은 작은 도구",
    request: "제목과 소개, 내용 보기 버튼, 작업 목록 순서로 index.html을 만들어줘.",
    mode: "example" as const,
    observation: "제목과 소개에서 페이지의 목적을 읽고, 내용 보기 버튼으로 작업 목록에 도착했어요.",
    previewConfirmed: true,
  },
  experience: {
    ...emptyExperience(),
    observation: "휴대폰 화면에서 페이지 너비가 넘쳐 내용을 좌우로 밀어 읽어야 했어요.",
    request: "페이지 너비를 화면 안에 맞추고, 제목과 작업 목록은 그대로 유지해줘.",
    comparison:
      "수정 후에는 휴대폰 화면 안에서 같은 내용을 읽을 수 있고 버튼도 목록으로 이동했어요.",
    before: [true, true],
    after: [true, true],
    applied: true,
    buttonChecked: true,
  },
};

export function WorkbookCompletionPreview() {
  return (
    <WorkbookProgressPreviewProvider records={records}>
      <CompletionPreviewContent />
    </WorkbookProgressPreviewProvider>
  );
}
function CompletionPreviewContent() {
  const p = useWorkbookProgress();
  const { clearResultDraft, resultDraft } = p;
  const [lesson, setLesson] = useState<"experience" | "data" | null>(null);
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<"project" | "experience" | "data">("project");
  if (lesson)
    return (
      <main className={base.page} data-learning="true">
        {lesson === "data" ? (
          <WorkbookDataLesson
            project={p.project}
            record={p.data}
            step={step}
            onStep={setStep}
            onChange={p.setData}
            onBack={() => setLesson(null)}
            onComplete={() => {
              p.setDataCompleted(true);
              setStage("data");
              setLesson(null);
            }}
          />
        ) : (
          <WorkbookExperienceLesson
            project={p.project}
            record={p.experience}
            step={step}
            onStep={setStep}
            onChange={p.setExperience}
            onBack={() => setLesson(null)}
            onComplete={() => setLesson(null)}
          />
        )}
      </main>
    );
  return (
    <main className={`${base.page} ${styles.page}`}>
      <header className={styles.header}>
        <div>
          <span className="label">WORKBOOK · UI PREVIEW</span>
          <h1>단원 완료 화면 테스트</h1>
          <p>
            테스트 기록으로 바로 살펴보는 화면이에요. 실제 학습 진도·수집품·작업실 저장에는 영향을
            주지 않아요.
          </p>
        </div>
        <Link href="/workbook/classes/vibe-web">클래스 소개로 →</Link>
      </header>
      <nav className={styles.controls} aria-label="테스트할 완료 단원">
        <button
          type="button"
          aria-pressed={stage === "project"}
          onClick={() => setStage("project")}
        >
          기획하고 첫 화면 만들기
        </button>
        <button
          type="button"
          aria-pressed={stage === "experience"}
          onClick={() => setStage("experience")}
        >
          반응형 화면 만들기
        </button>
        <button type="button" disabled={!resultDraft.ready} onClick={clearResultDraft}>
          첨부한 화면 초기화
        </button>
      </nav>
      <button
        onClick={() => {
          setStep(0);
          setLesson("experience");
        }}
      >
        3단원 수업 확인 · 독립 테스트 기록
      </button>
      <button
        onClick={() => {
          setStep(0);
          setLesson("data");
        }}
      >
        4단원 수업 확인 · 독립 테스트 기록
      </button>
      <p className={styles.help}>
        썸네일을 누르면 기획·전후 예시를 크게 볼 수 있어요. ‘내가 만든 화면 첨부하기’에서 실제
        스크린샷도 시험해보세요. 첨부·영역·설명은 이 브라우저에 테스트 기록으로 따로 저장돼요.
        초기화하면 저장본도 비워져요.
      </p>
      <div className={styles.preview}>
        <WorkbookCompletionSummary stage={stage} />
      </div>
    </main>
  );
}

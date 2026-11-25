"use client";

// Client components: 2-2 남의 페이지에서 배우기. ① 예시 세 장 보기 ② 한 장을 뜯어보기(부분을 누르면 하는 일)
// ③ 가져올 것과 뺄 것 고르기(기획 기록 references). 가져온 부분은 오려 낸 스티커처럼 스크랩북에 붙는다.
// ④ 실제로 찾는 법(검색어 · AI에게 부탁하기 · 지킬 것). 예시 페이지는 실제 사이트처럼 그린 가상의 페이지다. 뜯어보기에서 찾은 부분은 방문 중 화면 상태다.
import Image from "next/image";
import { Nanum_Pen_Script } from "next/font/google";
import { useState } from "react";
import { referenceExamples } from "@/lib/workbook-plan-options";
import { planLines, type PlanReader } from "@/lib/workbook-plan-readers";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { WorkbookRefPage, WorkbookRefPartContent } from "./WorkbookRefPage";
import { WorkbookCopyFallback } from "./WorkbookCopyFallback";
import styles from "./WorkbookRefScreens.module.scss";

const LETTERS = ["A", "B", "C"] as const;
const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/** ① 처음부터 발명하지 않아요. */
export function WorkbookRefGallery() {
  return (
    <div data-lesson-wide className={styles.screen}>
      <h2 id="lesson-screen-title" className={styles.title}>
        처음부터 새로 발명하지 않아요
      </h2>
      <div className={styles.lead}>
        <p>
          기획을 잘하는 사람들도 빈 종이에서 시작하지 않아요. 같은 목적의 페이지를 여러 개 보고{" "}
          <strong>좋은 점을 골라 오는 것</strong>부터 합니다. 이렇게 참고하는 페이지를{" "}
          <strong>레퍼런스</strong>라고 불러요. 생김새가 다른 세 가지 예시를 볼까요?
        </p>
      </div>
      <div className={styles.gallery}>
        {referenceExamples.map((example, index) => (
          <WorkbookRefPage key={example.id} example={example} letter={LETTERS[index]} />
        ))}
      </div>
      <p className={styles.closing}>
        세 페이지 모두 무언가를 소개하지만, 첫 화면을 시작하는 방법은 서로 달라요. 다음 화면에서 한
        장씩 뜯어봐요.
      </p>
    </div>
  );
}

/** ② 페이지를 부분으로 나눠 각 부분이 하는 일을 본다. */
export function WorkbookRefAnatomy() {
  const [found, setFound] = useWorkbookLessonState<string[]>("ref-found", []);
  const total = referenceExamples.reduce((sum, example) => sum + example.parts.length, 0);
  return (
    <div data-lesson-wide className={styles.screen}>
      <h2 id="lesson-screen-title" className={styles.title}>
        페이지를 부분으로 뜯어봐요
      </h2>
      <div className={styles.lead}>
        <p>
          점선으로 둘러싼 부분을 눌러 보세요. 그 부분이 <strong>무슨 일을 하는지</strong>가 붙어요.
          예쁜지보다 하는 일을 보면, 내 페이지에 무엇이 필요한지 보입니다.
        </p>
      </div>
      <div className={styles.gallery}>
        {referenceExamples.map((example, index) => (
          <WorkbookRefPage
            key={example.id}
            example={example}
            letter={LETTERS[index]}
            found={found}
            onPart={(id) => setFound(found.includes(id) ? found : [...found, id])}
          />
        ))}
      </div>
      <p className={styles.closing} aria-live="polite">
        {found.length === total
          ? "다 찾았어요. 사진 · 소개 · 목록 · 후기 · 버튼처럼, 페이지는 하는 일이 다른 부분들로 이루어져 있어요."
          : `${found.length} / ${total}개 찾았어요.`}
      </p>
    </div>
  );
}

/** ③ 가져올 것과 뺄 것. */
export function WorkbookRefPick({
  record,
  update,
}: {
  record: ProjectRecord;
  update: (patch: Partial<ProjectRecord>) => void;
}) {
  const lines = planLines(record.references);
  const state = (id: string) =>
    lines.includes(`take:${id}`) ? "take" : lines.includes(`drop:${id}`) ? "drop" : null;
  function choose(id: string, value: "take" | "drop") {
    const rest = lines.filter((line) => line !== `take:${id}` && line !== `drop:${id}`);
    update({
      references: [...rest, ...(state(id) === value ? [] : [`${value}:${id}`])].join("\n"),
    });
  }
  const takenIds = lines.filter((line) => line.startsWith("take:")).map((line) => line.slice(5));
  const taken = takenIds.length;
  return (
    <div data-lesson-wide className={styles.screen}>
      <h2 id="lesson-screen-title" className={styles.title}>
        내 페이지에 가져올 것과 뺄 것
      </h2>
      <div className={styles.lead}>
        <p>
          세 예시의 부분 가운데 내 페이지에 어울리는 것은 <strong>가져오기</strong>, 맞지 않는 것은{" "}
          <strong>빼기</strong>를 눌러요. 정답은 없어요. 읽을 사람과 목적에 맞는지가 기준입니다.
        </p>
      </div>
      <div className={styles.pickGrid}>
        {referenceExamples.map((example, index) => (
          <section
            key={example.id}
            className={styles.pickGroup}
            aria-label={`예시 ${LETTERS[index]}의 부분`}
          >
            <h3>
              예시 {LETTERS[index]} · {example.name}
            </h3>
            <ul>
              {example.parts.map((part) => (
                <li key={part.id} data-state={state(part.id) ?? "none"}>
                  <span>{part.label}</span>
                  <span className={styles.toggle}>
                    <button
                      type="button"
                      aria-pressed={state(part.id) === "take"}
                      aria-label={`${part.label} 가져오기`}
                      onClick={() => choose(part.id, "take")}
                    >
                      가져오기
                    </button>
                    <button
                      type="button"
                      aria-pressed={state(part.id) === "drop"}
                      aria-label={`${part.label} 빼기`}
                      onClick={() => choose(part.id, "drop")}
                    >
                      빼기
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className={styles.scrap} aria-label="내 페이지 스크랩북">
        <h3 className={hand.className}>내 페이지 스크랩북</h3>
        {takenIds.length > 0 ? (
          <ul className={styles.stickers}>
            {takenIds.map((id) => {
              const index = referenceExamples.findIndex((example) =>
                example.parts.some((item) => item.id === id),
              );
              const meta = referenceExamples[index].parts.find((item) => item.id === id)!;
              return (
                <li key={id}>
                  <span className={styles.sticker} aria-hidden="true">
                    <WorkbookRefPartContent id={id} />
                  </span>
                  <span className={`${styles.stickerLabel} ${hand.className}`}>
                    예시 {LETTERS[index]} · {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.scrapEmpty}>가져오기를 누르면 그 부분을 오려서 여기에 붙여요.</p>
        )}
        <div className={styles.scrapCapy} aria-hidden="true">
          <Image src="/images/workbook/lesson-1-4/capy-point.png" alt="" width={261} height={480} />
        </div>
      </section>
      <p className={styles.closing}>
        {taken > 0
          ? `가져올 것 ${taken}개를 골랐어요. 다음 수업에서 넣을 내용과 순서를 정할 때 참고해요.`
          : "가져올 것을 하나 이상 골라 보세요."}
      </p>
    </div>
  );
}

/** ④ 실제로 찾는 법. */
export function WorkbookRefSearch({
  record,
  reader,
}: {
  record: ProjectRecord;
  reader: PlanReader | null;
}) {
  const [copied, setCopied] = useState<"done" | "failed" | null>(null);
  const words: Record<string, string> = {
    portfolio: "포트폴리오 사이트 예시",
    service: "서비스 소개 페이지 예시",
    personal: "추천 모음 페이지 예시",
  };
  const word = words[reader?.id ?? "portfolio"];
  const ask = `${record.audience.trim() || "내 페이지를 볼 사람"}에게 보여줄 한 페이지짜리 소개 사이트를 만들려고 해. 이런 목적의 페이지가 흔히 어떤 순서로 구성되는지 세 가지 유형으로 알려줘. 유형마다 좋은 점과 아쉬운 점도 한 줄씩 적어줘.`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(ask);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
  }
  return (
    <div data-lesson-wide className={styles.screen}>
      <h2 id="lesson-screen-title" className={styles.title}>
        내 레퍼런스는 이렇게 찾아요
      </h2>
      <div className={styles.lead}>
        <p>
          오늘 본 예시는 연습용이에요. 내 페이지의 레퍼런스는 직접 찾아봅니다. 방법은 두 가지,
          그리고 꼭 지킬 것 하나가 있어요.
        </p>
      </div>
      <div className={styles.tips}>
        <section className={styles.tip}>
          <h3>1. 검색해서 찾기</h3>
          <p>
            검색창에 <q>{word}</q>처럼 <strong>내 목적 + 예시</strong>로 찾아요. 마음에 드는
            페이지는 주소를 적어 두거나 화면을 캡처해 둬요.
          </p>
        </section>
        <section className={styles.tip}>
          <h3>2. AI에게 구조를 물어보기</h3>
          <p className={styles.ask}>{ask}</p>
          <div className={styles.copyRow}>
            <button type="button" className={styles.copy} onClick={copy}>
              부탁 문장 복사하기
            </button>
            <span role="status">
              {copied === "done" && "복사했어요. Claude 앱에 붙여 넣고 보내요."}
            </span>
          </div>
          {copied === "failed" && <WorkbookCopyFallback text={ask} />}
        </section>
        <section className={styles.tip} data-kind="rule">
          <h3>꼭 지킬 것</h3>
          <p>
            레퍼런스에서는 <strong>구조와 순서만</strong> 참고해요. 남의 글 · 사진 · 로고는 내
            페이지에 가져오지 않습니다.
          </p>
        </section>
      </div>
    </div>
  );
}

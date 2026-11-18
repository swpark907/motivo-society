"use client";

// Client component: a short demo of being grilled. The AI side asks up to three questions built from
// the learner's own blueprint (a "지금" card, the bottom button, a "나중에" card); each press asks one
// more. Next to it: what grilling is and what a skill is. The questions are a prepared demo shown
// in the workbook — nothing is sent anywhere; answering for real happens in 2-2 with the AI app.
// Skill facts were checked on 2026-11-18 (Claude Code docs: code.claude.com/docs/en/skills;
// grill-me by Matt Pocock, github.com/mattpocock/skills).
import { planLines, type PlanButton } from "@/lib/workbook-plan-readers";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookPlanGrill.module.scss";

/** 2-1 screen 5: let the AI grill the plan. Questions come from the learner's blueprint. */
export function WorkbookPlanGrill({
  record,
  button,
}: {
  record: ProjectRecord;
  button: PlanButton | null;
}) {
  const [asked, setAsked] = useWorkbookLessonState("plan-grill-asked", 0);
  const now = planLines(record.content);
  const later = planLines(record.later);
  const questions = [
    now[0]
      ? `‘${now[0]}’에는 구체적으로 어떤 내용을 적을까요? 하나만 고른다면요?`
      : "이 페이지에서 가장 먼저 보여줄 것은 무엇인가요?",
    button
      ? `‘${button.label}’ 버튼을 누르면 어떤 화면으로 가야 하나요?`
      : "다 읽은 사람이 마지막에 무엇을 했으면 하나요?",
    later[0]
      ? `‘${later[0]}’ 내용은 언제쯤 채울 수 있나요? 그전까지는 페이지에서 빼 둘까요?`
      : "다 읽은 사람이 딱 하나만 기억한다면, 무엇이었으면 하나요?",
  ];
  const shown = Math.min(asked, questions.length);

  return (
    <div data-lesson-wide className={styles.grill}>
      <h2 id="lesson-screen-title" className={styles.title}>
        AI에게 내 기획을 질문해 달라고 해요
      </h2>
      <div className={styles.lead}>
        <p>
          기획을 하다 보면 <strong>내가 미처 생각하지 못한 부분</strong>이 생기기 쉬워요. 그럴 때는
          AI에게 답을 달라고 하기보다, 내 기획에 대해 <strong>질문해 달라고</strong> 부탁해 보세요.
          지금까지 정한 기획을 보여 주고 질문을 받아 볼게요.
        </p>
      </div>

      <div className={styles.layout}>
        <section className={styles.chat} aria-label="AI가 질문하는 예시">
          <p className={styles.me}>
            지금까지 정한 내 홈페이지 기획이야. 빠진 부분이 있으면 하나씩 물어봐줘.
          </p>
          <ol className={styles.questions} aria-live="polite">
            {questions.slice(0, shown).map((question) => (
              <li key={question} className={styles.ai}>
                {question}
              </li>
            ))}
          </ol>
          {shown < questions.length ? (
            <button type="button" className={styles.more} onClick={() => setAsked(shown + 1)}>
              {shown === 0 ? "질문 받기" : "질문 하나 더 받기"}
            </button>
          ) : (
            <p className={styles.after}>
              이 질문들에 대한 대답은 다음 수업에서 AI에게 직접 하게 돼요. 대답하다 보면 페이지에
              들어갈 내용이 하나씩 채워집니다.
            </p>
          )}
        </section>

        <div className={styles.notes}>
          <section className={styles.note} aria-labelledby="grill-what">
            <h3 id="grill-what">질문으로 기획 다듬기 · 그릴링</h3>
            <p>
              AI가 내 계획을 하나하나 따져 묻게 하는 방법을 <strong>그릴링(grilling)</strong>이라고
              불러요. 영어로 ‘꼬치꼬치 캐묻다’라는 뜻이에요.
            </p>
          </section>
          <section className={styles.note} aria-labelledby="skill-what">
            <h3 id="skill-what">스킬이란?</h3>
            <p>
              스킬은 AI에게 “이런 일은 이런 방법으로 해 줘”라고 미리 적어 둔 <strong>설명서</strong>
              예요. Claude Code에 스킬을 넣어 두면 AI가 필요할 때 알아서 사용하거나, 내가{" "}
              <code>/스킬이름</code>을 입력해 바로 부를 수 있어요. 예를 들어 개발자 Matt Pocock이
              공개한 <code>grill-me</code> 스킬은 내 계획에 대해 끝까지 질문해 줍니다.
            </p>
            <p className={styles.later}>
              스킬을 설치하고 직접 만드는 방법은 뒤의 심화 강의에서 자세히 다룰 거예요. 오늘은 설치
              없이, 다음 수업의 요청에 “나에게 하나씩 물어봐줘”라는 문장을 넣어서 같은 방법을 써
              볼게요.
            </p>
            <small>2026-11-18 확인</small>
          </section>
        </div>
      </div>
    </div>
  );
}

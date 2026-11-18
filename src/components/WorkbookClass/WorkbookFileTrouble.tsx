"use client";

// Client component: three trouble cards the learner opens to read what to check. Which cards are
// open is kept in the visit's lesson state.
import { Nanum_Pen_Script } from "next/font/google";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookFileTrouble.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/**
 * Three common first-file problems and one thing to check for each. The menu names are the
 * operating systems' own Korean labels (Windows "연결 프로그램", macOS "다음으로 열기").
 */
const CARDS = [
  {
    symptom: "폴더에 파일이 안 보여요",
    check:
      "Code 탭 오른쪽 ‘환경’ 칸에서 작업 폴더가 my-first-web이 맞는지 봐요. 다른 폴더에 만들어졌을 수 있어요. 모르겠으면 AI에게 “방금 만든 파일이 어디 있어?”라고 물어보세요.",
  },
  {
    symptom: "화면 대신 글자만 가득 나와요",
    check:
      "그 글자가 바로 HTML 코드예요. 파일이 브라우저가 아니라 글 편집 프로그램으로 열린 거예요. 파일을 마우스 오른쪽 버튼으로 누르고 ‘연결 프로그램’(Mac은 ‘다음으로 열기’)에서 브라우저를 골라요.",
  },
  {
    symptom: "고쳤는데 화면이 그대로예요",
    check:
      "브라우저에서 새로고침을 눌렀는지 봐요. 그래도 그대로면 AI에게 “어느 파일을 고쳤어?”라고 물어보세요.",
  },
] as const;

/** 1-6 screen 5: when it does not go as expected. Nothing is graded; reading is enough. */
export function WorkbookFileTrouble() {
  const [open, setOpen] = useWorkbookLessonState<number[]>("ai-6-trouble-open", []);
  function toggle(index: number) {
    setOpen(open.includes(index) ? open.filter((item) => item !== index) : [...open, index]);
  }

  return (
    <div data-lesson-wide className={styles.trouble}>
      <h2 id="lesson-screen-title" className={styles.title}>
        생각대로 안 될 때
      </h2>
      <div className={styles.lead}>
        <p>
          처음에는 한 번에 안 되는 게 보통입니다. 자주 만나는 세 가지를 미리 봐 둘게요. 카드를
          누르면 확인할 것이 나와요.
        </p>
      </div>

      <ul className={styles.cards}>
        {CARDS.map((card, index) => {
          const shown = open.includes(index);
          return (
            <li key={card.symptom} className={styles.card} data-open={shown || undefined}>
              <button
                type="button"
                className={styles.front}
                aria-expanded={shown}
                aria-controls={shown ? `trouble-${index}` : undefined}
                onClick={() => toggle(index)}
              >
                <span className={styles.no}>이럴 땐 {index + 1}</span>
                <span className={`${styles.symptom} ${hand.className}`}>{card.symptom}</span>
                <span className={styles.hint}>{shown ? "접기" : "눌러서 확인할 것 보기"}</span>
              </button>
              {shown && (
                <p id={`trouble-${index}`} className={styles.check}>
                  {card.check}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <p className={styles.closing}>
        여기에 없는 일이 생기면 보이는 그대로 AI에게 말해 주세요. “index.html을 열었는데 빈 화면이
        나와”처럼 <strong>한 일</strong>과 <strong>보이는 것</strong>을 함께 적으면 됩니다.
      </p>
    </div>
  );
}

"use client";

// Client component: the learner picks an example and cuts it into pieces. The choice is kept in
// the visit's lesson state so coming back to this screen shows what they last cut.
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookTokenScissors.module.scss";

/**
 * Hand-made example pieces, not the output of any real tokenizer: each AI splits text its own
 * way, so the screen says the pieces are an example and only compares the samples to each other.
 * The code sample is the `<h1>` line from 1-1 screen 2 ("코드도 결국 글자예요").
 */
const SAMPLES = [
  { name: "한국어 문장", pieces: ["창", "가에서", " 책", "을", " 읽", "어요"] },
  { name: "영어 문장", pieces: ["I", " read", " a", " book", " by", " the", " window"] },
  {
    name: "코드 한 줄",
    pieces: ["<", "h1", ">", "안녕", "하세요", "</", "h1", ">"],
    code: true,
  },
] as const;

/**
 * 1-3 screen 1: tokens. A sentence strip that gets cut into pieces with scissors.
 * Says what it is first, then invites the learner to cut; nothing is graded.
 */
export function WorkbookTokenScissors() {
  const [picked, setPicked] = useWorkbookLessonState("ai-2-token-sample", 0);
  const [cut, setCut] = useWorkbookLessonState("ai-2-token-cut", false);
  const sample = SAMPLES[picked];

  return (
    <div data-lesson-wide className={styles.tokens}>
      <h2 id="lesson-screen-title" className={styles.title}>
        AI는 글을 조각으로 나눠 읽어요
      </h2>
      <div className={styles.lead}>
        <p>
          AI는 글을 작은 조각으로 나눠서 읽고 씁니다. 이 조각을 <strong>토큰</strong>이라고 해요.
        </p>
        <p>AI 서비스는 이 조각이 몇 개 오갔는지로 사용량을 셉니다.</p>
      </div>

      <div className={styles.bench}>
        <p className={styles.invite}>예문을 골라서 가위로 잘라 볼까요?</p>
        <div className={styles.samples} role="group" aria-label="예문 고르기">
          {SAMPLES.map((item, index) => (
            <button
              key={item.name}
              type="button"
              aria-pressed={picked === index}
              onClick={() => {
                setPicked(index);
                setCut(false);
              }}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div
          className={styles.strip}
          data-cut={cut || undefined}
          data-code={"code" in sample || undefined}
          aria-live="polite"
        >
          {sample.pieces.map((piece, index) => (
            <span key={`${picked}-${index}`} className={styles.piece}>
              {piece}
            </span>
          ))}
        </div>

        <div className={styles.result}>
          {cut ? (
            <p>
              <strong>{sample.pieces.length}조각</strong>으로 나뉘었어요.
              {"code" in sample && " 코드도 글자라서 똑같이 조각으로 세요."}
            </p>
          ) : (
            <button type="button" className={styles.cutButton} onClick={() => setCut(true)}>
              <ScissorsIcon />
              가위로 자르기
            </button>
          )}
        </div>
      </div>

      <p className={styles.note}>
        나누는 방식은 AI마다 조금씩 달라요. 위 조각은 이해를 돕는 예시예요.
      </p>
    </div>
  );
}

function ScissorsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.scissors}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M8.5 8l12 10M8.5 16l12-10" />
    </svg>
  );
}

"use client";

// Client component: the learner taps numbered pins on a sketch of the app to read what each
// part is for. The chosen pin is kept in the visit's lesson state.
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { WorkbookSetupStamps } from "./WorkbookSetupStamps";
import styles from "./WorkbookSetupTour.module.scss";

/**
 * The four parts a beginner needs to find. What each part does is from the official docs
 * (desktop quickstart, permission modes; checked 2026-11-17). The sketch follows the layout of the
 * real desktop app from a screenshot the planner took on 2026-11-17 (chat/code switch at the top
 * left, session list on the left, conversation and input in the middle, the "환경" panel with the
 * working folder on the right). It is still our own drawing with no logo and no real content,
 * and says the layout can change with updates.
 */
const PINS = [
  {
    name: "Code 탭",
    text: "창 왼쪽 위의 </> 모양 버튼이에요. 여기를 눌러야 Claude Code가 열립니다.",
  },
  {
    name: "작업 폴더",
    text: "오른쪽 ‘환경’ 칸에 지금 일하는 폴더가 보여요. 다음 화면에서 폴더를 만들고 연결해요.",
  },
  {
    name: "부탁 적는 칸",
    text: "아래쪽 입력 칸이에요. 만들고 싶은 것, 고치고 싶은 것을 말로 적어서 보냅니다.",
  },
  {
    name: "승인을 묻는 창",
    text: "파일을 만들거나 고치기 전에 대화 중간에 물어봐요. 내용을 보고 승인하거나 거절하면 됩니다.",
  },
] as const;

/** 1-4 screen 3: a pinned tour of the app, drawn as a simple sketch. */
export function WorkbookSetupTour() {
  const [pin, setPin] = useWorkbookLessonState("setup-tour-pin", 0);
  return (
    <div data-lesson-wide className={styles.tour}>
      <h2 id="lesson-screen-title" className={styles.title}>
        화면을 둘러봐요
      </h2>
      <p className={styles.lead}>
        앱을 열면 처음엔 낯설 수 있어요. 네 곳만 알면 됩니다. 번호를 눌러 볼까요?
      </p>

      <div className={styles.layout}>
        <div className={styles.sketch}>
          <svg viewBox="0 0 400 250" role="presentation" aria-hidden="true">
            <rect x="1" y="1" width="398" height="248" rx="8" className={styles.frame} />
            {/* 위쪽 줄: 창 단추, 그리고 채팅·코드 전환 버튼 */}
            <path d="M1 24h398" className={styles.line} />
            <circle cx="13" cy="12" r="3" className={styles.dot} />
            <circle cx="24" cy="12" r="3" className={styles.dot} />
            <circle cx="35" cy="12" r="3" className={styles.dot} />
            <rect x="58" y="5" width="44" height="14" rx="4" className={styles.block} />
            <rect x="80" y="5" width="22" height="14" rx="4" className={styles.active} />
            <path d="M66 9.5h7v5h-4l-2 2v-2h-1z" className={styles.icon} />
            <path d="M88 9l-3 3 3 3M94 9l3 3-3 3" className={styles.iconOn} />
            <rect x="116" y="9" width="110" height="6" rx="3" className={styles.block} />
            {/* 왼쪽: 작업(세션) 목록 */}
            <path d="M84 24v225" className={styles.line} />
            <rect x="8" y="36" width="60" height="5" rx="2.5" className={styles.block} />
            <rect x="8" y="50" width="52" height="5" rx="2.5" className={styles.block} />
            <rect x="8" y="64" width="64" height="5" rx="2.5" className={styles.block} />
            <rect x="4" y="80" width="76" height="14" rx="4" className={styles.block} />
            <rect x="8" y="104" width="48" height="5" rx="2.5" className={styles.block} />
            <rect x="8" y="118" width="58" height="5" rx="2.5" className={styles.block} />
            {/* 가운데: 대화와 승인을 묻는 창 */}
            <rect x="100" y="38" width="170" height="5" rx="2.5" className={styles.block} />
            <rect x="100" y="50" width="140" height="5" rx="2.5" className={styles.block} />
            <rect x="100" y="62" width="156" height="5" rx="2.5" className={styles.block} />
            <rect x="100" y="92" width="184" height="62" rx="6" className={styles.paper} />
            <text x="110" y="109" className={styles.label}>
              index.html 을 만들어도 될까요?
            </text>
            <rect x="110" y="124" width="46" height="18" rx="4" className={styles.active} />
            <text x="133" y="136" textAnchor="middle" className={styles.labelOn}>
              승인
            </text>
            <rect x="162" y="124" width="46" height="18" rx="4" className={styles.outline} />
            <text x="185" y="136" textAnchor="middle" className={styles.label}>
              거절
            </text>
            {/* 아래: 부탁 적는 칸 */}
            <rect x="100" y="200" width="186" height="36" rx="10" className={styles.paper} />
            <path d="M110 218h10M115 213v10" className={styles.icon} />
            <rect x="128" y="215" width="96" height="5" rx="2.5" className={styles.block} />
            {/* 고른 번호의 자리를 테두리로 짚어 준다 */}
            {pin === 0 && (
              <rect x="77" y="2" width="28" height="20" rx="5" className={styles.spot} />
            )}
            {pin === 1 && (
              <rect x="304" y="30" width="92" height="40" rx="5" className={styles.spot} />
            )}
            {pin === 2 && (
              <rect x="96" y="196" width="194" height="44" rx="12" className={styles.spot} />
            )}
            {pin === 3 && (
              <rect x="96" y="88" width="192" height="70" rx="8" className={styles.spot} />
            )}
            {/* 오른쪽: 환경(작업 폴더)과 변경 사항 */}
            <path d="M300 24v225" className={styles.line} />
            <text x="310" y="42" className={styles.small}>
              환경
            </text>
            <path d="M310 54h6l2 2h7v9h-15z" className={styles.icon} />
            <text x="330" y="63" className={styles.label}>
              my-first-web
            </text>
            <rect x="310" y="76" width="70" height="5" rx="2.5" className={styles.block} />
            <path d="M306 96h88" className={styles.faint} />
            <text x="310" y="114" className={styles.small}>
              변경 사항
            </text>
            <rect x="310" y="124" width="54" height="5" rx="2.5" className={styles.block} />
          </svg>
          {PINS.map((item, index) => (
            <button
              key={item.name}
              type="button"
              className={styles.pin}
              data-pin={index}
              aria-pressed={pin === index}
              aria-label={`${index + 1}. ${item.name}`}
              onClick={() => setPin(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div className={styles.side}>
          <div className={styles.detail} aria-live="polite">
            <strong>
              {pin + 1}. {PINS[pin].name}
            </strong>
            <p>{PINS[pin].text}</p>
          </div>
          <p className={styles.caveat}>
            실제 화면과 자리가 조금 다를 수 있어요. 업데이트로 바뀌기도 합니다.
          </p>
          <details className={styles.help}>
            <summary>Code 탭이 안 보여요</summary>
            <p>Claude Code는 유료 요금제에서 열려요. 요금제와 앱이 최신인지 확인해 보세요.</p>
          </details>
          <WorkbookSetupStamps only={[2]} compact />
        </div>
      </div>
    </div>
  );
}

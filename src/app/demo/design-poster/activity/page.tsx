import Image from "next/image";
import { ACTIVITIES, priceLabel } from "../../design-platform/_mock";
import { SecHead } from "../_parts";
import s from "../poster.module.scss";

const A = ACTIVITIES.find((a) => a.slug === "vibe-season-4w")!;

const TRACKS = [
  { no: "01", title: "기획", when: "11.3 (화) · 오후 7:30", state: "done" },
  { no: "02", title: "첫 화면", when: "오늘 · 오후 7:30", state: "now" },
  { no: "03", title: "기능 붙이기", when: "11.17 (화) · 오후 7:30", state: "" },
  { no: "04", title: "배포와 발표", when: "11.24 (화) · 오후 7:30", state: "" },
];

const FAQ = [
  [
    "비용은 어떻게 내나요?",
    "40,000원(시즌 전체). 신청하면 자리가 잡히고, 안내된 기한 안에 계좌로 입금하면 운영진이 확인한 뒤 확정돼요.",
  ],
  [
    "환불은 어떻게 되나요?",
    "시작 7일 전까지 전액, 3일 전까지 50%. 그 뒤에는 환불되지 않아요. (시험값 · 대표 승인 전)",
  ],
  [
    "중간에 들어가도 되나요?",
    "네. 이미 시작했지만 지금 합류할 수 있어요. 지난 회차는 함께하지 못해요.",
  ],
];

/** 활동 상세 시안: 흑백 사진 위 거대한 제목 → 숫자 네 칸 → 종이 위 소개 → 트랙 목록 회차 → 알아 둘 것. */
export default function PosterActivity() {
  return (
    <>
      <div className={`${s.photo} ${s.hero}`}>
        <Image src={A.cover} alt="" fill sizes="100vw" priority />
        <div className={s.heroText}>
          <div className={`${s.wrap} ${s.heroInner}`}>
            <span className={s.heroTag}>SEASON · 4회 · 합류 가능</span>
            <h1 className={`${s.display} ${s.heroTitle}`}>
              <span>4주 동안</span>
              <br />
              <span>내 서비스 하나</span>
            </h1>
          </div>
        </div>
      </div>

      <div className={s.wrap}>
        <div className={s.detail}>
          <div>
            <section className={s.section} style={{ borderTop: 0 }}>
              <ul className={s.stats}>
                <li>
                  <span className={s.label}>다음 회차</span>
                  <strong>TODAY 19:30</strong>
                </li>
                <li>
                  <span className={s.label}>방식</span>
                  <strong>ONLINE</strong>
                </li>
                <li>
                  <span className={s.label}>자리</span>
                  <strong>2 / 6</strong>
                </li>
                <li>
                  <span className={s.label}>회차</span>
                  <strong>4 WEEKS</strong>
                </li>
              </ul>
              <div className={s.paperNote}>
                <p className={s.paperLabel}>ABOUT THIS SEASON</p>
                <p>
                  한 주에 한 번, 4주 동안 <strong>내 서비스 하나를 끝까지</strong> 만들어요. 매 회차
                  만든 것을 서로 보여 주고, 다음 주에 할 일을 한 줄로 남겨요.
                </p>
              </div>
            </section>

            <section className={s.section}>
              <SecHead label="Sessions" title="회차" />
              <ol className={s.tracks}>
                {TRACKS.map((t) => (
                  <li
                    key={t.no}
                    className={`${s.track} ${t.state === "done" ? s.trackDone : ""} ${t.state === "now" ? s.trackNow : ""}`}
                  >
                    <span className={`${s.display} ${s.trackNo}`}>{t.no}</span>
                    <span>
                      <span className={s.trackTitle}>{t.title}</span>
                      <br />
                      <span className={s.trackWhen}>{t.when}</span>
                    </span>
                    <span className={s.trackEnd}>
                      {t.state === "done" ? (
                        "끝남"
                      ) : t.state === "now" ? (
                        <span className={s.nowBadge}>오늘</span>
                      ) : (
                        ""
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section className={s.section}>
              <SecHead label="Before you join" title="알아 두세요" />
              <div className={s.faq}>
                {FAQ.map(([q, a], i) => (
                  <details key={q} open={i === 0}>
                    <summary>{q}</summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <aside className={s.side}>
            <p className={s.label}>시즌 전체 · 4자리 남음</p>
            <p className={`${s.display} ${s.price}`}>{priceLabel(A.price)}</p>
            <a href="#" className={`${s.btn} ${s.btnOrange} ${s.sideCta}`}>
              중간 합류 신청
            </a>
            <div className={s.host}>
              <span className={s.face} aria-hidden="true">
                바
              </span>
              <span>
                <strong>{A.host}</strong>
                개인 호스트 · 지난 활동 3번
              </span>
            </div>
          </aside>
        </div>
        <div className={s.applySpace} />
      </div>

      <div className={s.applyBar}>
        <span>
          <strong>{priceLabel(A.price)}</strong>
          <small>4자리 남음</small>
        </span>
        <a href="#" className={`${s.btn} ${s.btnOrange}`}>
          중간 합류 신청
        </a>
      </div>
    </>
  );
}

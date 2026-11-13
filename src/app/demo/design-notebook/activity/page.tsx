import Image from "next/image";
import { ACTIVITIES, priceLabel } from "../../design-platform/_mock";
import { CapySays, Face, SecHead } from "../_parts";
import s from "../notebook.module.scss";

const A = ACTIVITIES.find((a) => a.slug === "vibe-season-4w")!;

const SESSIONS = [
  { no: 1, title: "기획", when: "11.3 (화) · 오후 7:30", state: "done" },
  { no: 2, title: "첫 화면", when: "오늘 · 오후 7:30", state: "today" },
  { no: 3, title: "기능 붙이기", when: "11.17 (화) · 오후 7:30", state: "" },
  { no: 4, title: "배포와 발표", when: "11.24 (화) · 오후 7:30", state: "" },
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

/** 활동 상세 시안: 랜딩 히어로와 같은 검은 띠(왼쪽 제목 · 오른쪽 정보 줄과 신청) → 테이프로 붙인 표지 → 회차 · 여는 사람 · 알아 둘 것. */
export default function NotebookActivity() {
  return (
    <>
      <header className={s.band}>
        <span className={s.ghost} aria-hidden="true">
          SEASON
        </span>
        <div className={`${s.wrap} ${s.bandInner}`}>
          <div className={s.detailBand}>
            <div className={s.bandContent}>
              <p className={s.bandMeta}>
                <span className={s.bandBrand}>시즌 · 4회</span>
                <span>진행 중 · 중간 합류 가능</span>
              </p>
              <h1 className={s.bandTitle}>
                4주 동안
                <br />
                <em>내 서비스 하나</em>
                <br />
                끝까지 만들기
              </h1>
            </div>
            <div>
              <ul className={s.facts}>
                <li>
                  다음 회차 <strong>오늘 · 오후 7:30</strong>
                </li>
                <li>
                  방식 <strong>온라인 화상 · 매주 화</strong>
                </li>
                <li>
                  자리 <strong>2/6명 · 4자리 남음</strong>
                </li>
                <li>
                  참가비 <strong>{priceLabel(A.price)}</strong>
                </li>
              </ul>
              <a href="#" className={`${s.btn} ${s.factsCta}`}>
                중간 합류 신청
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className={s.wrap}>
        <div className={s.detailGrid}>
          <div>
            <figure className={s.taped}>
              <span className={s.tapedPhoto}>
                <Image
                  src={A.cover}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 700px, 100vw"
                  priority
                />
              </span>
              <figcaption className={s.tapedCap}>SEASON 4W · WEEK 2</figcaption>
            </figure>

            <section className={s.section}>
              <SecHead no="01" eyebrow="About" title="이런 시즌이에요" />
              <p className={s.prose}>
                한 주에 한 번, 4주 동안 <strong>내 서비스 하나를 끝까지</strong> 만들어요. 매 회차
                만든 것을 서로 보여 주고, 다음 주에 할 일을 한 줄로 남겨요.
              </p>
            </section>

            <section className={s.section}>
              <SecHead no="02" eyebrow="Sessions" title="회차" />
              <ol className={s.sessions} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {SESSIONS.map((x) => (
                  <li
                    key={x.no}
                    className={`${s.session} ${x.state === "done" ? s.sessionDone : ""} ${x.state === "today" ? s.sessionToday : ""}`}
                  >
                    <span className={s.sessionNo}>{String(x.no).padStart(2, "0")}</span>
                    <span className={s.sessionTitle}>{x.title}</span>
                    <span className={s.sessionWhen}>{x.when}</span>
                    {x.state === "done" && <span className={s.doneStamp}>끝남</span>}
                  </li>
                ))}
              </ol>
            </section>

            <section className={s.section}>
              <SecHead no="03" eyebrow="Before you join" title="신청 전에 알아 두세요" />
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

          <aside className={`${s.section} ${s.aside}`}>
            <SecHead eyebrow="Host" title="여는 사람" />
            <div className={s.hostCard}>
              <Face name={A.host} large />
              <div>
                <strong>{A.host}</strong>
                <small>개인 호스트 · 지난 활동 3번</small>
              </div>
            </div>
            <CapySays>2회차부터 들어와도 돼요. 오늘 저녁이 첫 화면 만드는 날이에요.</CapySays>
          </aside>
        </div>
        <div className={s.applySpace} />
      </div>

      <div className={s.applyBar}>
        <span>
          <strong>{priceLabel(A.price)}</strong>
          <small>4자리 남음</small>
        </span>
        <a href="#" className={s.btn}>
          중간 합류 신청
        </a>
      </div>
    </>
  );
}

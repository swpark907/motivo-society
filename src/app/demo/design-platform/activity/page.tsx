import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/Avatar/Avatar";
import { CoverCard } from "../_card";
import { Icon } from "../_icons";
import { ACTIVITIES, priceLabel } from "../_mock";
import d from "./activity.module.scss";
import s from "../design.module.scss";

// 시안: DM 링크로 바로 들어오는 첫 화면. 4주 시즌(유료·진행 중·중도 합류)을 예로 든다.
const SESSIONS = [
  { no: 1, title: "기획 — 무엇을 왜 만들지", when: "10.29 (수) 오후 7:30", state: "끝남" },
  { no: 2, title: "첫 화면 — 한 장으로 보여 주기", when: "오늘 · 오후 7:30", state: "오늘" },
  { no: 3, title: "기능 붙이기 — 필요한 것만", when: "11.12 (수) 오후 7:30", state: "" },
  { no: 4, title: "배포와 발표 — 주소로 보여 주기", when: "11.19 (수) 오후 7:30", state: "" },
];

export default function ActivityDraft() {
  const a = ACTIVITIES[1];
  const others = ACTIVITIES.filter((x) => x.slug !== a.slug).slice(0, 3);
  const left = (a.capacity ?? 0) - a.joined;
  return (
    <>
      <article className={d.layout}>
        <div className={d.main}>
          <div className={d.hero}>
            <Image src={a.cover} alt="" fill priority sizes="(min-width: 1024px) 720px, 100vw" />
          </div>

          <header className={d.head}>
            <div className={d.tags}>
              <span className={s.kindTag} data-kind="series">
                시즌 · 4회
              </span>
              <span className={d.state}>진행 중 · 중간에 합류할 수 있어요</span>
            </div>
            <h1 className={s.h1}>{a.title}</h1>
            <ul className={d.facts}>
              <li>
                <Icon name="calendar" />
                <span>
                  <strong>매주 수요일 오후 7:30</strong>
                  <small>10.29 – 11.19 · 4회 · 회당 2시간</small>
                </span>
              </li>
              <li>
                <Icon name="video" />
                <span>
                  <strong>온라인</strong>
                  <small>화상 링크는 참가가 확정되면 시작 30분 전에 열려요</small>
                </span>
              </li>
              <li>
                <Icon name="users" />
                <span>
                  <strong>
                    {a.joined}명 참여 중 · {left}자리 남음
                  </strong>
                  <small>정원 {a.capacity}명</small>
                </span>
              </li>
            </ul>
          </header>

          <section className={d.block} aria-labelledby="about-h">
            <h2 id="about-h">이런 시즌이에요</h2>
            <p>
              한 주에 한 번 모여 <strong>내 서비스 하나를 4주 안에 끝까지</strong> 만들어요. 매
              회차에 각자 만든 것을 화면으로 보여 주고, 막힌 곳은 같이 들여다봐요. 코딩을 처음 해
              봐도 괜찮아요. AI에게 요청하고 결과를 확인하는 흐름을 함께 익혀요.
            </p>
            <ul className={d.bullets}>
              <li>
                <Icon name="check" />
                노트북과 쓰고 있는 AI 도구 계정 하나
              </li>
              <li>
                <Icon name="check" />
                만들고 싶은 것 한 줄(정해지지 않았어도 1회차에서 같이 정해요)
              </li>
            </ul>
          </section>

          <section className={d.block} aria-labelledby="sessions-h">
            <h2 id="sessions-h">회차</h2>
            <ol className={d.sessions}>
              {SESSIONS.map((x) => (
                <li key={x.no} data-state={x.state}>
                  <span className={d.sessionNo}>{x.no}</span>
                  <span className={d.sessionBody}>
                    <strong>{x.title}</strong>
                    <small>{x.when}</small>
                  </span>
                  {x.state && <span className={d.sessionState}>{x.state}</span>}
                </li>
              ))}
            </ol>
          </section>

          <section className={d.block} aria-labelledby="host-h">
            <h2 id="host-h">여는 사람</h2>
            <div className={d.hostCard}>
              <Avatar name="바라호스트" size={56} />
              <div>
                <strong>바라호스트</strong>
                <p className={s.muted}>
                  AI로 작은 서비스를 만들어 운영해 본 호스트예요. 지금까지 시즌 2번, 모임 11번을
                  열었어요.
                </p>
              </div>
              <Link href="#" className={s.ghost}>
                프로필
              </Link>
            </div>
          </section>

          <section className={d.block} aria-labelledby="people-h">
            <h2 id="people-h">함께하는 사람</h2>
            <div className={d.peopleRow}>
              {["참가자1", "참가자2"].map((p) => (
                <span key={p} className={d.person}>
                  <Avatar name={p} size={44} />
                  <small>{p}</small>
                </span>
              ))}
              <span className={d.person} data-empty>
                <span className={d.emptySeat} aria-hidden="true">
                  +
                </span>
                <small>빈자리 {left}</small>
              </span>
            </div>
          </section>

          <section className={d.block} aria-labelledby="policy-h">
            <h2 id="policy-h">신청 전에 알아 두세요</h2>
            <dl className={d.policy}>
              <div>
                <dt>결제</dt>
                <dd>
                  신청하면 자리가 잡히고, 24시간 안에 계좌로 입금하면 운영진이 확인한 뒤 확정돼요.
                </dd>
              </div>
              <div>
                <dt>환불</dt>
                <dd>
                  시작 7일 전까지 전액, 3일 전까지 50%, 그 뒤에는 환불되지 않아요. (시안 예시 값)
                </dd>
              </div>
              <div>
                <dt>중간 합류</dt>
                <dd>이미 지난 회차는 기록만 볼 수 있어요. 금액은 시즌 단위로 같아요.</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* 넓은 화면: 오른쪽에 붙는 신청 카드 · 좁은 화면: 아래 고정 바 */}
        <aside className={d.side} aria-label="신청">
          <div className={d.applyCard}>
            <p className={d.applyPrice}>
              {priceLabel(a.price)}
              <small> · 시즌 4회</small>
            </p>
            <div className={d.meter} aria-label={`정원 ${a.capacity}명 중 ${a.joined}명 참여`}>
              <span style={{ width: `${(a.joined / (a.capacity ?? 1)) * 100}%` }} />
            </div>
            <p className={d.applyNote}>
              <strong>{left}자리 남았어요.</strong> 다음 회차는 오늘 오후 7:30이에요.
            </p>
            <button type="button" className={`${s.cta} ${d.applyCta}`}>
              시즌 신청하기
            </button>
            <p className={d.applyFine}>입금 확인 후 확정 · 시작 7일 전까지 전액 환불</p>
            <div className={d.applyActions}>
              <button type="button" className={s.ghost}>
                <Icon name="share" size={16} />
                공유
              </button>
            </div>
          </div>
        </aside>
      </article>

      <section aria-labelledby="more-h">
        <div className={s.sectionHead}>
          <div>
            <h2 id="more-h">이런 활동도 있어요</h2>
            <p>같은 호스트와 비슷한 관심사</p>
          </div>
          <Link href="/demo/design-platform/explore">발견으로</Link>
        </div>
        <ul className={s.grid}>
          {others.map((x) => (
            <li key={x.slug}>
              <CoverCard a={x} />
            </li>
          ))}
        </ul>
      </section>

      <div className={d.mobileBar}>
        <span>
          <strong>{priceLabel(a.price)}</strong>
          <small>{left}자리 남음</small>
        </span>
        <button type="button" className={s.cta}>
          시즌 신청하기
        </button>
      </div>
    </>
  );
}

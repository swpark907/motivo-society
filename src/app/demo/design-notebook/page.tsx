import Image from "next/image";
import Link from "next/link";
import { ACTIVITIES } from "../design-platform/_mock";
import { CapySays, Face, NoteCard, SecHead } from "./_parts";
import s from "./notebook.module.scss";

const NEXT = ACTIVITIES.find((a) => a.slug === "capybara-cafe")!;
const OPEN = ACTIVITIES.filter((a) =>
  ["vibe-season-4w", "ai-tools-workshop", "prompt-clinic", "members-retro"].includes(a.slug),
);

// 14일 챌린지 중 오늘이 5일차, 4일 인증한 상태(예시)
const DAYS = Array.from({ length: 14 }, (_, i) => i + 1);
const DONE = new Set([1, 2, 3, 4]);
const TODAY = 5;

/** 회원 홈 시안: 검은 머리 띠 → 오늘의 티켓 → 챌린지 도장판 → 내 사람들 → 새로 열린 것. */
export default function NotebookHome() {
  return (
    <>
      <header className={s.band}>
        <span className={s.ghost} aria-hidden="true">
          BUILD
        </span>
        <div className={`${s.wrap} ${s.bandInner}`}>
          <div className={s.bandContent}>
            <p className={s.bandMeta}>
              <span className={s.bandBrand}>모티보 쏘싸이어티</span>
              <span>11.13 FRI</span>
            </p>
            <h1 className={s.bandTitle}>
              좋은 아침이에요, 멤버하나님.
              <br />
              오늘 할 일이 <em>2개</em> 있어요.
            </h1>
          </div>
        </div>
      </header>

      <div className={s.wrap}>
        <section className={s.section}>
          <SecHead
            no="01"
            eyebrow="Today"
            title="오늘의 티켓"
            more={
              <Link href="/me/schedule" className={s.more}>
                내 일정 전체
              </Link>
            }
          />
          <article className={s.ticket}>
            <span className={s.ticketPhoto}>
              <Image src={NEXT.cover} alt="" fill sizes="(min-width: 768px) 280px, 100vw" />
            </span>
            <div className={s.ticketMain}>
              <p className={s.eyebrow}>Meet-up · 모임</p>
              <h3 className={s.ticketTitle}>{NEXT.title}</h3>
              <div className={s.ticketRows}>
                <span>오늘 · 오후 7:30 – 9:30</span>
                <span>망원동 카페 · 상세 주소는 참가 정보에 있어요</span>
              </div>
            </div>
            <div className={s.ticketStub}>
              <div>
                <p className={s.stubLabel}>ADMIT ONE · 확정</p>
                <p className={s.stubBig}>
                  19<em>:</em>30
                </p>
              </div>
              <Link href="/demo/design-notebook/activity" className={s.btn}>
                참가 정보
              </Link>
            </div>
          </article>
        </section>

        <section className={s.section}>
          <SecHead no="02" eyebrow="Challenge" title="오늘 인증이 아직이에요" />
          <div className={s.stampCard}>
            <div className={s.stampHead}>
              <p className={s.stampTitle}>2주 매일 하나씩 만들기 · 5일차</p>
              <p className={s.stampSub}>4번 찍었어요. 완주까지 10칸 남았어요.</p>
            </div>
            <Link href="/demo/design-notebook/activity" className={`${s.btn} ${s.btnInk}`}>
              오늘 인증하기
            </Link>
            <ol className={s.stamps} aria-label="인증 도장판">
              {DAYS.map((d) => (
                <li
                  key={d}
                  className={`${s.dayBox} ${DONE.has(d) ? s.dayDone : ""} ${d === TODAY ? s.dayToday : ""}`}
                  aria-label={`${d}일차${DONE.has(d) ? " 인증함" : d === TODAY ? " 오늘" : ""}`}
                >
                  {DONE.has(d) ? "✓" : d}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={s.section}>
          <SecHead no="03" eyebrow="My people" title="내 사람들" />
          <div className={s.notes}>
            <div className={`${s.note} ${s.noteClub}`}>
              <p className={s.eyebrow}>Club</p>
              <p className={s.noteText}>주말 바이브코딩 클럽</p>
              <span className={s.who}>
                <span className={s.faces}>
                  <Face name="클럽장" />
                  <Face name="운영진" />
                  <Face name="참가자" />
                </span>
                6명 · 모집 중 3개
              </span>
            </div>
            <div className={s.note}>
              <span className={s.who}>
                <Face name="참가자1" />
                <strong>참가자1</strong> · 2주 매일 하나씩 · 어제
              </span>
              <p className={s.noteText}>4일차, 로그인 화면까지 붙였어요.</p>
            </div>
            <div className={s.note}>
              <span className={s.who}>
                <Face name="참가자2" />
                <strong>참가자2</strong> · 2주 매일 하나씩 · 11.6
              </span>
              <p className={s.noteText}>첫날 기록. 일단 버튼 하나부터.</p>
            </div>
          </div>
        </section>

        <section className={s.section}>
          <SecHead
            no="04"
            eyebrow="Just opened"
            title="새로 열린 것"
            more={
              <Link href="/demo/design-notebook/explore" className={s.more}>
                둘러보기로
              </Link>
            }
          />
          <div className={s.cardsRail}>
            {OPEN.map((a) => (
              <NoteCard key={a.slug} a={a} />
            ))}
          </div>
          <CapySays>오늘 인증까지 하면 다섯 칸째예요. 버튼 하나만 붙여도 하루치예요.</CapySays>
        </section>
      </div>
    </>
  );
}

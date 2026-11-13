import Image from "next/image";
import Link from "next/link";
import { ACTIVITIES } from "../design-platform/_mock";
import { PosterCard, SecHead } from "./_parts";
import s from "./poster.module.scss";

const BASE = "/demo/design-poster";
const NEXT = ACTIVITIES.find((a) => a.slug === "capybara-cafe")!;
const OPEN = ACTIVITIES.filter((a) =>
  ["vibe-season-4w", "ai-tools-workshop", "prompt-clinic", "members-retro"].includes(a.slug),
);
const DAYS = Array.from({ length: 14 }, (_, i) => i + 1);

/** 회원 홈 시안: 거대한 날짜 → 오늘 밤(오렌지 순간) → 챌린지 숫자 → 사람들의 한마디 → 새로 열린 포스터. */
export default function PosterHome() {
  return (
    <div className={s.wrap}>
      <header className={s.head}>
        <p className={s.label}>Friday · 11.13 · 멤버하나</p>
        <h1 className={`${s.display} ${s.headHuge}`}>
          FRI 13
          <br />할 일 2개
        </h1>
        <p className={s.headSub}>오늘 저녁 모임 하나, 챌린지 인증 하나가 남아 있어요.</p>
      </header>

      <section className={s.section}>
        <SecHead
          label="Tonight"
          title="오늘 밤"
          more={
            <Link href="/me/schedule" className={s.more}>
              내 일정
            </Link>
          }
        />
        <article className={s.tonight}>
          <span className={`${s.photo} ${s.tonightPhoto}`}>
            <Image src={NEXT.cover} alt="" fill sizes="(min-width: 768px) 600px, 100vw" />
          </span>
          <div className={s.tonightBody}>
            <p className={`${s.display} ${s.tonightTime}`}>19:30</p>
            <div>
              <p className={s.label}>모임 · 확정</p>
              <h3 className={s.tonightTitle}>{NEXT.title}</h3>
              <div className={s.tonightRows}>
                <span>오후 7:30 – 9:30 · 망원동 카페</span>
                <span>상세 주소는 참가 정보에 있어요</span>
              </div>
            </div>
            <Link href={`${BASE}/activity`} className={s.btn}>
              참가 정보 보기
            </Link>
          </div>
        </article>
      </section>

      <section className={s.section}>
        <SecHead label="Challenge" title="2주 매일 하나씩" />
        <div className={s.streak}>
          <p className={`${s.display} ${s.streakNum}`}>
            04<small>/14</small>
          </p>
          <div>
            <ol className={s.streakBar} aria-label="인증한 날">
              {DAYS.map((d) => (
                <li
                  key={d}
                  className={d <= 4 ? s.on : d === 5 ? s.now : undefined}
                  aria-label={`${d}일차${d <= 4 ? " 인증함" : d === 5 ? " 오늘" : ""}`}
                />
              ))}
            </ol>
            <div className={s.streakText}>
              <strong>5일차 · 오늘 인증이 아직이에요</strong>
              <span>완주까지 10번 남았어요.</span>
            </div>
          </div>
          <Link href={`${BASE}/activity`} className={`${s.btn} ${s.btnLine}`}>
            오늘 인증하기
          </Link>
        </div>
      </section>

      <section className={s.section}>
        <SecHead label="My people" title="내 사람들" />
        <div className={s.voices}>
          <div className={s.voice}>
            <p className={s.quote}>“4일차, 로그인 화면까지 붙였어요.”</p>
            <p className={s.by}>
              <strong>참가자1</strong> · 2주 매일 하나씩 · 어제
            </p>
          </div>
          <div className={s.voice}>
            <p className={s.quote}>“첫날 기록. 일단 버튼 하나부터.”</p>
            <p className={s.by}>
              <strong>참가자2</strong> · 2주 매일 하나씩 · 11.6
            </p>
          </div>
          <div className={s.voice}>
            <p className={s.quote}>주말 바이브코딩 클럽</p>
            <p className={s.by}>
              <strong>내 클럽</strong> · 6명 · 모집 중 3개
            </p>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <SecHead
          label="Just opened"
          title="새로 열린 것"
          more={
            <Link href={`${BASE}/explore`} className={s.more}>
              둘러보기
            </Link>
          }
        />
        <div className={`${s.posters} ${s.rail}`}>
          {OPEN.map((a) => (
            <PosterCard key={a.slug} a={a} base={BASE} />
          ))}
        </div>
      </section>
    </div>
  );
}

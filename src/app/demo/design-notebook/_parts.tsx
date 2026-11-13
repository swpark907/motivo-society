import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { KIND_LABEL, priceLabel, seatsLabel, type MockActivity } from "../design-platform/_mock";
import s from "./notebook.module.scss";

/** 섹션 머리: 오렌지 영문 아이브로 + "01—" 번호가 붙은 한글 제목. */
export function SecHead({
  no,
  eyebrow,
  title,
  more,
}: {
  no?: string;
  eyebrow: string;
  title: string;
  more?: ReactNode;
}) {
  return (
    <div className={s.secHead}>
      <div>
        <p className={s.eyebrow}>{eyebrow}</p>
        <h2 className={s.secTitle}>
          {no && <span className={s.secNo}>{no}—</span>}
          {title}
        </h2>
      </div>
      {more}
    </div>
  );
}

/** 카피바라 컷아웃 + 말풍선. 화면마다 한 번, 감정이 생기는 자리에만 쓴다. */
export function CapySays({ children }: { children: ReactNode }) {
  return (
    <div className={s.capy}>
      <Image
        src="/images/workbook/lesson-1-1/capy-turn.png"
        alt=""
        width={236}
        height={435}
        className={s.capyImg}
      />
      <p className={s.bubble}>{children}</p>
    </div>
  );
}

export function Face({ name, large }: { name: string; large?: boolean }) {
  return (
    <span className={`${s.face} ${large ? s.faceLg : ""}`} aria-hidden="true">
      {name.slice(0, 1)}
    </span>
  );
}

/** 예시 날짜 문자열에서 카드 머리용 큰 날짜만 뽑는다(시안 전용). */
function bigDate(a: MockActivity): { big: string; small: string } {
  const m = a.when.match(/(\d{1,2}\.\d{1,2})\s*\((.)\)/);
  if (m) return { big: m[1], small: m[2] };
  if (a.when.startsWith("오늘")) return { big: "TODAY", small: "" };
  return { big: a.day, small: "" };
}

/** 활동 카드: 카드뉴스처럼 위아래 오렌지 띠, 검은 선. 마우스를 올리면 떠오른다. */
export function NoteCard({ a }: { a: MockActivity }) {
  const d = bigDate(a);
  const seats = seatsLabel(a);
  return (
    <Link href="/demo/design-notebook/activity" className={s.card}>
      <span className={s.cover}>
        <Image src={a.cover} alt="" fill sizes="(min-width: 768px) 280px, 75vw" />
        <span className={s.stamp}>{KIND_LABEL[a.kind]}</span>
        {a.live && <span className={`${s.stamp} ${s.stampLive}`}>진행 중 · 합류 가능</span>}
      </span>
      <span className={s.cardBody}>
        <span className={s.cardDate}>
          {d.big}
          {d.small && <small>{d.small}</small>}
        </span>
        <span className={s.cardTitle}>{a.title}</span>
        <span className={s.cardMeta}>
          {a.online ? "온라인" : a.place} · {a.host}
        </span>
        <span className={s.cardFoot}>
          <span className={seats.includes("남음") ? s.seatsLow : undefined}>{seats}</span>
          <strong>{priceLabel(a.price)}</strong>
        </span>
      </span>
    </Link>
  );
}

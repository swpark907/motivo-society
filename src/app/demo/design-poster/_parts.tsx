import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { KIND_LABEL, priceLabel, seatsLabel, type MockActivity } from "../design-platform/_mock";
import s from "./poster.module.scss";

export function SecHead({
  label,
  title,
  more,
}: {
  label: string;
  title: string;
  more?: ReactNode;
}) {
  return (
    <div className={s.secHead}>
      <div>
        <p className={s.label}>{label}</p>
        <h2 className={s.secTitle}>{title}</h2>
      </div>
      {more}
    </div>
  );
}

/** 예시 날짜 문자열에서 포스터용 큰 날짜만 뽑는다(시안 전용). */
export function bigDate(a: MockActivity): { big: string; day: string } {
  const m = a.when.match(/(\d{1,2}\.\d{1,2})\s*\((.)\)/);
  if (m) return { big: m[1], day: `${m[2]}요일` };
  if (a.when.startsWith("오늘")) return { big: "TONIGHT", day: "오늘" };
  return { big: a.day, day: "" };
}

/** 포스터 카드: 흑백 4:5 사진 위에 큰 날짜. 고르면 원래 색으로 돌아온다. */
export function PosterCard({ a, base }: { a: MockActivity; base: string }) {
  const d = bigDate(a);
  const seats = seatsLabel(a);
  return (
    <Link href={`${base}/activity`} className={s.poster}>
      <span className={`${s.photo} ${s.posterPhoto}`}>
        <Image src={a.cover} alt="" fill sizes="(min-width: 768px) 290px, 50vw" />
        <span className={s.posterKind}>{KIND_LABEL[a.kind]}</span>
        {a.live && <span className={`${s.posterKind} ${s.posterLive}`}>합류 가능</span>}
        <span className={`${s.display} ${s.posterDate}`}>{d.big}</span>
      </span>
      <span className={s.posterTitle}>{a.title}</span>
      <span className={s.posterMeta}>
        <span className={seats.includes("남음") ? s.low : undefined}>
          {a.online ? "온라인" : (a.place.split(" · ")[1] ?? a.place)} · {seats}
        </span>
        <strong>{priceLabel(a.price)}</strong>
      </span>
    </Link>
  );
}

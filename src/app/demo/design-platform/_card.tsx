import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/Avatar/Avatar";
import { Icon } from "./_icons";
import { KIND_LABEL, priceLabel, seatsLabel, type MockActivity } from "./_mock";
import s from "./design.module.scss";

/** 시안: 표지 사진 + 날짜 + 사람이 먼저 보이는 활동 카드. */
export function CoverCard({ a }: { a: MockActivity }) {
  const seats = seatsLabel(a);
  const urgent = /남음|마감/.test(seats);
  return (
    <Link href="/demo/design-platform/activity" className={s.card}>
      <div className={s.cover}>
        <Image src={a.cover} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" />
        <div className={s.coverTop}>
          <span className={s.kindTag} data-kind={a.kind}>
            {KIND_LABEL[a.kind]}
          </span>
          <span className={a.live ? s.liveBadge : s.dayBadge}>
            {a.live ? `진행 중 · ${a.day}` : a.day}
          </span>
        </div>
      </div>
      <div className={s.cardBody}>
        <p className={s.cardWhen}>{a.when}</p>
        <h3 className={s.cardTitle}>{a.title}</h3>
        <div className={s.cardMeta}>
          <span>
            <Icon name={a.online ? "video" : "pin"} size={14} />
            {a.place}
          </span>
          <span>{a.host}</span>
        </div>
        <div className={s.cardFoot}>
          <span className={s.people}>
            {a.people.length > 0 && (
              <span className={s.faces}>
                {a.people.slice(0, 3).map((p) => (
                  <Avatar key={p} name={p} size={24} />
                ))}
              </span>
            )}
            <span className={urgent ? s.urgent : undefined}>{seats}</span>
          </span>
          <span className={s.price}>{priceLabel(a.price)}</span>
        </div>
      </div>
    </Link>
  );
}

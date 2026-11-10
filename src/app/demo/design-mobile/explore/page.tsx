"use client";
// 클라이언트인 이유: 종류 고르기와 필터 시트를 화면 안에서 바로 바꿔 보여 주는 시안이다(실제 화면은 URL 쿼리).

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ACTIVITIES,
  KIND_LABEL,
  priceLabel,
  seatsLabel,
  type Kind,
  type MockActivity,
} from "../../design-platform/_mock";
import { Ic, MockTabBar, RootBar } from "../_shell";
import { Sheet } from "../_sheet";
import s from "../mobile.module.scss";

const KINDS: (Kind | "all")[] = ["all", "gathering", "series", "challenge"];

function DayHeader({ children }: { children: string }) {
  return <h3 className={s.dayHeader}>{children}</h3>;
}

/** 목록 행 카드: 왼쪽 정사각 표지 · 오른쪽 언제/제목/장소·주최 · 아래 자리와 가격. */
function ListCard({ a }: { a: MockActivity }) {
  return (
    <Link href="/demo/design-mobile/activity" className={s.listCard}>
      <span className={s.thumb}>
        <Image src={a.cover} alt="" fill sizes="88px" />
      </span>
      <span className={s.listBody}>
        <span className={s.listWhen}>{a.when}</span>
        <span className={s.listTitle}>{a.title}</span>
        <span className={s.listMeta}>
          <span className={s.kindDot} data-kind={a.kind}>
            {KIND_LABEL[a.kind]}
          </span>
          {a.online ? "온라인" : a.place} · {a.host}
        </span>
        <span className={s.listFoot}>
          <span>{seatsLabel(a)}</span>
          <strong>{priceLabel(a.price)}</strong>
        </span>
      </span>
    </Link>
  );
}

export default function ExploreDraft() {
  const [kind, setKind] = useState<Kind | "all">("all");
  const [sheet, setSheet] = useState(false);
  const shown = ACTIVITIES.filter((a) => kind === "all" || a.kind === kind);
  const week = shown.filter((a) => !a.live).slice(0, 4);
  const live = shown.filter((a) => a.live);
  const rest = shown.filter((a) => !week.includes(a) && !live.includes(a));

  return (
    <div className={s.app}>
      <RootBar
        title="둘러보기"
        action={
          <button
            type="button"
            className={s.iconBtn}
            aria-label="필터"
            onClick={() => setSheet(true)}
          >
            <Ic name="filter" />
          </button>
        }
      />

      {/* 종류는 위에 붙는 한 줄 세그먼트, 나머지 조건은 필터 시트로 */}
      <div className={s.segmentBar}>
        <div className={s.segment} role="tablist" aria-label="종류">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
            >
              {k === "all" ? "전체" : KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <div className={s.scroll}>
        {week.length > 0 && (
          <section className={s.block}>
            <div className={s.blockHead}>
              <h2>이번 주</h2>
              <span className={s.blockMore}>모두 보기</span>
            </div>
            <div className={s.hScroll}>
              {week.map((a) => (
                <Link key={a.slug} href="/demo/design-mobile/activity" className={s.bigCard}>
                  <span className={s.bigCover}>
                    <Image src={a.cover} alt="" fill sizes="280px" />
                    <span className={s.dayBadge}>{a.day}</span>
                  </span>
                  <span className={s.bigTitle}>{a.title}</span>
                  <span className={s.listMeta}>
                    <span className={s.kindDot} data-kind={a.kind}>
                      {KIND_LABEL[a.kind]}
                    </span>
                    {a.when}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {live.length > 0 && (
          <section className={s.block}>
            <div className={s.blockHead}>
              <h2>지금 합류할 수 있어요</h2>
            </div>
            <div className={s.list}>
              {live.map((a) => (
                <ListCard key={a.slug} a={a} />
              ))}
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section className={s.block}>
            <div className={s.blockHead}>
              <h2>그 밖의 활동</h2>
            </div>
            <div className={s.list}>
              <DayHeader>다음 주</DayHeader>
              {rest.map((a) => (
                <ListCard key={a.slug} a={a} />
              ))}
            </div>
          </section>
        )}
      </div>

      <MockTabBar current="둘러보기" />

      <Sheet open={sheet} onClose={() => setSheet(false)} title="필터">
        <div className={s.sheetSection}>
          <h3>형식</h3>
          <div className={s.chipRow}>
            <span className={s.chip}>온라인</span>
            <span className={s.chip}>오프라인</span>
          </div>
        </div>
        <div className={s.sheetSection}>
          <h3>언제</h3>
          <div className={s.chipRow}>
            <span className={s.chip}>이번 주</span>
            <span className={s.chip}>다음 주</span>
          </div>
        </div>
        <div className={s.sheetSection}>
          <h3>가격</h3>
          <div className={s.chipRow}>
            <span className={s.chip}>무료만</span>
          </div>
        </div>
        <div className={s.sheetActions}>
          <button type="button" className={s.ghostBtn} onClick={() => setSheet(false)}>
            초기화
          </button>
          <button type="button" className={s.blackBtn} onClick={() => setSheet(false)}>
            {shown.length}개 보기
          </button>
        </div>
      </Sheet>
    </div>
  );
}

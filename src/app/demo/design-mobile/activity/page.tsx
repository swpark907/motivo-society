"use client";
// 클라이언트인 이유: 신청 확인을 화면 이동 대신 아래 시트로 여닫고, 시트 안 단계(확인 → 입금 안내)를 바꿔 보여 준다.

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ACTIVITIES, priceLabel } from "../../design-platform/_mock";
import { Face, Group, Ic, Row } from "../_shell";
import { Sheet } from "../_sheet";
import s from "../mobile.module.scss";

const A = ACTIVITIES.find((a) => a.slug === "vibe-season-4w")!;

const SESSIONS = [
  { no: 1, title: "기획", when: "11.3 (화) · 오후 7:30", done: true },
  { no: 2, title: "첫 화면", when: "오늘 · 오후 7:30", today: true },
  { no: 3, title: "기능 붙이기", when: "11.17 (화) · 오후 7:30" },
  { no: 4, title: "배포와 발표", when: "11.24 (화) · 오후 7:30" },
];

export default function ActivityDraft() {
  const [sheet, setSheet] = useState(false);
  const [step, setStep] = useState<"confirm" | "pay">("confirm");
  const [agree, setAgree] = useState(false);

  return (
    <div className={s.app}>
      <div className={s.scroll} data-under-bar>
        {/* 표지는 화면 끝까지. 위에 원형 버튼 두 개만 얹는다(그림자 · 유리 효과 없이 검정 면). */}
        <div className={s.hero}>
          <Image src={A.cover} alt="" fill sizes="390px" priority />
          <Link href="/demo/design-mobile/explore" className={s.heroBtn} aria-label="뒤로">
            <Ic name="back" />
          </Link>
          <button type="button" className={`${s.heroBtn} ${s.heroBtnEnd}`} aria-label="공유">
            <Ic name="share" />
          </button>
        </div>

        <div className={s.detailHead}>
          <p className={s.detailTags}>
            <span className={s.kindDot} data-kind={A.kind}>
              시즌 · 4회
            </span>
            진행 중 · 중간에 합류할 수 있어요
          </p>
          <h1 className={s.detailTitle}>{A.title}</h1>
          <Link href="/demo/design-mobile/explore" className={s.hostLine}>
            <Face name={A.host} kind="series" />
            <span>
              <strong>{A.host}</strong>
              <small>개인 호스트 · 지난 활동 3번</small>
            </span>
            <Ic name="chev" size={16} />
          </Link>
        </div>

        <Group>
          <Row
            icon="calendar"
            main="다음 회차 오늘 · 오후 7:30"
            sub="11.3 – 11.24 · 매주 화 · 4회"
          />
          <Row icon="video" main="온라인 화상" sub="링크는 참가가 확정되면 30분 전에 열려요" />
          <Row
            icon="users"
            main="2명 참여 중 · 4자리 남음"
            sub="입금이 확인되면 확정돼요"
            end={
              <span className={s.faces}>
                <Face name="참가자1" kind="gathering" />
                <Face name="참가자2" kind="challenge" />
              </span>
            }
          />
        </Group>

        <Group title="이런 시즌이에요">
          <p className={s.groupText}>
            한 주에 한 번, 4주 동안 내 서비스 하나를 끝까지 만들어요. 매 회차 만든 것을 서로 보여
            주고, 다음 주에 할 일을 한 줄로 남겨요.
          </p>
        </Group>

        <Group title="회차">
          {SESSIONS.map((x) => (
            <Row
              key={x.no}
              main={
                <>
                  <span className={s.sessionNo} data-done={x.done || undefined}>
                    {x.no}
                  </span>
                  {x.title}
                </>
              }
              sub={x.when}
              end={x.done ? "끝남" : x.today ? <span className={s.todayBadge}>오늘</span> : ""}
            />
          ))}
        </Group>

        <Group title="신청 전에 알아 두세요">
          <Row
            icon="won"
            main="40,000원 · 시즌 전체"
            sub="안내된 기한 안에 계좌로 입금하면 확정돼요"
          />
          <Row main="환불" sub="시작 7일 전까지 전액 · 3일 전까지 50%" href="#" />
          <Row main="중간 합류" sub="지난 회차는 함께하지 못해요" />
        </Group>
        <div className={s.barSpacer} />
      </div>

      {/* 하단 고정 행동 바: 가격과 주 행동 하나. 누르면 시트가 열린다. */}
      <div className={s.actionBar}>
        <span className={s.actionPrice}>
          <strong>{priceLabel(A.price)}</strong>
          <small>4자리 남음</small>
        </span>
        <button
          type="button"
          className={s.cta}
          onClick={() => {
            setStep("confirm");
            setAgree(false);
            setSheet(true);
          }}
        >
          중간 합류 신청
        </button>
      </div>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title={step === "confirm" ? "이렇게 신청할게요" : "입금하면 확정돼요"}
      >
        {step === "confirm" ? (
          <>
            <div className={s.sheetSummary}>
              <span className={s.sheetThumb}>
                <Image src={A.cover} alt="" fill sizes="56px" />
              </span>
              <span>
                <strong>{A.title}</strong>
                <small>2회차부터 · 오늘 오후 7:30</small>
              </span>
            </div>
            <div className={s.sheetRows}>
              <Row main="참가비" end={<strong>40,000원</strong>} />
              <Row main="입금자명" end="처음온사람" />
              <Row main="취소" sub="입금 전에는 언제든 취소할 수 있어요" />
            </div>
            <label className={s.agree}>
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              취소 · 환불 규정을 확인했어요
            </label>
            <button
              type="button"
              className={s.ctaWide}
              disabled={!agree}
              onClick={() => setStep("pay")}
            >
              40,000원 · 중간 합류 신청
            </button>
          </>
        ) : (
          <>
            <p className={s.sheetLead}>아래 계좌로 입금하면 운영진이 확인한 뒤 참가가 확정돼요.</p>
            <div className={s.sheetRows}>
              <Row main="입금할 금액" end={<strong>40,000원</strong>} />
              <Row
                main="계좌"
                sub="(예시) 모쏘은행 000-0000-0000"
                end={
                  <span className={s.copyBtn}>
                    <Ic name="copy" size={16} /> 복사
                  </span>
                }
              />
              <Row main="기한" sub="11.11 (수) · 오후 4:16까지" end="24시간 남음" />
            </div>
            <button type="button" className={s.blackWide} onClick={() => setSheet(false)}>
              확인했어요
            </button>
          </>
        )}
      </Sheet>
    </div>
  );
}

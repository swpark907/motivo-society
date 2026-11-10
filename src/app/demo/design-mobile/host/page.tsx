"use client";
// 클라이언트인 이유: 한 장에 쌓여 있던 관리 화면을 위 탭(개요 · 명단 · 공지 · 장부)으로 나눠 바꿔 보여 준다.

import { useState } from "react";
import { Face, Group, Ic, Row, SubBar } from "../_shell";
import s from "../mobile.module.scss";

const TABS = ["개요", "명단", "공지", "장부"] as const;
type Tab = (typeof TABS)[number];

const PEOPLE = [
  { name: "참가자1", status: "확정", pay: "결제 완료", att: "1/2회" },
  { name: "참가자2", status: "확정", pay: "결제 완료", att: "0/2회" },
  { name: "김여정", status: "입금 대기", pay: "기한 23시간", att: "—" },
];

export default function HostDraft() {
  const [tab, setTab] = useState<Tab>("개요");

  return (
    <div className={s.app}>
      <SubBar
        title="4주 바이브코딩 시즌"
        backHref="/demo/design-mobile/explore"
        action={
          <span className={s.iconBtn} aria-label="참가자 화면 보기" role="img">
            <Ic name="eye" />
          </span>
        }
      />
      <div className={s.topTabs} role="tablist" aria-label="관리">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            {t}
            {t === "명단" && <span className={s.tabCount}>3</span>}
          </button>
        ))}
      </div>

      <div className={s.scroll} key={tab}>
        {tab === "개요" && (
          <>
            <div className={s.statusStrip}>
              <span className={s.kindDot} data-kind="series">
                시즌
              </span>
              진행 중 · 2회차 오늘 오후 7:30
            </div>
            <div className={s.tiles}>
              <div className={s.tile}>
                <small>확정</small>
                <strong>2/6</strong>
              </div>
              <div className={s.tile} data-alert>
                <small>입금 대기</small>
                <strong>1</strong>
              </div>
              <div className={s.tile}>
                <small>받은 돈</small>
                <strong>80,000원</strong>
              </div>
              <div className={s.tile}>
                <small>남은 돈</small>
                <strong>60,000원</strong>
              </div>
            </div>
            <Group title="지금 할 일">
              <Row icon="check" main="2회차 빠른 출석" sub="오늘 오후 7:30 시작" href="#" />
              <Row icon="won" main="입금 대기 1명" sub="운영진이 확인해요" href="#" />
            </Group>
            <Group title="이 활동으로">
              <Row icon="eye" main="참가자 화면 보기" href="#" />
              <Row icon="plus" main="이 활동으로 새로 만들기" href="#" />
              <Row icon="share" main="명단 CSV 받기" href="#" />
            </Group>
          </>
        )}

        {tab === "명단" && (
          <>
            <div className={s.filterChips}>
              <span className={s.chip} data-on>
                전체 3
              </span>
              <span className={s.chip}>확정 2</span>
              <span className={s.chip}>입금 대기 1</span>
            </div>
            <Group>
              {PEOPLE.map((p) => (
                <Row
                  key={p.name}
                  main={
                    <span className={s.personLine}>
                      <Face name={p.name} kind={p.status === "확정" ? "challenge" : "gathering"} />
                      {p.name}
                    </span>
                  }
                  sub={`${p.pay} · 출석 ${p.att}`}
                  end={
                    <span className={s.statusBadge} data-tone={p.status === "확정" ? "ok" : "wait"}>
                      {p.status}
                    </span>
                  }
                />
              ))}
            </Group>
          </>
        )}

        {tab === "공지" && (
          <>
            <Group title="보낸 공지">
              <Row main="2회차 준비물" sub="확정 2명 · 읽음 1 · 11.9" href="#" />
              <Row main="첫 회차 안내" sub="확정 2명 · 읽음 2 · 11.2" href="#" />
            </Group>
            <p className={s.note}>메일 · 알림으로 따로 가지는 않아요. 참가자 활동 화면에 보여요.</p>
          </>
        )}

        {tab === "장부" && (
          <>
            <Group>
              <Row main="참가비 수입" end="+ 80,000원" />
              <Row main="수수료" end="− 8,000원" />
              <Row main="직접 적은 지출" end="− 12,000원" />
              <Row main={<strong>남은 돈</strong>} end={<strong>60,000원</strong>} />
            </Group>
            <Group title="직접 적은 것">
              <Row main="스터디룸 대관" sub="지출 · 11.3 · 영수증 있음" end="− 12,000원" href="#" />
            </Group>
            <p className={s.note}>
              장부는 호스트만 봐요. 참가자 공개는 개요 탭에서 고를 수 있어요.
            </p>
          </>
        )}
        <div className={s.barSpacer} />
      </div>

      {tab === "공지" && (
        <div className={s.actionBar}>
          <span className={s.actionPrice}>
            <strong>새 공지</strong>
            <small>확정 · 대기 · 입금 대기 중 골라서</small>
          </span>
          <button type="button" className={s.blackBtn}>
            공지 쓰기
          </button>
        </div>
      )}
      {tab === "장부" && (
        <div className={s.actionBar}>
          <span className={s.actionPrice}>
            <strong>지출 · 수입</strong>
            <small>영수증 사진은 선택</small>
          </span>
          <button type="button" className={s.blackBtn}>
            장부에 적기
          </button>
        </div>
      )}
    </div>
  );
}

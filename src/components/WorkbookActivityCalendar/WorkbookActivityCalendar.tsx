"use client";

// 날짜 선택과 월 이동만 동작하는 목업. 회원 기록을 읽거나 활동을 수집하지 않는다.
import { useState } from "react";
import Link from "next/link";
import styles from "./WorkbookActivityCalendar.module.scss";

type Activity = { kind: "학습" | "읽기" | "댓글"; title: string; detail: string; href: string };
const examples: Record<string, Activity[]> = {
  "2026-10-16": [
    {
      kind: "학습",
      title: "AI 이해하기",
      detail: "수업 완료 · 14:20",
      href: "/workbook/classes/vibe-web",
    },
    {
      kind: "읽기",
      title: "화면을 보여주고 질문하기",
      detail: "열람 4분 · 15:08",
      href: "/workbook/reading/show-the-screen",
    },
    {
      kind: "댓글",
      title: "화면을 보여주고 질문하기",
      detail: "댓글 작성 · 15:14",
      href: "/workbook/reading/show-the-screen",
    },
  ],
  "2026-10-14": [
    {
      kind: "학습",
      title: "AI 종류와 도구",
      detail: "수업 완료 · 20:30",
      href: "/workbook/classes/vibe-web",
    },
  ],
  "2026-10-12": [
    {
      kind: "읽기",
      title: "화면을 보여주고 질문하기",
      detail: "열람 3분 · 12:40",
      href: "/workbook/reading/show-the-screen",
    },
  ],
  "2026-10-08": [
    {
      kind: "학습",
      title: "AI 이해하기",
      detail: "수업 복습 · 19:10",
      href: "/workbook/classes/vibe-web",
    },
  ],
  "2026-10-05": [
    {
      kind: "읽기",
      title: "화면을 보여주고 질문하기",
      detail: "열람 2분 · 09:20",
      href: "/workbook/reading/show-the-screen",
    },
  ],
  "2026-10-02": [
    {
      kind: "학습",
      title: "AI 이해하기",
      detail: "학습 시작 · 18:00",
      href: "/workbook/classes/vibe-web",
    },
  ],
  "2026-09-29": [
    {
      kind: "읽기",
      title: "화면을 보여주고 질문하기",
      detail: "열람 5분 · 21:00",
      href: "/workbook/reading/show-the-screen",
    },
  ],
};
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const dateKey = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export function WorkbookActivityCalendar() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState("2026-10-16");
  const month = new Date(2026, 9 + monthOffset, 1);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const activities = examples[selected] ?? [];
  const activeDays = Object.keys(examples).filter((key) =>
    key.startsWith(dateKey(year, monthIndex, 1).slice(0, 7)),
  ).length;
  function changeMonth(offset: number) {
    const next = new Date(2026, 9 + offset, 1);
    setMonthOffset(offset);
    setSelected(dateKey(next.getFullYear(), next.getMonth(), 1));
  }
  return (
    <aside id="activity-calendar" className={styles.card} aria-labelledby="activity-calendar-title">
      <header className={styles.header}>
        <span className="label">MY DAYS HERE</span>
        <span className={styles.badge}>목업 · 예시</span>
      </header>
      <h2 id="activity-calendar-title">차곡차곡, 나의 시간</h2>
      <p className={styles.intro}>배우고, 읽고, 이야기를 나눈 날들.</p>
      <div className={styles.month}>
        <h3>
          {year}년 {monthIndex + 1}월
        </h3>
        <div>
          <button
            type="button"
            aria-label="이전 달"
            disabled={monthOffset === -1}
            onClick={() => changeMonth(monthOffset - 1)}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="다음 달"
            disabled={monthOffset === 0}
            onClick={() => changeMonth(monthOffset + 1)}
          >
            →
          </button>
        </div>
      </div>
      <div className={styles.weekdays} aria-hidden="true">
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div
        className={styles.days}
        role="group"
        aria-label={`${year}년 ${monthIndex + 1}월 활동 날짜`}
      >
        {Array.from({ length: month.getDay() }, (_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {Array.from({ length: days }, (_, index) => {
          const day = index + 1;
          const key = dateKey(year, monthIndex, day);
          const count = examples[key]?.length ?? 0;
          return (
            <button
              key={key}
              type="button"
              aria-label={`${monthIndex + 1}월 ${day}일, ${count ? `활동 ${count}건` : "활동 없음"}`}
              aria-pressed={selected === key}
              className={count ? styles.active : undefined}
              onClick={() => setSelected(key)}
            >
              <span>{day}</span>
              <i aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <div className={styles.legend}>
        <span>
          <i /> 활동한 날
        </span>
        <span>이번 달 {activeDays}일 · 예시</span>
      </div>
      <section
        className={styles.detail}
        aria-live="polite"
        aria-atomic="true"
        aria-label="선택한 날의 활동"
      >
        <h3>
          {Number(selected.slice(5, 7))}월 {Number(selected.slice(8))}일{" "}
          <span>{activities.length}개의 활동</span>
        </h3>
        {activities.length ? (
          <ul>
            {activities.map((activity) => (
              <li key={`${activity.kind}-${activity.title}`}>
                <span className={styles.kind}>{activity.kind}</span>
                <Link href={activity.href}>
                  {activity.title}
                  <span aria-hidden="true"> ↗</span>
                  <small>{activity.detail}</small>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>
            이 날에는 예시 활동이 없어요.
            <br />
            점이 있는 날짜를 눌러 기록을 살펴보세요.
          </p>
        )}
      </section>
      <p className={styles.notice}>
        회원 활동을 미리 보는 예시예요. 실제 기록을 수집·저장하지 않아요. 열람 시간은 독해·완독
        판정이 아니에요.
      </p>
    </aside>
  );
}

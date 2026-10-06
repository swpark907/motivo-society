"use client";

// 학습 목차와 수업 선택, 선택형 이야기·지도 체험 상태를 유지한다.
import Image from "next/image";
import Link from "next/link";
import { useContext, useRef, useState } from "react";
import { WorkbookMap } from "./WorkbookMap";
import { WorkbookLessons } from "./WorkbookLessons";
import { WorkbookIntro } from "./WorkbookIntro";
import { WorkbookNavigationContext } from "./WorkbookNavigationContext";
import styles from "./WorkbookClass.module.scss";

const worlds = [
  "기획과 첫 제작",
  "화면과 사용 경험",
  "동작과 데이터",
  "공개와 운영",
  "AI와 일하는 방식 · 선택 심화",
];
export function WorkbookClass() {
  const collapseMenu = useContext(WorkbookNavigationContext);
  const [scene, setScene] = useState(0);
  const [lesson, setLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<number[]>([]);
  const title = useRef<HTMLHeadingElement>(null);
  function go(next: number) {
    if (scene === 0 && next === 2) collapseMenu?.();
    setScene(next);
    requestAnimationFrame(() => title.current?.focus());
  }
  return (
    <main className={styles.page} data-learning={lesson !== null && scene === 2}>
      <nav className={styles.top} aria-label="클래스 경로">
        <Link href="/workbook">← 클래스 목록</Link>
        <span>WORKBOOK / VIBE WEB</span>
      </nav>
      <p className={styles.notice}>
        프로토타입 · 실제 구매 및 회원 권한은 연결되지 않았어요. 체험 선택은 이 화면에 머무는 동안만
        유지돼요.
      </p>
      {scene === 0 ? (
        <>
          <div className={styles.cover}>
            <Image
              src="/images/workbook/vibe-web-cover-v1.png"
              alt="모니터 속 픽셀 마을을 바라보는 카피바라"
              width={1536}
              height={1024}
              priority
            />
            <div>
              <span className="label">MAKE SOMETHING YOURS</span>
              <h1 ref={title} tabIndex={-1}>
                바이브코딩
                <br />
                웹개발 클래스
              </h1>
              <p>
                만들고 싶은 마음을 첫 화면으로.
                <br />
                AI가 처음이어도, 이해부터 제작까지 함께 배워요.
              </p>
              <button onClick={() => go(2)}>프로토타입 체험하기 ↗</button>
              <small>판매 준비 중 · 가격과 이용 기간은 아직 정해지지 않았어요.</small>
            </div>
          </div>
          <section className={styles.section}>
            <h2>작은 결과물까지 이어지는 여행</h2>
            <ol className={styles.worlds}>
              {worlds.map((world, i) => (
                <li key={world}>
                  <span>{i === 4 ? "+1" : `0${i + 1}`}</span>
                  {world}
                </li>
              ))}
            </ol>
            <p>
              기획 한 장, 첫 제작 요청, 직접 확인하고 수정한 경험을 가져가요. 저장·백엔드는 필요한
              기능에 맞춰 알아봅니다.
            </p>
          </section>
        </>
      ) : (
        <>
          <div className={styles.top}>
            <span>AI 입문 · 배우고 만들어보기</span>
            <button className={styles.quiet} onClick={() => go(0)}>
              클래스 소개로
            </button>
          </div>
          {scene === 1 && (
            <section aria-labelledby="intro-title">
              <h1 id="intro-title" ref={title} tabIndex={-1}>
                작은 작업실에서 시작된 여행
              </h1>
              <WorkbookIntro onComplete={() => go(2)} />
            </section>
          )}
          {scene === 2 && (
            <>
              <section className={styles.section} hidden={lesson !== null}>
                <span className="label">WORLD 01 · 카피바라와 AI 입문</span>
                <h1 ref={title} tabIndex={-1}>
                  작은 작업실에서 웹 만들기까지
                </h1>
                <p>
                  카피바라: “내 작업들을 소개할 홈페이지를 만들고 싶어. AI가 어떻게 도와줄 수
                  있는지부터 함께 알아보자.”
                </p>
                <p className={styles.deviceNote}>
                  개인 컴퓨터에서 실습해요. 모바일은 설명과 확인 문제를 다시 보는 복습용이에요.
                </p>
                <WorkbookMap completed={completed} onEnter={setLesson} />
                <button className={styles.quiet} onClick={() => go(1)}>
                  카피바라 이야기 더 보기 · 선택
                </button>
              </section>
              {lesson !== null && (
                <>
                  <WorkbookLessons
                    key={lesson}
                    initialLesson={lesson}
                    onBack={() => {
                      setLesson(null);
                      requestAnimationFrame(() => title.current?.focus());
                    }}
                    onComplete={(index) =>
                      setCompleted((previous) =>
                        previous.includes(index) ? previous : [...previous, index],
                      )
                    }
                  />
                </>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}

"use client";

// 캐러셀의 이전/다음 조작과 스크롤 끝 상태를 실제 컨테이너에 맞춘다.
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { workbookTrial } from "@/lib/workbook-course";
import { upcomingWorkbookClasses } from "@/lib/workbook-catalog";
import styles from "./WorkbookCatalog.module.scss";

export function WorkbookCatalog({ layout }: { layout: "carousel" | "grid" }) {
  const Heading = layout === "grid" ? "h2" : "h3";
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ previous: false, next: false });
  useEffect(() => {
    if (layout !== "carousel") return;
    const element = track.current;
    if (!element) return;
    const update = () =>
      setEdges({
        previous: element.scrollLeft > 2,
        next: element.scrollLeft + element.clientWidth < element.scrollWidth - 2,
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, [layout]);
  const move = (direction: number) => {
    const element = track.current;
    if (!element) return;
    const first = element.children[0] as HTMLElement | undefined;
    const second = element.children[1] as HTMLElement | undefined;
    const distance = first && second ? second.offsetLeft - first.offsetLeft : element.clientWidth;
    element.scrollBy({ left: direction * distance, behavior: "instant" });
  };
  return (
    <div className={styles.catalog}>
      <ul
        ref={track}
        className={`${styles.cards} ${styles[layout]}`}
        aria-label="클래스 목록"
        tabIndex={layout === "carousel" ? 0 : undefined}
      >
        <li>
          <Link href="/workbook/classes/vibe-web" className={styles.card}>
            <div className={styles.cardImage}>
              <Image
                src="/images/workbook/vibe-web-cover-v2.png"
                alt="청록빛 스튜디오에서 웹페이지를 확인하는 선글라스 차림의 카피바라"
                width={1672}
                height={941}
                sizes="(min-width: 1024px) 300px, 80vw"
              />
            </div>
            <div className={styles.cardCopy}>
              <span className={styles.tag}>CLASS 01 · AI 도구 준비하기부터</span>
              <Heading>AI와 만드는 나의 첫 웹페이지</Heading>
              <p>AI 도구 준비부터 내 홈페이지 기획, 첫 제작과 수정까지.</p>
              <small>{workbookTrial.label} · 기본 17수업 · PC 제작 실습</small>
              <strong>클래스 알아보기 ↗</strong>
            </div>
          </Link>
        </li>
        {upcomingWorkbookClasses.map((item, index) => (
          <li key={item.id}>
            <article
              className={`${styles.card} ${styles.comingSoon}`}
              aria-labelledby={`${item.id}-class-title`}
            >
              <div className={styles.cardImage}>
                <Image
                  src={item.image}
                  alt={item.alt}
                  width={1672}
                  height={941}
                  sizes="(min-width: 1024px) 300px, 80vw"
                />
                <span className={styles.comingSoonMark} lang="en">
                  COMING SOON
                </span>
              </div>
              <div className={styles.cardCopy}>
                <span className={styles.tag}>
                  CLASS {String(index + 2).padStart(2, "0")} · 기획 중
                </span>
                <Heading id={`${item.id}-class-title`}>{item.title}</Heading>
                <p>{item.description}</p>
                <small>커리큘럼 · 지원 환경 · 공개 일정 미정</small>
                <span className={styles.pending}>준비 중인 클래스</span>
              </div>
            </article>
          </li>
        ))}
      </ul>
      {layout === "carousel" && (edges.previous || edges.next) && (
        <div className={styles.controls}>
          <span>옆으로 넘겨 클래스를 살펴보세요.</span>
          <div>
            <button
              type="button"
              aria-label="이전 클래스"
              disabled={!edges.previous}
              onClick={() => move(-1)}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="다음 클래스"
              disabled={!edges.next}
              onClick={() => move(1)}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

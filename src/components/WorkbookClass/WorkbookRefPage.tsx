// 2-2 예시 페이지 한 장: 실제 사이트처럼 글 · 사진 · 버튼을 넣어 그린 가상의 페이지.
// 실존 사이트 · 회사 · 사람을 그리지 않는다. 사진은 워크북이 직접 만든 그림을 쓰고, 후기는 "예시 후기"로 밝힌다.
// onPart를 주면 부분마다 누를 수 있고, 누른 부분에는 그 부분이 하는 일이 붙는다.
import Image from "next/image";
import type { ReactNode } from "react";
import type { ReferenceExample } from "@/lib/workbook-plan-options";
import styles from "./WorkbookRefPage.module.scss";

const IMAGES = {
  hero: "/images/workbook/study-v3.png",
  cards: [
    { name: "소개 페이지", src: "/images/workbook/class-web-seaside-v1.png" },
    { name: "할 일 앱", src: "/images/workbook/class-app-studio-v1.png" },
    { name: "작은 게임", src: "/images/workbook/class-game-seaside-v1.png" },
  ],
} as const;
const CENTERED = new Set(["top-button", "bottom-button"]);

/** 예시 페이지 부분 하나의 생김새. 2-2 고르기의 스크랩북 조각에서도 같은 모양을 쓴다. */
export function WorkbookRefPartContent({ id }: { id: string }) {
  switch (id) {
    case "hero-photo":
      return (
        <span className={styles.photo}>
          <Image src={IMAGES.hero} alt="" fill sizes="(min-width: 768px) 30vw, 90vw" />
        </span>
      );
    case "one-line":
      return <span className={styles.oneLine}>작은 웹 작업을 함께 만드는 작업실</span>;
    case "top-button":
      return <span className={styles.cta}>작업 의뢰하기</span>;
    case "plain-title":
      return <span className={styles.plainTitle}>이번 달에 만든 것</span>;
    case "card-list":
      return (
        <span className={styles.cards}>
          {IMAGES.cards.map((card) => (
            <span key={card.name} className={styles.card}>
              <span className={styles.thumb}>
                <Image src={card.src} alt="" fill sizes="(min-width: 768px) 10vw, 30vw" />
              </span>
              <b>{card.name}</b>
            </span>
          ))}
        </span>
      );
    case "review":
      return (
        <span className={styles.quote}>
          “설명대로 따라 하니 처음으로 끝까지 만들었어요.” <small>— 예시 후기</small>
        </span>
      );
    case "big-sentence":
      return <span className={styles.big}>매일 하나씩, 작게 만들어 봐요.</span>;
    case "bottom-button":
      return <span className={styles.cta}>만든 것 구경하기</span>;
    case "footer-contact":
      return <span className={styles.footer}>연락 · hello@example.com</span>;
    default:
      return null;
  }
}

export function WorkbookRefPage({
  example,
  letter,
  found = [],
  onPart,
  compact = false,
}: {
  example: ReferenceExample;
  letter: string;
  found?: readonly string[];
  onPart?: (id: string) => void;
  compact?: boolean;
}) {
  function part(id: string, children: ReactNode, className: string) {
    const meta = example.parts.find((item) => item.id === id)!;
    const shown = found.includes(id);
    const inner = (
      <>
        {children}
        {shown && (
          <em className={styles.label}>
            {meta.label} · {meta.role}
          </em>
        )}
      </>
    );
    return onPart ? (
      <button
        key={id}
        type="button"
        className={`${styles.part} ${className}`}
        data-found={shown}
        aria-label={`${meta.label}${shown ? ` · ${meta.role}` : " · 무슨 일을 하는지 보기"}`}
        onClick={() => onPart(id)}
      >
        {inner}
      </button>
    ) : (
      <div key={id} className={`${styles.part} ${className}`}>
        {inner}
      </div>
    );
  }
  return (
    <figure
      className={styles.page}
      data-compact={compact}
      aria-label={`예시 ${letter} · ${example.name}`}
    >
      <div className={styles.bar} aria-hidden="true">
        <i />
        <i />
        <i />
        <span>예시 {letter}</span>
      </div>
      <div className={styles.body}>
        {example.parts.map((item) =>
          part(
            item.id,
            <WorkbookRefPartContent id={item.id} />,
            CENTERED.has(item.id) ? styles.center : styles.wide,
          ),
        )}
      </div>
      <figcaption>{example.name}</figcaption>
    </figure>
  );
}

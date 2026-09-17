"use client";
// 클라이언트인 이유: 화살표 버튼이 스크롤 컨테이너를 움직여야 하고(ref), 끝에 닿았는지에 따라 버튼을 숨긴다.

import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./Carousel.module.scss";

type Props = { children: ReactNode; label: string };

export function Carousel({ children, label }: Props) {
  const ref = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setCanPrev(el.scrollLeft > 4);
      setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const step = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const cardWidth = first ? first.getBoundingClientRect().width + 8 : el.clientWidth / 2;
    el.scrollBy({ left: dir * cardWidth * 2, behavior: "smooth" });
  };

  return (
    <div className={styles.wrap}>
      <ul ref={ref} className={styles.track} aria-label={label}>
        {Children.map(children, (child) => (
          <li>{child}</li>
        ))}
      </ul>
      {canPrev && (
        <button
          type="button"
          className={`${styles.arrow} ${styles.prev}`}
          onClick={() => step(-1)}
          aria-label="이전"
        >
          ←
        </button>
      )}
      {canNext && (
        <button
          type="button"
          className={`${styles.arrow} ${styles.next}`}
          onClick={() => step(1)}
          aria-label="다음"
        >
          →
        </button>
      )}
    </div>
  );
}

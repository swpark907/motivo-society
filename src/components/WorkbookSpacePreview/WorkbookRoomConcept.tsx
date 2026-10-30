"use client";

// 통합 원화의 공간·생활감 검토용. 소품 개별 이동/보상 상태를 이 이미지에 합성하지 않는다.
import Image from "next/image";
import { useState } from "react";
import styles from "./WorkbookRoomConcept.module.scss";
const areas = [
  {
    title: "만드는 자리",
    label: "01 / WORK",
    text: "카피바라가 앉는 높이에 맞춘 의자와 책상. 노트·머그·조명은 책상 면의 시점과 크기를 따릅니다.",
    detail: "클래스에서 남긴 기획과 첫 화면의 기록이 자리할 곳입니다.",
  },
  {
    title: "쉬어가는 자리",
    label: "02 / REST",
    text: "창가의 낮은 의자, 접어둔 담요와 작은 찻잔. 작업만 하는 전시장이 아니라 잠시 쉬어갈 수 있는 방입니다.",
    detail: "카피바라의 휴식 자세와 계절 소품을 확장할 자리입니다. 현재는 정지 원화입니다.",
  },
  {
    title: "모아두는 자리",
    label: "03 / KEEP",
    text: "벽 선반과 작은 서랍에 기념품을 모읍니다. 벽의 픽셀 풍경은 클래스 속 여정과 이어지는 표식입니다.",
    detail: "수집함의 모든 물건을 채우기보다 선택한 것만 전시할 공간을 남깁니다.",
  },
];
export function WorkbookRoomConcept() {
  const [active, setActive] = useState(0);
  const [large, setLarge] = useState(false);
  return (
    <section className={styles.concept} aria-labelledby="room-concept-title">
      <header>
        <div>
          <span>ROOM STUDY 01</span>
          <h3 id="room-concept-title">만들고, 쉬고, 다시 돌아오는 방.</h3>
        </div>
        <button type="button" aria-pressed={large} onClick={() => setLarge((value) => !value)}>
          {large ? "전체 보기" : "그림 크게 보기"}
        </button>
      </header>
      <figure>
        <div
          className={styles.canvas}
          tabIndex={0}
          aria-label={
            large ? "큰 작업실 그림. 좌우로 스크롤해서 볼 수 있어요." : "작업실 전체 그림"
          }
        >
          <Image
            className={styles.art}
            data-large={large}
            src="/images/workbook/room/studio-concept-v1.png"
            alt="나무 바닥과 두 벽이 보이는 따뜻한 작업실. 카피바라가 책상 의자에서 노트북을 사용하고, 왼쪽 창가에는 담요를 둔 휴식 의자, 오른쪽에는 책과 작은 수납함이 놓인 선반이 있다."
            width={1536}
            height={1024}
            sizes="(min-width: 1024px) 1200px, 100vw"
          />
        </div>
        <figcaption>
          방·가구·소품·카피바라를 같은 시점으로 그린 통합 원화 시안 · AI 생성 이미지
          {large && " · 작은 화면에서는 좌우로 이동해 살펴보세요."}
        </figcaption>
      </figure>
      <div className={styles.notes}>
        <nav aria-label="작업실 공간 설명">
          {areas.map((area, index) => (
            <button
              type="button"
              key={area.label}
              aria-pressed={active === index}
              onClick={() => setActive(index)}
            >
              {area.label}
              <strong>{area.title}</strong>
            </button>
          ))}
        </nav>
        <div aria-live="polite">
          <h4>{areas[active].title}</h4>
          <p>{areas[active].text}</p>
          <small>{areas[active].detail}</small>
        </div>
      </div>
      <p className={styles.scope}>
        미술 방향을 확인하는 시안입니다. 개별 배치는 방·가구·소품을 같은 카메라의 레이어로 분리한
        다음 연결합니다. 아래 ‘수집·배치 구조’는 이전 동작 실험이며, 이 원화의 물건을 직접 옮기는
        기능은 아닙니다.
      </p>
    </section>
  );
}

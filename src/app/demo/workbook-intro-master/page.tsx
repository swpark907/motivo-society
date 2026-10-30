"use client";

import { useState } from "react";
import { masterFrame } from "@/lib/workbook-intro-preview-frames";
import styles from "./page.module.scss";

export default function MasterPreview() {
  const [playing, setPlaying] = useState(true);
  return (
    <main className={styles.page}>
      <div className={styles.top}>WORKBOOK / INTRO MOTION STUDY</div>
      <div className={styles.stage}>
        <div
          className={`${styles.scene} ${!playing ? styles.stopped : ""}`}
          aria-label="인사, 책상 등장, 착석, 공부 장면을 하나의 원본에서 재생"
        >
          <div className={styles.frameStack} aria-hidden="true">
            {Array.from({ length: 36 }, (_, index) => (
              <div
                key={`intro-${index}`}
                className={styles.firstFrame}
                style={{ ...masterFrame(index), animationDelay: `${index * 400}ms` }}
              />
            ))}
            {Array.from({ length: 18 }, (_, index) => (
              <div
                key={`loop-${index}`}
                className={styles.loopFrame}
                style={{ ...masterFrame(index + 18), animationDelay: `${14400 + index * 400}ms` }}
              />
            ))}
            <div className={styles.stillFrame} style={masterFrame(18)} />
          </div>
          <button onClick={() => setPlaying(!playing)}>
            {playing ? "움직임 멈추기" : "움직임 다시 보기"}
          </button>
        </div>
        <div className={styles.copy}>
          <span>ONE MASTER / MOTION PREVIEW</span>
          <h1>
            반가워요.
            <br />
            <em>함께 만들어볼까요?</em>
          </h1>
          <p>하나의 원본에서 인사부터 공부까지 보여주고, 마지막 공부 구간을 반복하는 시안이에요.</p>
          <p className={styles.note}>프레임의 위치와 장면 연결을 검수 중이에요.</p>
          <a href="/demo/workbook-intro-frames">프레임 하나씩 살펴보기 →</a>
        </div>
      </div>
    </main>
  );
}

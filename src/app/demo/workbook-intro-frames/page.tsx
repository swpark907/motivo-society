import {
  candidateOpeningFrame,
  masterFrame,
  masterThinkingCandidateFrame,
  masterThinkingCandidate3Frame,
  openingFrame,
  studyFrame,
} from "@/lib/workbook-intro-preview-frames";
import styles from "./page.module.scss";

export default function Frames() {
  return (
    <main className={styles.page}>
      <h1>프레임 정렬 검수</h1>
      {[
        { title: "인사와 착석 · 현재", count: 24, frame: openingFrame },
        { title: "인사와 착석 · 동일 배율 후보", count: 24, frame: candidateOpeningFrame },
        { title: "공부 반복과 펜 동작", count: 34, frame: studyFrame },
        { title: "한 장의 원본 후보 · 19~36 반복", count: 36, frame: masterFrame },
        {
          title: "머리 짚기 중간 자세 후보 · 턱 동작 미완성",
          count: 36,
          frame: masterThinkingCandidateFrame,
        },
        {
          title: "머리·턱·필기 통합 후보 · 정렬 검수 전",
          count: 36,
          frame: masterThinkingCandidate3Frame,
        },
      ].map(({ title, count, frame }) => (
        <section key={title}>
          <h2>{title}</h2>
          <div className={styles.grid}>
            {Array.from({ length: count }, (_, index) => (
              <figure key={index}>
                <div className={styles.frame} style={frame(index)} />
                <figcaption>{String(index + 1).padStart(2, "0")}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

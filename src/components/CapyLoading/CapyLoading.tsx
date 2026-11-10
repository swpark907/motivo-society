import styles from "./CapyLoading.module.scss";

const LETTERS = "LOADING".split("");

export type CapyScene = "walk" | "car" | "plane";
const SCENES: readonly CapyScene[] = ["walk", "car", "plane"];

/**
 * 공용 로딩: 물결치는 LOADING 글자 + 그 아래 작은 카피바라 장면(산책 · 차 · 비행기).
 * scene을 주지 않으면 세 장면이 4초씩 차례로 지나간다(12초 순환). 주면 그 장면만 반복한다.
 * AGENTS.md "공용 로딩 화면 모션 예외(2026-11-10)"에 따른 반복 움직임이다. 모션 줄이기에서는 정지 화면.
 * 0.2초 안에 끝나는 로딩에서는 나타나지 않는다(깜빡임 방지). 화면 읽기에는 "불러오는 중이에요"만 알린다.
 */
export function CapyLoading({
  scene,
  tone = "paper",
  compact = false,
}: {
  scene?: CapyScene;
  tone?: "paper" | "dark";
  compact?: boolean;
}) {
  return (
    <div
      className={styles.loading}
      data-tone={tone}
      data-compact={compact || undefined}
      role="status"
      aria-live="polite"
    >
      <span className={styles.srOnly}>불러오는 중이에요</span>
      <p className={styles.word} aria-hidden="true">
        {LETTERS.map((ch, i) => (
          <span key={i} style={{ animationDelay: `${i * 90}ms` }}>
            {ch}
          </span>
        ))}
      </p>
      <div className={styles.track} data-mode={scene ? "one" : "tour"} aria-hidden="true">
        <span className={styles.path} />
        {(scene ? [scene] : SCENES).map((k) => (
          <span key={k} className={styles.capy} data-scene={k} />
        ))}
      </div>
    </div>
  );
}

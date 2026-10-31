import type { CSSProperties } from "react";

/**
 * A scissor-cut outline: a polygon whose edges wobble a little, seeded so it never changes.
 * `depth` is how far (in %) the cut wanders inward from the edge.
 */
export function scissorCut(seed: number, depth = 2.4, steps = 9): CSSProperties {
  let n = seed;
  const rand = () => {
    n = (n * 9301 + 49297) % 233280;
    return n / 233280;
  };
  const points: string[] = [];
  const side = (from: [number, number], to: [number, number], inward: [number, number]) => {
    for (let i = 0; i < steps; i++) {
      const k = i / steps;
      const wobble = rand() * depth;
      points.push(
        `${(from[0] + (to[0] - from[0]) * k + inward[0] * wobble).toFixed(1)}% ${(from[1] + (to[1] - from[1]) * k + inward[1] * wobble).toFixed(1)}%`,
      );
    }
  };
  side([0, 0], [100, 0], [0, 1]);
  side([100, 0], [100, 100], [-1, 0]);
  side([100, 100], [0, 100], [0, -1]);
  side([0, 100], [0, 0], [1, 0]);
  return { clipPath: `polygon(${points.join(", ")})` };
}

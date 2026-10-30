import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ATLAS_FRAMES,
  ATLAS_SRC,
  INTRO_LAYERS,
  INTRO_STEPS,
  LAYERS,
  GESTURES,
  REST_FRAME,
  gestureSteps,
  nextStudyRound,
  typingSteps,
} from "./workbook-intro-sprite";

describe("workbook intro sprite sequence", () => {
  it("returns every gesture to the rest pose and stays inside the atlas", () => {
    for (const gesture of GESTURES) {
      const sequence = gestureSteps(gesture);
      expect(sequence.at(-1)?.frame).toBe(REST_FRAME);
      for (const step of sequence) {
        expect(step.frame).toBeGreaterThanOrEqual(0);
        expect(step.frame).toBeLessThan(ATLAS_FRAMES);
        expect(step.ms).toBeGreaterThan(0);
      }
    }
  });

  it("plays the transition back in reverse when leaving the key pose", () => {
    const frames = gestureSteps("chin").map((step) => step.frame);
    expect(frames).toEqual([33, 34, 35, 36, 37, 38, 38, 37, 36, 35, 34, 33, 0]);
  });

  it("starts each typing loop from the rest pose", () => {
    const frames = typingSteps(2).map((step) => step.frame);
    expect(frames.filter((frame) => frame === REST_FRAME)).toHaveLength(2);
    expect(frames[0]).toBe(REST_FRAME);
  });

  it("never repeats the previous gesture", () => {
    for (const previous of GESTURES) {
      for (const value of [0, 0.4, 0.99]) {
        expect(nextStudyRound(previous, () => value).gesture).not.toBe(previous);
      }
    }
  });

  it("ends the intro with the furniture fully shown and never hides it again", () => {
    let shown = 0;
    for (const step of INTRO_STEPS) {
      expect(step.pose).toBeGreaterThanOrEqual(0);
      expect(step.pose).toBeLessThan(17);
      expect(step.furniture).toBeGreaterThanOrEqual(shown);
      shown = step.furniture;
    }
    expect(INTRO_STEPS.at(-1)?.furniture).toBe(1);
  });

  // 프레임 칸 번호는 아틀라스 PNG의 칸 수와 맞아야 한다. PNG 너비는 IHDR(16~19바이트)에 있다.
  it("matches the atlas images it indexes into", () => {
    const width = (path: string) => readFileSync(`public${path}`).readUInt32BE(16);
    expect(width(ATLAS_SRC)).toBe(ATLAS_FRAMES * LAYERS.motion.width);
    expect(width(INTRO_LAYERS.stand.src)).toBe(17 * INTRO_LAYERS.stand.width);
  });
});

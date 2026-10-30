/** Frame positions for the 1-1-1 motion prototype and its inspection page. */
const openingOffsets = [
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, -9],
  [0, -9],
  [0, -9],
  [3, -10],
  [2, -9],
  [-9, -9],
  [4, -18],
  [3, -18],
  [-1, -18],
  [-4, -18],
  [-6, -18],
  [-8, -18],
] as const;

export function openingFrame(index: number) {
  const row = Math.floor(index / 6);
  const column = index % 6;
  const [dx, dy] = openingOffsets[index];
  const wider = index === 5 || index === 11;
  return {
    backgroundImage: "url(/images/workbook/intro-capy-story-v1.png)",
    backgroundSize: wider ? "500% 333.333%" : "600% 400%",
    transform: wider ? "scale(1.25)" : undefined,
    transformOrigin: wider ? "center 80%" : undefined,
    backgroundPosition: wider
      ? `${(1225 * 100) / 1228.8}% ${(row * 251 * 100) / 716.8}%`
      : `${((column * 256 + dx) * 100) / 1280}% ${((row * 256 + dy) * 100) / 768}%`,
    clipPath:
      index === 4
        ? "inset(0 20% 0 2%)"
        : index === 10
          ? "inset(0 9% 0 2%)"
          : index === 11
            ? "inset(0 0 10% 12%)"
            : index === 5
              ? "inset(0 0 10% 0)"
              : row === 3
                ? "inset(8% 2% 0)"
                : "inset(0 2% 0)",
  };
}

/** The loop includes the thinking poses followed by the pencil transition. */
export function studyFrame(index: number) {
  const writing = index >= 15;
  const frame = writing ? index - 10 : index;
  const row = Math.floor(frame / 6);
  const column = frame % 6;
  const dx = (writing ? [-1, -3, -5, -6, -8, -8] : [0, -2, -4, -7, -8, -9])[column];
  const dy = [0, -3, -4, -12][row];
  return {
    backgroundImage: `url(/images/workbook/intro-capy-${writing ? "writing-v2" : "study-v2"}.png)`,
    backgroundSize: "600% 400%",
    backgroundPosition: `${((column * 256 + dx) * 100) / 1280}% ${((row * 256 + dy) * 100) / 768}%`,
    clipPath: "inset(5% 2% 0)",
  };
}

/** Alternative opening: all poses use a 307px window instead of zooming only two frames. */
export function candidateOpeningFrame(index: number) {
  const row = Math.floor(index / 6);
  const column = index % 6;
  const x = [0, 238, 494, 750, 1006, 1225][column];
  const y = [0, 250, 495, 716][row];
  const top = row === 0 ? 0 : row === 3 ? 14 : 8;
  const right = index === 4 ? 26 : column === 0 && row > 0 ? 13 : 2;
  const left = column === 5 && row > 0 ? 10 : 2;
  return {
    backgroundImage: "url(/images/workbook/intro-capy-story-candidate-v2.png)",
    backgroundSize: "500% 333.333%",
    backgroundPosition: `${(x * 100) / 1228.8}% ${(y * 100) / 716.8}%`,
    clipPath: `inset(${top}% ${right}% 0 ${left}%)`,
  };
}

/** One candidate sheet contains both opening poses and the repeated study poses. */
export function masterFrame(index: number) {
  const row = Math.floor(index / 6);
  const column = index % 6;
  // Offsets are measured against the underside of the first seated frame's desk.
  const seatedOffsets = [
    [12, 5],
    [13, 5],
    [4, 5],
    [0, 0],
    [9, 0],
    [10, 0],
    [11, 0],
    [14, 0],
    [4, 0],
    [2, -9],
    [9, -9],
    [11, -9],
    [13, -9],
    [8, -9],
    [7, -9],
    [4, 0],
    [9, 0],
    [11, 0],
    [14, 0],
    [10, 0],
    [9, 0],
  ] as const;
  const [dx, dy] = index >= 15 ? seatedOffsets[index - 15] : [0, 0];
  const y = [25, 210, 400, 570, 728, 865][row] + dy;
  const top = [0, 0, 0, 0, 4, 4][row];
  const bottom = [30, 25, 34, 39, 42, 0][row];
  return {
    backgroundImage: "url(/images/workbook/intro-capy-master-v1.png)",
    backgroundSize: "600% 400%",
    transform: index < 6 ? "translateX(-12%)" : undefined,
    backgroundPosition: `${((column * 256 + dx) * 100) / 1280}% ${(y * 100) / 768}%`,
    clipPath: `inset(${top}% ${dx > 0 ? 6 : 2}% ${bottom}% 2%)`,
  };
}

/** Candidate with additional head-touch poses; chin transition is not yet complete. */
export function masterThinkingCandidateFrame(index: number) {
  return {
    ...masterFrame(index),
    backgroundImage: "url(/images/workbook/intro-capy-master-thinking-candidate-v1.png)",
  };
}

/** Full-sequence candidate with multiple face and chin poses, pending alignment review. */
export function masterThinkingCandidate3Frame(index: number) {
  return {
    ...masterFrame(index),
    backgroundImage: "url(/images/workbook/intro-capy-master-thinking-candidate-v3.png)",
    clipPath: Math.floor(index / 6) === 4 ? "inset(4% 6% 38% 2%)" : masterFrame(index).clipPath,
  };
}

export type ColoringMap = {
  width: number;
  height: number;
  ids: Int32Array;
  seeds: number[];
};

// Four-connected white interiors; dark lines remain barriers. Small specks are excluded.
export function findColoringRegions(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  minimumArea = 16,
): ColoringMap {
  const ids = new Int32Array(width * height).fill(-1);
  const queue = new Int32Array(ids.length);
  const seeds: number[] = [];
  for (let i = 0; i < ids.length; i++) {
    if (Math.min(pixels[i * 4], pixels[i * 4 + 1], pixels[i * 4 + 2]) < 200) ids[i] = -2;
  }
  for (let start = 0; start < ids.length; start++) {
    if (ids[start] !== -1) continue;
    const id = seeds.length;
    let head = 0;
    let tail = 1;
    queue[0] = start;
    ids[start] = id;
    while (head < tail) {
      const p = queue[head++];
      const x = p % width;
      const neighbors = [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width];
      for (const n of neighbors) {
        if (n >= 0 && n < ids.length && ids[n] === -1) {
          ids[n] = id;
          queue[tail++] = n;
        }
      }
    }
    if (tail < minimumArea) {
      for (let n = 0; n < tail; n++) ids[queue[n]] = -2;
    } else seeds.push(start);
  }
  return { width, height, ids, seeds };
}

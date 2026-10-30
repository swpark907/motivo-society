import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
// Next가 사용하는 sharp를 재사용한다. 생성 원본은 변경하지 않는다.
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const root = "public/images/workbook/room";
const output = `${root}/optimized`;
await mkdir(output, { recursive: true });
const files = [];
async function walk(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (file.endsWith(".png")) files.push(file);
  }
}
for (const folder of ["slots", "views", "themes"]) await walk(`${root}/${folder}`);
const manifest = {};
let sourceBytes = 0;
const exported = new Map();
for (const file of files.sort()) {
  const input = await readFile(file);
  const meta = await sharp(input).metadata();
  if (meta.width !== 1536 || meta.height !== 1024) throw new Error(`캔버스 규격: ${file}`);
  let rect = [0, 0, 1536, 1024];
  if (file.includes("/sets/desk-") && !file.endsWith("desk-idle-empty.png"))
    rect = [675, 245, 493, 431];
  else if (file.includes("/sets/lounge-") && !file.endsWith("lounge-idle-plain.png"))
    rect = [168, 430, 385, 349];
  else if (file.includes("/views/")) rect = [138, 102, 493, 431];
  else if (file.includes("/slots/") && !file.includes("/sets/") && !file.endsWith("/base.png")) {
    const { data, info } = await sharp(input)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let left = 1536,
      top = 1024,
      right = 0,
      bottom = 0;
    for (let y = 0; y < 1024; y++)
      for (let x = 0; x < 1536; x++)
        if (data[(y * 1536 + x) * info.channels + 3] > 2) {
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
    left = Math.max(0, left - 12);
    top = Math.max(0, top - 12);
    right = Math.min(1535, right + 12);
    bottom = Math.min(1023, bottom + 12);
    rect = [left, top, right - left + 1, bottom - top + 1];
  }
  const hash = createHash("sha256")
    .update(input)
    .update(JSON.stringify(rect) + "webp-q88-alpha100-v1")
    .digest("hex")
    .slice(0, 16);
  const name = `${hash}.webp`;
  if (!exported.has(name)) {
    const [left, top, width, height] = rect;
    const bytes = await sharp(input)
      .extract({ left, top, width, height })
      .webp({ quality: 88, alphaQuality: 100 })
      .toBuffer();
    await writeFile(`${output}/${name}`, bytes);
    exported.set(name, bytes.length);
  }
  manifest["/" + file.slice("public/".length)] = {
    src: `/images/workbook/room/optimized/${name}`,
    rect,
  };
  sourceBytes += input.length;
}
await writeFile(
  "src/lib/workbook-room-assets.generated.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
const bytes = [...exported.values()].reduce((a, b) => a + b, 0);
console.log(
  `작업실 ${files.length} sources / ${exported.size} outputs: ${(sourceBytes / 1048576).toFixed(1)} → ${(bytes / 1048576).toFixed(1)} MiB (${(100 * (1 - bytes / sourceBytes)).toFixed(1)}% reduction)`,
);

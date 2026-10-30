import {
  isEmbeddedEditorialPhoto,
  MAX_EMBEDDED_PHOTO_CHARS,
} from "@/lib/content/workbook-editorial-schema";
import type { EditorialPhoto } from "./photos";
export async function prepareEditorialPhoto(file: File): Promise<EditorialPhoto> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("JPEG·PNG·WebP 사진을 선택해주세요.");
  if (file.size > 10 * 1024 * 1024) throw new Error("10MB 이하의 사진을 선택해주세요.");
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const matches =
    file.type === "image/jpeg"
      ? header[0] === 255 && header[1] === 216 && header[2] === 255
      : file.type === "image/png"
        ? [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => header[index] === byte)
        : String.fromCharCode(...header.slice(0, 4)) === "RIFF" &&
          String.fromCharCode(...header.slice(8, 12)) === "WEBP";
  if (!matches) throw new Error("사진을 읽을 수 없어요. 파일 형식을 확인해주세요.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("사진을 읽을 수 없어요. 다른 사진을 선택해주세요.");
  }
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 80_000_000)
      throw new Error("사진 크기가 너무 커요. 8천만 화소 이하로 줄여주세요.");
    const canvas = document.createElement("canvas");
    const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("이 브라우저에서 사진을 변환할 수 없어요.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.55, 0.4]) {
      const src = canvas.toDataURL("image/jpeg", quality);
      if (src.length <= MAX_EMBEDDED_PHOTO_CHARS && isEmbeddedEditorialPhoto(src))
        return { src, title: file.name, alt: file.name, caption: "내 컴퓨터에서 추가한 사진" };
    }
    throw new Error("사진 용량을 더 줄여서 다시 선택해주세요.");
  } finally {
    bitmap.close();
  }
}

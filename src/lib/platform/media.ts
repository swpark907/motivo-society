// 이미지 보관함(H06)의 순수 계산: 표지 경로 → 화면 주소, 올린 파일의 실제 형식. React·DB 의존 없음.

export const MEDIA_BUCKET = "media";
/** 한 장 5MB까지(버킷 설정과 같다). */
export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;

const MEDIA_PREFIX = "media:";

/**
 * activities.cover_path → 이미지 주소.
 * '/images/…'(사이트 안 시안 이미지)는 그대로, 'media:<경로>'는 Storage 공개 주소로.
 */
export function coverSrc(
  path: string | null | undefined,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
): string | null {
  if (!path) return null;
  if (path.startsWith("/images/")) return path;
  if (path.startsWith(MEDIA_PREFIX) && supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/${path.slice(MEDIA_PREFIX.length)}`;
  }
  return null;
}

/** 보관함 파일 경로 → 공개 주소. */
export function mediaUrl(path: string, supabaseUrl?: string): string {
  return coverSrc(`${MEDIA_PREFIX}${path}`, supabaseUrl) ?? "";
}

/**
 * 사이트 밖(Storage) 이미지인가. next/image 최적화는 로컬 주소를 막아 두었으니(SSRF 방지)
 * 이런 이미지는 최적화 없이(unoptimized) 그대로 보여 준다.
 */
export function isRemoteImage(src: string): boolean {
  return /^https?:\/\//.test(src);
}

export type ImageKind = { ext: "jpg" | "png" | "webp"; mime: string };

/** 확장자나 브라우저가 알려 준 형식이 아니라 파일 앞부분(매직 바이트)으로 형식을 정한다. */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  const b = (i: number) => bytes[i];
  if (bytes.length >= 3 && b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b(i) === v)
  ) {
    return { ext: "png", mime: "image/png" };
  }
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

/** 보관함 경로: 내 보관함은 u/<사람 id>, 클럽 보관함은 c/<클럽 id>. */
export function mediaPath(
  owner: { kind: "user"; id: string } | { kind: "club"; id: string },
  fileId: string,
  ext: ImageKind["ext"],
): string {
  return `${owner.kind === "user" ? "u" : "c"}/${owner.id}/${fileId}.${ext}`;
}

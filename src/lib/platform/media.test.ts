import { describe, expect, it } from "vitest";
import { coverSrc, isRemoteImage, mediaPath, sniffImage } from "./media";

const URL = "http://127.0.0.1:55421";

describe("표지 주소", () => {
  it("사이트 안 이미지는 그대로, 보관함 이미지는 Storage 공개 주소, 나머지는 없음", () => {
    expect(coverSrc("/images/platform/mock/a.jpg", URL)).toBe("/images/platform/mock/a.jpg");
    expect(coverSrc("media:u/x/y.png", URL)).toBe(
      `${URL}/storage/v1/object/public/media/u/x/y.png`,
    );
    expect(coverSrc(null, URL)).toBeNull();
    expect(coverSrc("https://evil.test/a.png", URL)).toBeNull();
  });

  it("밖의 이미지만 최적화 없이", () => {
    expect(isRemoteImage(`${URL}/storage/v1/object/public/media/a.png`)).toBe(true);
    expect(isRemoteImage("/images/a.jpg")).toBe(false);
  });
});

describe("올린 파일의 형식", () => {
  it("매직 바이트로 jpg · png · webp를 알아보고, 그 밖은 거절", () => {
    expect(sniffImage(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))?.ext).toBe("jpg");
    expect(
      sniffImage(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))?.ext,
    ).toBe("png");
    const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
    expect(sniffImage(webp)?.mime).toBe("image/webp");
    expect(sniffImage(new TextEncoder().encode("<svg xmlns="))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
  });

  it("보관함 경로", () => {
    expect(mediaPath({ kind: "user", id: "u1" }, "f1", "png")).toBe("u/u1/f1.png");
    expect(mediaPath({ kind: "club", id: "c1" }, "f1", "jpg")).toBe("c/c1/f1.jpg");
  });
});

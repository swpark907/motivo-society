import Image from "next/image";
import type { CSSProperties } from "react";
import manifest from "@/lib/workbook-room-assets.generated.json";

// 잘린 서비스 이미지를 원래 캔버스 좌표에 복원해 기존 배치·마스크를 그대로 유지한다.
export function WorkbookRoomImage({
  src,
  className,
  style,
  fill,
  "data-room-set": setId,
}: {
  src: string;
  className?: string;
  style?: CSSProperties;
  fill?: boolean;
  "data-room-set"?: string;
}) {
  const asset = (manifest as Record<string, { src: string; rect: number[] }>)[src];
  if (!asset) throw new Error(`Unregistered room export: ${src}`);
  const [x, y, width, height] = asset.rect;
  return (
    <span
      className={className}
      style={{
        display: "block",
        position: fill ? "absolute" : "relative",
        ...(fill ? { inset: 0 } : { aspectRatio: "1.5" }),
        ...style,
      }}
    >
      <Image
        unoptimized
        loading="eager"
        src={asset.src}
        alt=""
        data-room-set={setId}
        width={width}
        height={height}
        style={{
          position: "absolute",
          maxWidth: "none",
          left: `${(x / 1536) * 100}%`,
          top: `${(y / 1024) * 100}%`,
          width: `${(width / 1536) * 100}%`,
          height: `${(height / 1024) * 100}%`,
        }}
      />
    </span>
  );
}

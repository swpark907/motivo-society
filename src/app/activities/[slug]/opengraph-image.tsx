import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getActivityDetail } from "@/lib/platform/activity-detail";
import { KIND_LABELS } from "@/lib/platform/messages";

// DM·메신저 미리보기 이미지. 표지가 있으면 표지 위에 제목, 없으면 종류 색 면 + 제목.
// 비로그인으로 읽으므로 멤버 공개·작성 중 활동은 기본 그림만 나온다.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "motivo society 활동";

const KIND_COLORS: Record<string, string> = {
  gathering: "#f4dc78",
  series: "#bcd0f2",
  challenge: "#bfd394",
};

const fontPath = (w: string) =>
  join(process.cwd(), `node_modules/pretendard/dist/public/static/Pretendard-${w}.otf`);

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [black, bold] = await Promise.all([
    readFile(fontPath("Black")),
    readFile(fontPath("Bold")),
  ]);
  const result = await getActivityDetail(slug);
  const a = result.found ? result.activity : null;

  let cover: string | null = null;
  if (a?.cover) {
    const bytes = await readFile(join(process.cwd(), "public", a.cover)).catch(() => null);
    if (bytes) cover = `data:image/jpeg;base64,${bytes.toString("base64")}`;
  }
  const bg = a ? (KIND_COLORS[a.kind] ?? "#f3f0ea") : "#f3f0ea";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: cover ? "#0b0b0b" : bg,
        fontFamily: "Pretendard",
      }}
    >
      {cover && (
        <img
          src={cover}
          alt=""
          width={1200}
          height={630}
          style={{ objectFit: "cover", opacity: 0.85 }}
        />
      )}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: "48px 64px 56px",
          background: cover ? "#0b0b0b" : "transparent",
          color: cover ? "#fbfaf7" : "#0b0b0b",
        }}
      >
        {a && (
          <div style={{ display: "flex" }}>
            <span
              style={{
                padding: "6px 18px",
                borderRadius: 999,
                background: cover ? bg : "#fbfaf7",
                color: "#0b0b0b",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {KIND_LABELS[a.kind]}
            </span>
          </div>
        )}
        <div style={{ fontSize: 68, fontWeight: 900, lineHeight: 1.15, letterSpacing: -2 }}>
          {a?.title ?? "motivo society"}
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, opacity: 0.75 }}>
          {a
            ? `${a.organizer.name} · motivo society`
            : "배우고, 만들고, 발견하는 테크 기반 컬쳐클럽"}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: black, weight: 900, style: "normal" },
        { name: "Pretendard", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}

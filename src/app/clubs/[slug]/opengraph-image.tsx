import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getClubDetail } from "@/lib/platform/clubs";

// DM·메신저 미리보기 이미지: 클럽 색(분홍) 면 위에 클럽 이름과 한 줄 소개, 멤버 수.
// 링크를 받은 사람의 세션 없이 읽으므로 공개 클럽만 이름이 나온다.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "motivo society 클럽";

const fontPath = (w: string) =>
  join(process.cwd(), `node_modules/pretendard/dist/public/static/Pretendard-${w}.otf`);

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [black, bold, club] = await Promise.all([
    readFile(fontPath("Black")),
    readFile(fontPath("Bold")),
    getClubDetail(slug),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        gap: 18,
        padding: "56px 64px 64px",
        background: "#f2bfd8",
        color: "#0b0b0b",
        fontFamily: "Pretendard",
      }}
    >
      <div style={{ display: "flex" }}>
        <span
          style={{
            padding: "6px 18px",
            borderRadius: 999,
            background: "#fbfaf7",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          클럽
        </span>
      </div>
      <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.1, letterSpacing: -2 }}>
        {club?.name ?? "motivo society"}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, opacity: 0.8 }}>
        {club
          ? [club.tagline, `멤버 ${club.members.length}명`].filter(Boolean).join(" · ")
          : "배우고, 만들고, 발견하는 테크 기반 컬쳐클럽"}
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

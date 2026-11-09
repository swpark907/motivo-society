import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  sassOptions: {
    loadPaths: [path.join(__dirname, "src/styles")],
    additionalData: `@use "mixins" as *;`,
  },
  // 개발 표시 버튼이 모바일 하단 탭 바를 가린다. 꺼도 컴파일·런타임 오류는 그대로 표시된다(Next 문서).
  devIndicators: false,
  experimental: {
    // 호스트 이미지 보관함(H06): 한 장 5MB까지 서버 액션으로 올린다. 여유분(폼 경계 등)을 더해 6MB.
    serverActions: { bodySizeLimit: "6mb" },
  },
  // 새 정보 구조(docs/product/platform-ia.md): Yard 목록은 발견으로 옮겼다.
  // /yard/[slug] 상세는 DM 영구 주소라 그대로 둔다. 구조가 굳기 전이라 임시(307)로 둔다.
  async redirects() {
    return [{ source: "/yard", destination: "/explore", permanent: false }];
  },
};

export default nextConfig;

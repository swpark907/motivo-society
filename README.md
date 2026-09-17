# motivo society

오디스트 웍스가 운영하는 브랜드 **모티보 소사이어티(모쏘)** 의 플랫폼.
배우고, 만들고, 발견하는 테크 기반 컬쳐클럽.

에이전트·사람 공용 규칙과 구조 설명은 **[AGENTS.md](./AGENTS.md)** 에 있다 (Claude는 `CLAUDE.md`를 통해 같은 파일을 읽는다).

## 개발

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm check        # typecheck → lint → prettier → test (완료 기준)
pnpm build
```

Next.js 16 (App Router) · TypeScript · SCSS Modules · Vitest · pnpm · Vercel.
아티클은 `content/articles/*.mdx`에 쓴다.

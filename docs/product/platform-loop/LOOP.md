# 플랫폼 loop 절차서

`/loop`가 매번 이 파일을 읽고 **백로그 항목 하나를 끝까지** 진행한다. 반복 사이에 대화 기억은 보장되지 않으므로, 상태는 이 폴더의 파일과 git에만 둔다.

- 백로그: [BACKLOG.md](BACKLOG.md) — 할 일 순서와 완료 기준. 유일한 진행 상태.
- 기록: [LOG.md](LOG.md) — 반복마다 한 단락. 무엇을, 어떻게 확인했고, 남은 것.
- 정보 구조: [../platform-ia.md](../platform-ia.md) · 기능 명세: [../platform-functional-spec.md](../platform-functional-spec.md) · DB: [../../architecture/platform-db-design.md](../../architecture/platform-db-design.md)

시작 문구(승우가 입력):

```text
/loop docs/product/platform-loop/LOOP.md 절차대로 백로그의 다음 항목 하나를 끝까지 진행해
```

## 한 번의 반복

1. **상태 확인.** `git status`와 [LOG.md](LOG.md) 마지막 단락을 본다. 커밋되지 않은 변경이 있으면 그 항목(`[~]`)을 이어서 끝낸다. 새로 시작하지 않는다.
2. **환경 확인.**
   - 로컬 Supabase: `supabase status`. 꺼져 있으면 `supabase start`(포트 554xx). `.env.local`이 있어야 한다.
   - 개발 서버: 승우가 띄운 `http://localhost:3000`을 먼저 쓴다. 없으면 브라우저 도구 `preview_start`의 `motivo-dev`(3100).
   - 스키마가 어긋나 보이면 `supabase db reset` 후 `pnpm test:db`.
   - 모든 페이지가 500이고 개발 서버 로그에 `Unexpected non-whitespace character after JSON`이 보이면, `next.config.ts`를 바꿔 개발 서버가 다시 시작되며 `.next/dev/prerender-manifest.json` 끝에 이전 내용 조각이 남은 것이다. 첫 JSON 객체 뒤를 잘라 내면 바로 돌아온다(서버를 끌 필요 없음).
   - e2e는 `--workers=2` 이하로 돌린다. 승우의 개발 서버 하나를 같이 쓰므로 병렬이 많으면 개발 서버 캐시가 꼬인다.
3. **항목 고르기.** BACKLOG에서 위에서부터 첫 `[ ]` 항목. `선행:`이 끝나지 않았거나 `결정 대기`면 건너뛴다. 고른 항목을 `[~] (시작 날짜)`로 바꾼다.
4. **만들기.**
   - Next.js 16은 학습 데이터와 다르다. 쓰는 API는 `node_modules/next/dist/docs/`에서 먼저 확인한다(예: 미들웨어 이름·쿠키·서버 액션).
   - 데이터 접근은 `src/lib/platform/`(React 없음)에, 화면은 얇게. 공용 UI는 `src/components/Platform*/`(Name.tsx + Name.module.scss).
   - DB를 바꾸면 **새 마이그레이션 파일**을 더한다(이미 커밋된 마이그레이션은 고치지 않는다) → `supabase db reset` → 타입 재생성 `supabase gen types typescript --local > src/lib/platform/database.types.ts` → 필요하면 `supabase/seed.sql`과 `supabase/tests/` 갱신.
   - 상태 변경은 계속 `security definer` 함수로만. 테이블에 쓰기 권한을 주지 않는다.
5. **확인(전부 통과해야 커밋).**
   - `pnpm check`
   - `pnpm test:db`
   - 바꾼 여정의 e2e: `PW_BASE_URL=http://localhost:3000 pnpm exec playwright test <파일>` (DB를 바꾸는 e2e는 `test.describe.configure({ mode: "serial" })`와 시작 시 초기화)
   - **디자인·사용성 체크**: 브라우저 도구로 PC 1280px와 모바일 375px를 직접 열어 아래 체크리스트를 본다. 가로 스크롤 0. 발견한 것은 고친다.
6. **커밋.** `feat/platform-app` 브랜치에 항목 하나 = 커밋 하나. 제목 `feat(platform): <영어 요약> (Lxx)`, 마지막 줄에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `--no-verify` 금지.
7. **기록.** BACKLOG 항목을 `[x] (날짜, 커밋 해시)`로 바꾸고, 생긴 후속 일은 백로그 맨 아래 "후속"에 한 줄로. LOG.md에 단락 하나(무엇 · 확인 방법과 결과 · 남은 것 · 스크린샷에서 본 문제).
8. **다음 예약.** 남은 `[ ]`가 있으면 다음 반복을 짧게 예약한다. 없거나 모두 막혔으면 loop를 멈추고 승우에게 요약한다.

## 하지 않는 것 (만나면 멈추고 "결정 대기"로)

- `main` 머지, `git push`, 원격 Supabase·운영 DB 접근, 실제 회원 데이터 사용.
- 새 의존성 추가(이미 있는 `@supabase/*`, Playwright, Vitest로 해결한다).
- 브랜드·디자인 규칙(AGENTS.md) 바꾸기, 정보 구조(IA) 바꾸기, 가격·수수료·환불 규정의 실제 값 정하기, 약속성 문구(성과·수익 보장) 쓰기.
- 이미 커밋된 마이그레이션 수정, 데이터 삭제, 시험장(`/demo/platform`)의 기존 동작 깨기.

막히면: 해당 항목에 `결정 대기: <무엇을 누가 정해야 하는지>`를 적고, BACKLOG "결정 대기" 절에도 한 줄 남긴 뒤 다음 항목으로 간다. 같은 항목에서 확인이 두 번 연속 실패하면 원인을 LOG에 적고 다음 항목으로 간다.

## 사용성 체크리스트 (화면마다)

- **어디 / 무엇을 / 그다음**: 이 화면이 무엇인지, 지금 할 수 있는 행동, 누른 뒤 어떻게 되는지가 보인다(AGENTS 공통 UX 원칙).
- **링크로 바로 들어와도 완결**: 홈을 거치지 않은 사람도 무엇인지 알고 다음 갈 곳이 보인다. 활동·클럽 상세는 OG 메타가 있다.
- **상태마다 다른 화면**: 비로그인 · 로그인 · 신청 전/후 · 대기 · 입금 대기 · 마감 · 종료 · 권한 없음에서 버튼 문구와 안내가 맞다.
- **빈 상태 · 오류 · 기다림**: 비었을 때 다음 행동을 알려 주고, 오류는 사람 말로(코드 노출 금지), 서버 동작 중에는 버튼이 눌린 티가 난다.
- **모바일 우선**: 주 행동은 엄지 닿는 곳(필요하면 하단 고정), 누름 영역 44px 이상, 글자 16px 근처, 가로 스크롤 없음.
- **키보드 · 스크린 리더**: 포커스가 보이고 순서가 맞다. 아이콘 버튼에 이름이 있다. 색만으로 상태를 전하지 않는다(배지에 글자).
- **기준 시안 수준**: [L01b 시안](../../design-references/platform/service-draft-l01b.md)(`/demo/design-platform/`)과 나란히 놓고 봐도 떨어지지 않는다. 표지 이미지가 먼저, 날짜와 사람이 먼저, 데이터 테스트 화면처럼 보이지 않는다.
- **디자인 규칙**: 플랫폼 제품 화면 예외(종이 바탕, 의미별 파스텔, 라운드 12~16px, 한 화면 오렌지 하나, 그라디언트·그림자·이모지 없음). 회원 화면은 대시보드형 숫자 요약을 앞세우지 않는다.
- **정직함**: 없는 기능·숫자를 보여 주지 않는다. 가짜 데이터·시험값은 개발 환경에서만.

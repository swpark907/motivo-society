-- 활동 표지(백로그 L04). 지금은 사이트 안 이미지 경로만 받는다.
-- 호스트 이미지 보관함(제안 H2)이 생기면 저장소 경로를 함께 받도록 넓힌다.
alter table public.activities add column cover_path text
  check (cover_path is null or cover_path ~ '^/images/[a-z0-9/_.-]+$');

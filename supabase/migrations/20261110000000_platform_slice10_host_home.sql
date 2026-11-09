-- 플랫폼 10단계: 호스트 도구(/host)의 입구와 "내가 연 활동"
-- 호스트는 계정 종류가 아니라 자격이다(AGENTS.md). 아래 중 하나면 호스트 도구에 들어온다.
--   · 활성 호스트 자격(hosts)
--   · 어느 클럽에서든 활동을 만들 권한(activity.create)
--   · 플랫폼 운영진의 커뮤니티 권한(공식 활동)
--   · 관리할 수 있는 활동이 하나라도 있음(진행자로 들어간 경우 등)
-- 관리 범위 판정은 기존 can_manage_activity 하나로 한다. 화면이 활동마다 따로 묻지 않게 목록을 한 번에 준다.

-- 내가 관리하는 활동(시즌 회차 제외). 상태와 상관없이 전부 — 지난 활동 기록도 여기서 본다.
create or replace function public.host_my_activities()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select a.id
  from public.activities a
  where auth.uid() is not null
    and a.series_id is null
    and public.can_manage_activity(a.id);
$$;

create or replace function public.host_access()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when auth.uid() is null then jsonb_build_object('eligible', false) else (
    select jsonb_build_object(
      'eligible', x.tier is not null or x.club_create or x.official or x.managed > 0,
      'host_tier', x.tier,
      'club_create', x.club_create,
      'official', x.official,
      'managed', x.managed
    )
    from (
      select
        (select tier from public.hosts where user_id = auth.uid() and status = 'active') as tier,
        exists (
          select 1 from public.club_members m
          where m.user_id = auth.uid() and m.status = 'active'
            and public.club_has_permission(m.club_id, 'activity.create')
        ) as club_create,
        public.has_platform_permission('community') as official,
        (select count(*)::integer from public.host_my_activities()) as managed
    ) x
  ) end;
$$;

revoke execute on function public.host_my_activities() from public, anon;
revoke execute on function public.host_access() from public, anon;
grant execute on function public.host_my_activities() to authenticated;
grant execute on function public.host_access() to authenticated;

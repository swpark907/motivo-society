-- 플랫폼 18단계: 호스트 여정 점검 — 단골의 "최근 참가"(H11 수정)
-- host_regulars의 last_at이 아직 시작하지 않은 활동 날짜(미래)까지 잡아 "최근 11.20"처럼 보였다.
-- 이미 시작한 활동 중 가장 최근만 잡는다(없으면 null). 함께한 횟수는 그대로(신청이 확정된 활동 수).

-- 단골: 내가 관리한 활동(시즌은 시즌으로, 회차 출석은 회차에서)에 확정됐던 사람.
create or replace function public.host_regulars()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select id from public.activities
    where auth.uid() is not null and series_id is null and status <> 'cancelled'
      and public.can_manage_activity(id)
  ),
  joined as (
    select p.user_id, count(*)::integer as times,
      -- 이미 시작한 활동 중 가장 최근(아직 오지 않은 활동은 '최근 참가'가 아니다).
      max(a.starts_at) filter (where a.starts_at <= now()) as last_at
    from public.participations p
    join public.activities a on a.id = p.activity_id
    where p.activity_id in (select id from mine) and p.status = 'confirmed' and p.user_id <> auth.uid()
    group by p.user_id
  ),
  att as (
    select t.user_id,
      count(*) filter (where t.status = 'attended')::integer as attended,
      count(*) filter (where t.status = 'absent')::integer as absent
    from public.attendances t
    join public.activities g on g.id = t.gathering_id
    where coalesce(g.series_id, g.id) in (select id from mine)
    group by t.user_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', j.user_id, 'nickname', pr.nickname::text, 'times', j.times, 'last_at', j.last_at,
    'attended', coalesce(t.attended, 0), 'absent', coalesce(t.absent, 0)
  ) order by j.times desc, j.last_at desc nulls last), '[]'::jsonb)
  from joined j
  join public.profiles pr on pr.id = j.user_id
  left join att t on t.user_id = j.user_id;
$$;

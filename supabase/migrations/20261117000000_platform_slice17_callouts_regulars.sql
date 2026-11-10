-- 플랫폼 17단계: 지난 참가자 다시 부르기와 단골(H11)
-- · 다시 부르기: 열린 활동의 호스트가 내가 연 지난 활동의 확정 참가자에게 "새 활동을 열었어요"를 남긴다.
--   활동마다 한 번만 보낼 수 있다(같은 사람에게 반복해서 보내지 않게).
--   받지 않기로 한 사람(전체 끔 · 이 호스트만 끔)과 이미 이 활동에 신청한 사람은 빠진다.
--   받은 사람은 "나" 화면의 받은 소식에서 보고, 거기서 끌 수 있다. 메일 · 푸시는 알림 결정 뒤(H10과 같음).
-- · 단골: 내가 관리한 활동에 확정됐던 사람별 참가 횟수 · 출석 기록 · 마지막 참가. 출석 기록은 참고용이며
--   신청 제한이나 제재에 쓰지 않는다(기능 명세 13절 제안 기본값). 그런 기능도 만들지 않는다.

alter table public.profiles add column accept_host_callouts boolean not null default true;

create table public.callout_mutes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  host_user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, host_user_id)
);

create table public.activity_callouts (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null unique references public.activities (id) on delete cascade,
  source_activity_ids uuid[] not null,
  message text check (message is null or char_length(message) between 1 and 300),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.activity_callout_recipients (
  callout_id uuid not null references public.activity_callouts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz,
  primary key (callout_id, user_id)
);
create index activity_callout_recipients_user_idx on public.activity_callout_recipients (user_id, read_at);

create or replace function public._is_callout_recipient(p_callout uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.activity_callout_recipients
                 where callout_id = p_callout and user_id = auth.uid());
$$;

create or replace function public._can_manage_callout(p_callout uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.activity_callouts
                 where id = p_callout and public.can_manage_activity(activity_id));
$$;

alter table public.callout_mutes enable row level security;
alter table public.activity_callouts enable row level security;
alter table public.activity_callout_recipients enable row level security;
create policy callout_mutes_read on public.callout_mutes for select using (user_id = auth.uid());
create policy activity_callouts_read on public.activity_callouts for select
  using (public.can_manage_activity(activity_id) or public._is_callout_recipient(id));
create policy activity_callout_recipients_read on public.activity_callout_recipients for select
  using (user_id = auth.uid() or public._can_manage_callout(callout_id));
revoke insert, update, delete on public.callout_mutes, public.activity_callouts,
  public.activity_callout_recipients from anon, authenticated;

-- 다시 부르기. 보낸 사람 수를 돌려준다.
create or replace function public.callout_send(p_activity uuid, p_sources uuid[], p_message text default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_act public.activities;
  v_message text := nullif(trim(coalesce(p_message, '')), '');
  v_sources uuid[];
  v_id uuid;
  v_count integer;
begin
  if not public.can_manage_activity(p_activity) then raise exception 'forbidden'; end if;
  select * into v_act from public.activities where id = p_activity;
  if v_act.series_id is not null then raise exception 'session_notice'; end if;
  if v_act.status not in ('open', 'in_progress') then raise exception 'not_open'; end if;
  if exists (select 1 from public.activity_callouts where activity_id = p_activity) then
    raise exception 'callout_exists';
  end if;
  if char_length(coalesce(v_message, '')) > 300 then raise exception 'too_long'; end if;
  select array_agg(distinct s) into v_sources from unnest(coalesce(p_sources, '{}')) s
    where s <> p_activity;
  if v_sources is null then raise exception 'source_required'; end if;
  if exists (select 1 from unnest(v_sources) s
             where not public.can_manage_activity(s)
                or exists (select 1 from public.activities a where a.id = s and a.series_id is not null)) then
    raise exception 'forbidden';
  end if;

  create temporary table _to on commit drop as
    select distinct p.user_id
    from public.participations p
    join public.profiles pr on pr.id = p.user_id
    where p.activity_id = any (v_sources) and p.status = 'confirmed'
      and p.user_id <> v_uid
      and pr.accept_host_callouts and pr.status = 'active'
      and not exists (select 1 from public.callout_mutes m
                      where m.user_id = p.user_id and m.host_user_id = v_uid)
      and not exists (select 1 from public.participations q
                      where q.activity_id = p_activity and q.user_id = p.user_id and q.status <> 'cancelled');
  select count(*) into v_count from _to;
  if v_count = 0 then raise exception 'no_recipients'; end if;

  insert into public.activity_callouts (activity_id, source_activity_ids, message, created_by)
  values (p_activity, v_sources, v_message, v_uid)
  returning id into v_id;
  insert into public.activity_callout_recipients (callout_id, user_id) select v_id, user_id from _to;

  perform public._write_audit('callout.sent', p_activity, null,
    jsonb_build_object('sources', v_sources, 'recipients', v_count));
  return v_count;
end;
$$;

-- 받은 소식(나 화면). 보낸 호스트 · 활동과 함께, 최근 순.
create or replace function public.my_callouts()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id, 'message', c.message, 'created_at', c.created_at, 'read', r.read_at is not null,
    'host_id', c.created_by, 'host', pr.nickname::text,
    'activity', jsonb_build_object('slug', a.slug, 'title', a.title, 'kind', a.kind,
      'starts_at', a.starts_at, 'status', a.status)
  ) order by c.created_at desc), '[]'::jsonb)
  from public.activity_callout_recipients r
  join public.activity_callouts c on c.id = r.callout_id
  join public.activities a on a.id = c.activity_id
  join public.profiles pr on pr.id = c.created_by
  where r.user_id = auth.uid()
    and a.status <> 'cancelled' -- 취소된 활동의 소식은 내린다
    and not exists (select 1 from public.callout_mutes m
                    where m.user_id = auth.uid() and m.host_user_id = c.created_by);
$$;

create or replace function public.callout_mark_read()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then return 0; end if;
  update public.activity_callout_recipients set read_at = now()
  where user_id = auth.uid() and read_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.callout_settings_set(p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'auth_required'; end if;
  update public.profiles set accept_host_callouts = coalesce(p_accept, true) where id = auth.uid();
end;
$$;

create or replace function public.callout_mute_host(p_host uuid, p_mute boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'auth_required'; end if;
  if p_host is null or p_host = auth.uid() then raise exception 'not_found'; end if;
  if p_mute then
    insert into public.callout_mutes (user_id, host_user_id) values (auth.uid(), p_host)
    on conflict do nothing;
  else
    delete from public.callout_mutes where user_id = auth.uid() and host_user_id = p_host;
  end if;
end;
$$;

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
      max(coalesce(a.starts_at, p.created_at)) as last_at
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
  ) order by j.times desc, j.last_at desc), '[]'::jsonb)
  from joined j
  join public.profiles pr on pr.id = j.user_id
  left join att t on t.user_id = j.user_id;
$$;

revoke execute on function public._is_callout_recipient(uuid) from public, anon;
revoke execute on function public._can_manage_callout(uuid) from public, anon;
grant execute on function public._is_callout_recipient(uuid) to authenticated;
grant execute on function public._can_manage_callout(uuid) to authenticated;
revoke execute on function public.callout_send(uuid, uuid[], text) from public, anon;
revoke execute on function public.my_callouts() from public, anon;
revoke execute on function public.callout_mark_read() from public, anon;
revoke execute on function public.callout_settings_set(boolean) from public, anon;
revoke execute on function public.callout_mute_host(uuid, boolean) from public, anon;
revoke execute on function public.host_regulars() from public, anon;
grant execute on function public.callout_send(uuid, uuid[], text) to authenticated;
grant execute on function public.my_callouts() to authenticated;
grant execute on function public.callout_mark_read() to authenticated;
grant execute on function public.callout_settings_set(boolean) to authenticated;
grant execute on function public.callout_mute_host(uuid, boolean) to authenticated;
grant execute on function public.host_regulars() to authenticated;

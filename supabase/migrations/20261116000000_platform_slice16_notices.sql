-- 플랫폼 16단계: 참가자 공지(H10)
-- · 호스트가 확정자 · 대기자 · 입금 대기자 중 고른 사람들에게 공지를 남긴다. 받는 사람은 보낸 순간의 명단으로 정해 둔다
--   (나중에 상태가 바뀌어도 받은 공지는 그대로 남고, 새로 들어온 사람은 이전 공지를 받지 않는다).
-- · 받은 사람은 활동 화면에서 본다. 메일 · 푸시 발송은 알림 기능을 정한 뒤에 붙인다.
-- · 호스트는 공지를 내릴 수 있다(참가자에게서 숨김, 기록은 남김). 받은 사람 수와 읽은 사람 수를 본다.
-- · 시즌 회차에는 따로 남기지 않고 시즌에 남긴다(회차 참가자 = 시즌 참가자).

create table public.activity_notices (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  audience text[] not null
    check (audience <@ array['confirmed', 'waitlisted', 'pending_payment']::text[] and cardinality(audience) > 0),
  title text check (title is null or char_length(title) between 1 and 40),
  body text not null check (char_length(body) between 1 and 1000),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  withdrawn_by uuid references public.profiles (id)
);
create index activity_notices_activity_idx on public.activity_notices (activity_id, created_at desc);

create table public.activity_notice_recipients (
  notice_id uuid not null references public.activity_notices (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz,
  primary key (notice_id, user_id)
);
create index activity_notice_recipients_user_idx on public.activity_notice_recipients (user_id, read_at);

alter table public.activity_notices enable row level security;
alter table public.activity_notice_recipients enable row level security;

-- 두 표의 정책이 서로를 조회하면 재귀가 되어, 판정은 정책을 거치지 않는 함수로 한다.
create or replace function public._is_notice_recipient(p_notice uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.activity_notice_recipients
                 where notice_id = p_notice and user_id = auth.uid());
$$;

create or replace function public._can_manage_notice(p_notice uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.activity_notices
                 where id = p_notice and public.can_manage_activity(activity_id));
$$;

-- 관리하는 사람은 전부(내린 것 포함), 받은 사람은 내리지 않은 자기 공지만.
create policy activity_notices_read on public.activity_notices for select
  using (
    public.can_manage_activity(activity_id)
    or (withdrawn_at is null and public._is_notice_recipient(id))
  );
create policy activity_notice_recipients_read on public.activity_notice_recipients for select
  using (user_id = auth.uid() or public._can_manage_notice(notice_id));
revoke insert, update, delete on public.activity_notices, public.activity_notice_recipients
  from anon, authenticated;

create or replace function public.notice_post(
  p_activity uuid, p_audience text[], p_body text, p_title text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_body text := trim(coalesce(p_body, ''));
  v_title text := nullif(trim(coalesce(p_title, '')), '');
  v_audience text[];
  v_id uuid;
  v_count integer;
begin
  if not public.can_manage_activity(p_activity) then raise exception 'forbidden'; end if;
  if exists (select 1 from public.activities where id = p_activity and series_id is not null) then
    raise exception 'session_notice';
  end if;
  select array_agg(distinct a) into v_audience from unnest(coalesce(p_audience, '{}')) a
    where a in ('confirmed', 'waitlisted', 'pending_payment');
  if v_audience is null then raise exception 'audience_required'; end if;
  if v_body = '' then raise exception 'body_required'; end if;
  if char_length(v_body) > 1000 or char_length(coalesce(v_title, '')) > 40 then raise exception 'too_long'; end if;
  if not exists (select 1 from public.participations
                 where activity_id = p_activity and status = any (v_audience)) then
    raise exception 'no_recipients';
  end if;

  insert into public.activity_notices (activity_id, audience, title, body, created_by)
  values (p_activity, v_audience, v_title, v_body, auth.uid())
  returning id into v_id;
  insert into public.activity_notice_recipients (notice_id, user_id)
  select v_id, p.user_id from public.participations p
  where p.activity_id = p_activity and p.status = any (v_audience);
  get diagnostics v_count = row_count;

  perform public._write_audit('notice.posted', p_activity, null,
    jsonb_build_object('notice', v_id, 'audience', v_audience, 'recipients', v_count));
  return v_id;
end;
$$;

create or replace function public.notice_withdraw(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_activity uuid;
begin
  select activity_id into v_activity from public.activity_notices where id = p_id and withdrawn_at is null;
  if v_activity is null or not public.can_manage_activity(v_activity) then raise exception 'not_found'; end if;
  update public.activity_notices set withdrawn_at = now(), withdrawn_by = auth.uid() where id = p_id;
  perform public._write_audit('notice.withdrawn', v_activity, null, jsonb_build_object('notice', p_id));
end;
$$;

-- 활동 화면을 연 참가자의 그 활동 공지를 읽음으로.
create or replace function public.notice_mark_read(p_activity uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then return 0; end if;
  update public.activity_notice_recipients r set read_at = now()
  from public.activity_notices n
  where n.id = r.notice_id and n.activity_id = p_activity and n.withdrawn_at is null
    and r.user_id = auth.uid() and r.read_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public._is_notice_recipient(uuid) from public, anon;
revoke execute on function public._can_manage_notice(uuid) from public, anon;
grant execute on function public._is_notice_recipient(uuid) to authenticated;
grant execute on function public._can_manage_notice(uuid) to authenticated;
revoke execute on function public.notice_post(uuid, text[], text, text) from public, anon;
revoke execute on function public.notice_withdraw(uuid) from public, anon;
revoke execute on function public.notice_mark_read(uuid) from public, anon;
grant execute on function public.notice_post(uuid, text[], text, text) to authenticated;
grant execute on function public.notice_withdraw(uuid) to authenticated;
grant execute on function public.notice_mark_read(uuid) to authenticated;

-- 플랫폼 시험장 1단계: 계정 · 호스트 · 클럽 · 모임 · 신청/정원/대기 · 출석 · 운영 기록
-- 설계 정본: docs/architecture/platform-db-design.md (3~6절, 8~9절)
-- 원칙: 테이블에는 select 정책만 두고, 상태를 바꾸는 일은 security definer 함수로만 한다.

create extension if not exists citext with schema extensions;

-- ─────────────────────────────────────────────────────────── 공통
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────── 계정
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname extensions.citext not null unique,
  bio text,
  status text not null default 'active' check (status in ('active', 'suspended', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_staff (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner')),
  granted_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────── 호스트
create table public.hosts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  tier text not null check (tier in ('basic', 'paid')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  approved_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────── 클럽
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  join_mode text not null default 'open' check (join_mode in ('open', 'approval')),
  visibility text not null default 'public' check (visibility in ('public', 'members')),
  status text not null default 'active' check (status in ('active', 'archived', 'suspended')),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.club_layers (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  name text not null,
  rank smallint not null,
  kind text not null check (kind in ('admin', 'custom', 'member')),
  permissions text[] not null default '{}' check (
    permissions <@ array[
      'club.edit', 'space.manage', 'member.approve', 'member.ban', 'member.assign_layer',
      'invite.create', 'activity.create', 'notice.write', 'post.moderate',
      'participant.contact', 'participant.manage'
    ]::text[]
  ),
  unique (club_id, rank)
);

create table public.club_members (
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  layer_id uuid not null references public.club_layers (id),
  status text not null default 'active' check (status in ('pending', 'active', 'left', 'banned')),
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

-- ─────────────────────────────────────────────────────────── 활동
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('gathering', 'series', 'challenge')),
  series_id uuid references public.activities (id),
  session_no smallint,
  organizer_kind text not null check (organizer_kind in ('club', 'host', 'official')),
  club_id uuid references public.clubs (id),
  created_by uuid not null references public.profiles (id),
  slug text not null unique,
  title text not null,
  summary text,
  description text,
  visibility text not null default 'public' check (visibility in ('public', 'members')),
  audience text not null default 'anyone'
    check (audience in ('anyone', 'club_members', 'entitlement_holders')),
  required_activity_id uuid references public.activities (id),
  join_mode text not null default 'instant' check (join_mode in ('instant', 'approval')),
  apply_opens_at timestamptz,
  apply_closes_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer check (capacity is null or capacity > 0),
  min_participants integer,
  price integer not null default 0 check (price >= 0),
  payee_user_id uuid references public.profiles (id),
  status text not null default 'draft'
    check (status in ('draft', 'open', 'closed', 'in_progress', 'ended', 'cancelled')),
  cancelled_by uuid references public.profiles (id),
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (organizer_kind <> 'club' or club_id is not null),
  check (organizer_kind = 'club' or audience <> 'club_members'),
  check (ends_at is null or starts_at is null or ends_at >= starts_at),
  check (status = 'draft' or starts_at is not null),
  check (price = 0 or organizer_kind = 'official' or payee_user_id is not null)
);

create index activities_listing_idx on public.activities (status, starts_at);
create index activities_club_idx on public.activities (club_id);

create table public.gathering_details (
  activity_id uuid primary key references public.activities (id) on delete cascade,
  format text not null check (format in ('offline', 'online')),
  place_name text,
  area text,
  hide_address_until_confirmed boolean not null default true
);

-- 민감 정보: select 정책 없음. get_activity_private()로만 읽는다.
create table public.activity_private (
  activity_id uuid primary key references public.activities (id) on delete cascade,
  video_url text,
  address_detail text
);

create table public.activity_hosts (
  activity_id uuid not null references public.activities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'facilitator' check (role in ('facilitator')),
  primary key (activity_id, user_id)
);

create table public.participations (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (
    status in ('pending_approval', 'pending_payment', 'waitlisted', 'confirmed', 'cancelled')
  ),
  answers jsonb not null default '{}',
  waitlisted_at timestamptz,
  decided_by uuid references public.profiles (id),
  decided_at timestamptz,
  cancelled_by uuid references public.profiles (id),
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, user_id)
);

create table public.attendances (
  gathering_id uuid not null references public.activities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('attended', 'absent')),
  checked_by uuid not null references public.profiles (id),
  checked_at timestamptz not null default now(),
  primary key (gathering_id, user_id)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  activity_id uuid references public.activities (id) on delete set null,
  target_user_id uuid references public.profiles (id) on delete set null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger clubs_touch before update on public.clubs
  for each row execute function public.touch_updated_at();
create trigger activities_touch before update on public.activities
  for each row execute function public.touch_updated_at();
create trigger participations_touch before update on public.participations
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────── 권한 판정 함수
create or replace function public.has_platform_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  -- 지금은 소유자 하나. 소유자는 content · community · commerce · member_data 전부를 가진다.
  select exists (
    select 1 from public.platform_staff s
    where s.user_id = auth.uid() and s.role = 'owner'
      and p_permission in ('content', 'community', 'commerce', 'member_data')
  );
$$;

create or replace function public.is_club_member(p_club uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.club_members m
    where m.club_id = p_club and m.user_id = auth.uid() and m.status = 'active'
  );
$$;

create or replace function public.club_has_permission(p_club uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.club_members m
    join public.club_layers l on l.id = m.layer_id
    where m.club_id = p_club and m.user_id = auth.uid() and m.status = 'active'
      and (l.kind = 'admin' or p_permission = any (l.permissions))
  );
$$;

create or replace function public.can_manage_activity(p_activity uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.activities a
    where a.id = p_activity
      and (
        exists (
          select 1 from public.activity_hosts h
          where h.activity_id = a.id and h.user_id = auth.uid()
        )
        or (a.organizer_kind = 'host' and a.created_by = auth.uid())
        or (a.organizer_kind = 'club' and public.club_has_permission(a.club_id, 'participant.manage'))
        or (a.organizer_kind = 'official' and public.has_platform_permission('community'))
      )
  );
$$;

create or replace function public.can_read_activity(p_activity uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.activities a
    where a.id = p_activity
      and (
        (
          a.status <> 'draft'
          and (a.visibility = 'public' or (a.club_id is not null and public.is_club_member(a.club_id)))
        )
        or public.can_manage_activity(a.id)
      )
  );
$$;

-- ─────────────────────────────────────────────────────────── 읽기 정책 (RLS)
alter table public.profiles enable row level security;
alter table public.platform_staff enable row level security;
alter table public.hosts enable row level security;
alter table public.clubs enable row level security;
alter table public.club_layers enable row level security;
alter table public.club_members enable row level security;
alter table public.activities enable row level security;
alter table public.gathering_details enable row level security;
alter table public.activity_private enable row level security;
alter table public.activity_hosts enable row level security;
alter table public.participations enable row level security;
alter table public.attendances enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_read on public.profiles for select using (true);
create policy staff_read_self on public.platform_staff for select using (user_id = auth.uid());
create policy hosts_read on public.hosts for select using (true);

create policy clubs_read on public.clubs for select
  using ((status = 'active' and visibility = 'public') or public.is_club_member(id));
create policy club_layers_read on public.club_layers for select
  using (exists (select 1 from public.clubs c where c.id = club_id));
create policy club_members_read on public.club_members for select
  using (exists (select 1 from public.clubs c where c.id = club_id));

create policy activities_read on public.activities for select
  using (public.can_read_activity(id));
create policy gathering_details_read on public.gathering_details for select
  using (public.can_read_activity(activity_id));
create policy activity_hosts_read on public.activity_hosts for select
  using (public.can_read_activity(activity_id));

create policy participations_read on public.participations for select
  using (user_id = auth.uid() or public.can_manage_activity(activity_id));
create policy attendances_read on public.attendances for select
  using (user_id = auth.uid() or public.can_manage_activity(gathering_id));
create policy audit_logs_read on public.audit_logs for select
  using (public.has_platform_permission('member_data'));

-- 쓰기는 함수로만. 직접 쓰기 권한을 거둔다.
revoke insert, update, delete on all tables in schema public from anon, authenticated;

-- ─────────────────────────────────────────────────────────── 명령 함수
create or replace function public._write_audit(
  p_action text, p_activity uuid, p_target uuid, p_detail jsonb default '{}'
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs (actor_id, action, activity_id, target_user_id, detail)
  values (auth.uid(), p_action, p_activity, p_target, coalesce(p_detail, '{}'));
$$;

-- 확정 + 입금 대기를 정원에 센다(설계 6절 기본값). 호출 전에 활동 행이 잠겨 있어야 한다.
create or replace function public._seats_taken(p_activity uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.participations p
  where p.activity_id = p_activity and p.status in ('confirmed', 'pending_payment');
$$;

create or replace function public._promote_waitlist(p_activity uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_capacity integer;
  v_next public.participations;
begin
  select capacity into v_capacity from public.activities where id = p_activity;
  loop
    exit when v_capacity is not null and public._seats_taken(p_activity) >= v_capacity;
    select * into v_next from public.participations
      where activity_id = p_activity and status = 'waitlisted'
      order by waitlisted_at, created_at
      limit 1
      for update;
    exit when not found;
    update public.participations
      set status = 'confirmed', waitlisted_at = null, decided_at = now()
      where id = v_next.id;
    perform public._write_audit('participation.promoted', p_activity, v_next.user_id);
  end loop;
end;
$$;

create or replace function public.participation_apply(p_activity uuid, p_answers jsonb default '{}')
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_act public.activities;
  v_existing public.participations;
  v_status text;
begin
  if v_uid is null then raise exception 'auth_required'; end if;
  if not exists (select 1 from public.profiles where id = v_uid and status = 'active') then
    raise exception 'account_inactive';
  end if;

  -- 정원 판정을 직렬화하기 위해 활동 행을 잠근다.
  select * into v_act from public.activities where id = p_activity for update;
  if not found or not public.can_read_activity(p_activity) then raise exception 'not_found'; end if;
  if v_act.series_id is not null then raise exception 'session_has_no_own_apply'; end if;
  if v_act.status <> 'open' then raise exception 'not_open'; end if;
  if v_act.apply_opens_at is not null and now() < v_act.apply_opens_at then raise exception 'not_open_yet'; end if;
  if v_act.apply_closes_at is not null and now() > v_act.apply_closes_at then raise exception 'apply_closed'; end if;
  if v_act.audience = 'club_members' and not public.is_club_member(v_act.club_id) then
    raise exception 'members_only';
  end if;
  if v_act.audience = 'entitlement_holders' then raise exception 'not_supported_yet'; end if;
  if v_act.price > 0 then raise exception 'paid_not_supported_yet'; end if;

  select * into v_existing from public.participations
    where activity_id = p_activity and user_id = v_uid for update;
  if found and v_existing.status <> 'cancelled' then raise exception 'already_applied'; end if;

  if v_act.join_mode = 'approval' then
    v_status := 'pending_approval';
  elsif v_act.capacity is null or public._seats_taken(p_activity) < v_act.capacity then
    v_status := 'confirmed';
  else
    v_status := 'waitlisted';
  end if;

  if found then
    update public.participations
      set status = v_status, answers = coalesce(p_answers, '{}'),
          waitlisted_at = case when v_status = 'waitlisted' then now() end,
          decided_by = null, decided_at = null, cancelled_by = null, cancel_reason = null
      where id = v_existing.id;
  else
    insert into public.participations (activity_id, user_id, status, answers, waitlisted_at)
    values (p_activity, v_uid, v_status, coalesce(p_answers, '{}'),
            case when v_status = 'waitlisted' then now() end);
  end if;

  perform public._write_audit('participation.applied', p_activity, v_uid, jsonb_build_object('status', v_status));
  return v_status;
end;
$$;

create or replace function public.participation_cancel(p_activity uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_part public.participations;
begin
  if v_uid is null then raise exception 'auth_required'; end if;
  perform 1 from public.activities where id = p_activity for update;
  select * into v_part from public.participations
    where activity_id = p_activity and user_id = v_uid for update;
  if not found or v_part.status = 'cancelled' then raise exception 'not_applied'; end if;
  if exists (
    select 1 from public.activities where id = p_activity and status in ('ended', 'cancelled')
  ) then
    raise exception 'activity_finished';
  end if;

  update public.participations
    set status = 'cancelled', cancelled_by = v_uid, cancel_reason = 'self', waitlisted_at = null
    where id = v_part.id;
  perform public._write_audit('participation.cancelled', p_activity, v_uid,
    jsonb_build_object('from', v_part.status));

  if v_part.status in ('confirmed', 'pending_payment') then
    perform public._promote_waitlist(p_activity);
  end if;
end;
$$;

create or replace function public.participation_decide(
  p_participation uuid, p_approve boolean, p_reason text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_part public.participations;
  v_act public.activities;
  v_status text;
begin
  select * into v_part from public.participations where id = p_participation;
  if not found then raise exception 'not_found'; end if;
  if not public.can_manage_activity(v_part.activity_id) then raise exception 'forbidden'; end if;

  select * into v_act from public.activities where id = v_part.activity_id for update;
  select * into v_part from public.participations where id = p_participation for update;
  if v_part.status <> 'pending_approval' then raise exception 'not_pending'; end if;

  if not p_approve then
    v_status := 'cancelled';
    update public.participations
      set status = v_status, decided_by = v_uid, decided_at = now(),
          cancelled_by = v_uid, cancel_reason = coalesce(nullif(p_reason, ''), 'rejected')
      where id = v_part.id;
  else
    if v_act.capacity is null or public._seats_taken(v_act.id) < v_act.capacity then
      v_status := 'confirmed';
    else
      v_status := 'waitlisted';
    end if;
    update public.participations
      set status = v_status, decided_by = v_uid, decided_at = now(),
          waitlisted_at = case when v_status = 'waitlisted' then now() end
      where id = v_part.id;
  end if;

  perform public._write_audit(
    case when p_approve then 'participation.approved' else 'participation.rejected' end,
    v_act.id, v_part.user_id, jsonb_build_object('status', v_status));
  return v_status;
end;
$$;

-- 출석은 시작 1시간 전부터 체크할 수 있다. 확정 참가자만 대상이다.
create or replace function public.attendance_mark(p_activity uuid, p_user uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_act public.activities;
begin
  if not public.can_manage_activity(p_activity) then raise exception 'forbidden'; end if;
  if p_status not in ('attended', 'absent') then raise exception 'invalid_status'; end if;
  select * into v_act from public.activities where id = p_activity;
  if v_act.kind <> 'gathering' then raise exception 'not_gathering'; end if;
  if now() < v_act.starts_at - interval '1 hour' then raise exception 'too_early_to_check'; end if;
  if not exists (
    select 1 from public.participations
    where activity_id = p_activity and user_id = p_user and status = 'confirmed'
  ) then
    raise exception 'not_confirmed';
  end if;

  insert into public.attendances (gathering_id, user_id, status, checked_by)
  values (p_activity, p_user, p_status, auth.uid())
  on conflict (gathering_id, user_id)
    do update set status = excluded.status, checked_by = excluded.checked_by, checked_at = now();
  perform public._write_audit('attendance.marked', p_activity, p_user, jsonb_build_object('status', p_status));
end;
$$;

-- 민감 정보 열람. 진행자는 항상, 확정 참가자는 주소는 바로 · 화상 링크는 시작 30분 전부터.
-- 자기 활동의 장소·링크는 회원 개인정보가 아니므로 열람 기록을 남기지 않는다(연락처 열람은 기록 대상).
create or replace function public.get_activity_private(p_activity uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_act public.activities;
  v_priv public.activity_private;
  v_manager boolean;
  v_confirmed boolean;
  v_link_open boolean;
begin
  if auth.uid() is null or not public.can_read_activity(p_activity) then
    return jsonb_build_object('access', 'none');
  end if;
  select * into v_act from public.activities where id = p_activity;
  select * into v_priv from public.activity_private where activity_id = p_activity;
  v_manager := public.can_manage_activity(p_activity);
  v_confirmed := exists (
    select 1 from public.participations
    where activity_id = p_activity and user_id = auth.uid() and status = 'confirmed'
  );
  if not v_manager and not v_confirmed then
    return jsonb_build_object('access', 'none');
  end if;
  v_link_open := v_manager or now() >= v_act.starts_at - interval '30 minutes';

  return jsonb_build_object(
    'access', case when v_manager then 'manager' else 'participant' end,
    'address_detail', v_priv.address_detail,
    'video_url', case when v_link_open then v_priv.video_url end,
    'video_opens_at', v_act.starts_at - interval '30 minutes'
  );
end;
$$;

-- 공개 집계: 누구나 남은 자리를 볼 수 있다(명단은 보이지 않는다).
create or replace function public.activity_seat_counts(p_ids uuid[])
returns table (activity_id uuid, taken integer, waitlisted integer, pending integer)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id,
    count(*) filter (where p.status in ('confirmed', 'pending_payment'))::integer,
    count(*) filter (where p.status = 'waitlisted')::integer,
    count(*) filter (where p.status = 'pending_approval')::integer
  from public.activities a
  left join public.participations p on p.activity_id = a.id
  where a.id = any (p_ids) and public.can_read_activity(a.id)
  group by a.id;
$$;

revoke execute on function public._write_audit(text, uuid, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public._seats_taken(uuid) from public, anon, authenticated;
revoke execute on function public._promote_waitlist(uuid) from public, anon, authenticated;
revoke execute on function public.participation_apply(uuid, jsonb) from public, anon;
revoke execute on function public.participation_cancel(uuid) from public, anon;
revoke execute on function public.participation_decide(uuid, boolean, text) from public, anon;
revoke execute on function public.attendance_mark(uuid, uuid, text) from public, anon;

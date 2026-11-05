-- 플랫폼 시험장 5단계: 활동 만들기와 공개
-- 누가 무엇을 열 수 있나 (명세 2·3·5절, 설계 6절):
--   클럽 주최: 클럽 레이어의 activity.create 권한. 호스트 자격은 필요 없다.
--              유료면 정산 대상은 클럽의 활성 멤버 중 유료 호스트여야 한다(활동마다 정한다).
--   개인 주최: 활성 호스트. 기본 호스트는 무료 모임·챌린지만, 유료이거나 시즌이면 유료 호스트.
--              정산 대상은 본인.
--   공식 주최: 플랫폼 운영진(community). 정산 대상 없음.
-- 만들면 초안(draft)이고, 만든 사람은 진행자로 들어간다. 공개(activity_publish)해야 목록에 보인다.

create or replace function public.activity_create(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_kind text := p ->> 'kind';
  v_org text := p ->> 'organizer';
  v_club uuid := nullif(p ->> 'club_id', '')::uuid;
  v_price integer := coalesce(nullif(p ->> 'price', '')::integer, 0);
  v_capacity integer := nullif(p ->> 'capacity', '')::integer;
  v_audience text := coalesce(nullif(p ->> 'audience', ''), 'anyone');
  v_required uuid := nullif(p ->> 'required_activity_id', '')::uuid;
  v_payee uuid;
  v_host_tier text;
  v_id uuid;
  v_slug text := 'a-' || substr(md5(gen_random_uuid()::text), 1, 10);
  v_starts timestamptz;
  v_ends timestamptz;
  v_on date;
  v_off date;
  v_count integer;
  v_gap integer;
  v_minutes integer;
  v_session uuid;
  i integer;
begin
  if v_uid is null then raise exception 'auth_required'; end if;
  if v_kind not in ('gathering', 'series', 'challenge') then raise exception 'invalid_kind'; end if;
  if coalesce(trim(p ->> 'title'), '') = '' then raise exception 'title_required'; end if;
  if v_price < 0 then raise exception 'invalid_price'; end if;
  if v_capacity is not null and v_capacity <= 0 then raise exception 'invalid_capacity'; end if;
  select tier into v_host_tier from public.hosts where user_id = v_uid and status = 'active';

  -- ── 누가 열 수 있나
  if v_org = 'club' then
    if v_club is null or not exists (select 1 from public.clubs where id = v_club and status = 'active') then
      raise exception 'not_found';
    end if;
    if not public.club_has_permission(v_club, 'activity.create') then raise exception 'no_create_permission'; end if;
    if v_price > 0 then
      v_payee := coalesce(nullif(p ->> 'payee_user_id', '')::uuid, v_uid);
      if not exists (
        select 1 from public.club_members m join public.hosts h on h.user_id = m.user_id
        where m.club_id = v_club and m.user_id = v_payee and m.status = 'active'
          and h.status = 'active' and h.tier = 'paid'
      ) then
        raise exception 'payee_not_paid_host';
      end if;
    end if;
  elsif v_org = 'host' then
    if v_host_tier is null then raise exception 'host_required'; end if;
    if (v_price > 0 or v_kind = 'series') and v_host_tier <> 'paid' then raise exception 'paid_host_required'; end if;
    v_club := null;
    if v_price > 0 then v_payee := v_uid; end if;
  elsif v_org = 'official' then
    if not public.has_platform_permission('community') then raise exception 'forbidden'; end if;
    v_club := null;
  else
    raise exception 'invalid_organizer';
  end if;

  -- ── 대상
  if v_audience = 'club_members' and v_org <> 'club' then raise exception 'members_only_needs_club'; end if;
  if v_audience = 'entitlement_holders' then
    if v_required is null or not public.can_read_activity(v_required) then raise exception 'required_activity_missing'; end if;
  else
    v_required := null;
  end if;

  -- ── 일정 검사 (종류별)
  if v_kind = 'gathering' then
    v_starts := (p ->> 'starts_at')::timestamptz;
    v_ends := nullif(p ->> 'ends_at', '')::timestamptz;
    if v_starts is null then raise exception 'schedule_required'; end if;
    if v_starts < now() then raise exception 'starts_in_past'; end if;
    if v_ends is not null and v_ends < v_starts then raise exception 'ends_before_start'; end if;
  elsif v_kind = 'challenge' then
    v_on := (p ->> 'starts_on')::date;
    v_off := (p ->> 'ends_on')::date;
    if v_on is null or v_off is null then raise exception 'schedule_required'; end if;
    if v_on < public._kst_today() then raise exception 'starts_in_past'; end if;
    if v_off < v_on then raise exception 'ends_before_start'; end if;
    if coalesce((p ->> 'completion_threshold')::integer, 0) <= 0 then raise exception 'invalid_threshold'; end if;
    if (p ->> 'completion_threshold')::integer > v_off - v_on + 1 and coalesce(p ->> 'cert_rule', 'daily') = 'daily' then
      raise exception 'threshold_over_days';
    end if;
  else
    v_starts := (p ->> 'first_starts_at')::timestamptz;
    v_count := coalesce((p ->> 'session_count')::integer, 0);
    v_gap := coalesce((p ->> 'interval_days')::integer, 7);
    v_minutes := coalesce((p ->> 'duration_minutes')::integer, 120);
    if v_starts is null then raise exception 'schedule_required'; end if;
    if v_starts < now() then raise exception 'starts_in_past'; end if;
    if v_count not between 2 and 12 then raise exception 'invalid_session_count'; end if;
    if v_gap < 1 or v_minutes < 10 then raise exception 'invalid_session_gap'; end if;
  end if;

  -- ── 만들기
  insert into public.activities (id, kind, organizer_kind, club_id, created_by, slug, title, summary,
    visibility, audience, required_activity_id, join_mode, allow_late_join, capacity, price,
    payee_user_id, starts_at, ends_at, status)
  values (gen_random_uuid(), v_kind, v_org, v_club, v_uid, v_slug, trim(p ->> 'title'),
    nullif(trim(p ->> 'summary'), ''), 'public', v_audience, v_required,
    case when p ->> 'join_mode' = 'approval' then 'approval' else 'instant' end,
    coalesce((p ->> 'allow_late_join')::boolean, false), v_capacity, v_price, v_payee,
    case when v_kind = 'gathering' then v_starts end,
    case when v_kind = 'gathering' then v_ends end,
    'draft')
  returning id into v_id;

  insert into public.activity_hosts (activity_id, user_id) values (v_id, v_uid);

  if v_kind = 'gathering' then
    insert into public.gathering_details (activity_id, format, place_name, area, hide_address_until_confirmed)
    values (v_id, case when p ->> 'format' = 'online' then 'online' else 'offline' end,
      nullif(trim(p ->> 'place_name'), ''), nullif(trim(p ->> 'area'), ''), true);
    insert into public.activity_private (activity_id, video_url, address_detail)
    values (v_id, nullif(trim(p ->> 'video_url'), ''), nullif(trim(p ->> 'address_detail'), ''));
  elsif v_kind = 'challenge' then
    insert into public.challenge_details (activity_id, starts_on, ends_on, cert_rule, cert_n, cert_formats,
      completion_threshold)
    values (v_id, v_on, v_off, coalesce(nullif(p ->> 'cert_rule', ''), 'daily'),
      nullif(p ->> 'cert_n', '')::integer,
      coalesce((select array_agg(x) from jsonb_array_elements_text(p -> 'cert_formats') x), array['text']),
      (p ->> 'completion_threshold')::integer);
    if coalesce(trim(p ->> 'mission'), '') <> '' then
      insert into public.challenge_missions (activity_id, day_no, title) values (v_id, null, trim(p ->> 'mission'));
    end if;
  else
    -- 회차는 시즌의 주최·진행자를 그대로 따른다. 정원·가격은 시즌에만 있다.
    for i in 1..v_count loop
      insert into public.activities (kind, series_id, session_no, organizer_kind, club_id, created_by, slug,
        title, join_mode, starts_at, ends_at, status)
      values ('gathering', v_id, i, v_org, v_club, v_uid, v_slug || '-' || i,
        trim(p ->> 'title') || ' ' || i || '회차', 'instant',
        v_starts + make_interval(days => v_gap * (i - 1)),
        v_starts + make_interval(days => v_gap * (i - 1), mins => v_minutes),
        'draft')
      returning id into v_session;
      insert into public.gathering_details (activity_id, format, place_name, area)
      values (v_session, case when p ->> 'format' = 'online' then 'online' else 'offline' end,
        nullif(trim(p ->> 'place_name'), ''), nullif(trim(p ->> 'area'), ''));
      insert into public.activity_private (activity_id, video_url, address_detail)
      values (v_session, nullif(trim(p ->> 'video_url'), ''), nullif(trim(p ->> 'address_detail'), ''));
    end loop;
  end if;

  perform public._write_audit('activity.created', v_id, null,
    jsonb_build_object('kind', v_kind, 'organizer', v_org, 'price', v_price, 'payee', v_payee));
  return v_id;
end;
$$;

-- 초안을 공개한다. 시즌은 회차도 함께, 이미 시작일이 지난 챌린지는 바로 진행 중으로.
create or replace function public.activity_publish(p_activity uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_act public.activities;
  v_status text := 'open';
begin
  if not public.can_manage_activity(p_activity) then raise exception 'forbidden'; end if;
  select * into v_act from public.activities where id = p_activity for update;
  if v_act.status <> 'draft' then raise exception 'not_draft'; end if;
  if v_act.series_id is not null then raise exception 'session_has_no_own_apply'; end if;
  if v_act.kind = 'series' then
    if not exists (select 1 from public.activities where series_id = p_activity) then
      raise exception 'schedule_required';
    end if;
    update public.activities set status = 'open' where series_id = p_activity and status = 'draft';
  end if;
  if v_act.kind = 'challenge' and exists (
    select 1 from public.challenge_details where activity_id = p_activity and starts_on <= public._kst_today()
  ) then
    v_status := 'in_progress';
  end if;
  update public.activities set status = v_status where id = p_activity;
  perform public._write_audit('activity.published', p_activity, null, jsonb_build_object('status', v_status));
  return v_status;
end;
$$;

-- 만들기 화면용: 이 사람이 고를 수 있는 주최와 정산 대상 후보
create or replace function public.activity_create_options()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'host_tier', (select tier from public.hosts where user_id = auth.uid() and status = 'active'),
    'official', public.has_platform_permission('community'),
    'clubs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name,
        'paid_hosts', coalesce((
          select jsonb_agg(jsonb_build_object('id', pr.id, 'nickname', pr.nickname))
          from public.club_members m2
          join public.hosts h on h.user_id = m2.user_id and h.status = 'active' and h.tier = 'paid'
          join public.profiles pr on pr.id = m2.user_id
          where m2.club_id = c.id and m2.status = 'active'
        ), '[]'::jsonb)
      ) order by c.name)
      from public.clubs c
      where c.status = 'active' and public.club_has_permission(c.id, 'activity.create')
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.activity_create(jsonb) from public, anon;
revoke execute on function public.activity_publish(uuid) from public, anon;
revoke execute on function public.activity_create_options() from public, anon;

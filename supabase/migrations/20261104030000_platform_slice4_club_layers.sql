-- 플랫폼 시험장 4단계: 클럽 가입과 레이어 권한
-- 설계 정본: docs/architecture/platform-db-design.md 5절, 명세 3절.
-- 안전 규칙(모두 DB 함수 안에서 검사한다):
--   자기보다 아래 레이어만 관리한다 · 자기가 가진 권한만 남에게 준다 · 마지막 관리자는 양도 없이 나갈 수 없다
--   레이어를 지우면 그 사람들은 멤버로 내려간다 · 레이어는 최대 6개 · 강퇴하면 재가입을 막는다

create table public.club_invites (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  code text not null unique default encode(extensions.gen_random_bytes(6), 'hex'),
  created_by uuid not null references public.profiles (id),
  expires_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.club_members
  add column invite_id uuid references public.club_invites (id),
  add column decided_by uuid references public.profiles (id),
  add column decided_at timestamptz;

alter table public.audit_logs add column club_id uuid references public.clubs (id) on delete set null;

-- 대기·강퇴 행은 본인과 가입 승인 권한자만 본다. 활성 멤버 명단은 클럽을 볼 수 있으면 보인다.
drop policy club_members_read on public.club_members;
create policy club_members_read on public.club_members for select
  using (
    exists (select 1 from public.clubs c where c.id = club_id)
    and (
      status = 'active' or user_id = auth.uid()
      or public.club_has_permission(club_id, 'member.approve')
    )
  );

alter table public.club_invites enable row level security;
create policy club_invites_read on public.club_invites for select
  using (public.club_has_permission(club_id, 'invite.create'));

revoke insert, update, delete on all tables in schema public from anon, authenticated;

-- ─────────────────────────────────────────────────────────── 도우미
create or replace function public._club_audit(p_action text, p_club uuid, p_target uuid, p_detail jsonb default '{}')
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs (actor_id, action, club_id, target_user_id, detail)
  values (auth.uid(), p_action, p_club, p_target, coalesce(p_detail, '{}'));
$$;

-- 지금 사용자의 이 클럽 레이어 (활성 멤버가 아니면 null)
create or replace function public._my_club_layer(p_club uuid)
returns public.club_layers
language sql
stable
security definer
set search_path = ''
as $$
  select l.* from public.club_members m
  join public.club_layers l on l.id = m.layer_id
  where m.club_id = p_club and m.user_id = auth.uid() and m.status = 'active';
$$;

-- 이 레이어가 가진 권한 목록. 관리자는 전부.
create or replace function public._layer_permissions(p_layer public.club_layers)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select case when p_layer.kind = 'admin' then array[
    'club.edit', 'space.manage', 'member.approve', 'member.ban', 'member.assign_layer',
    'invite.create', 'activity.create', 'notice.write', 'post.moderate',
    'participant.contact', 'participant.manage'
  ]::text[] else p_layer.permissions end;
$$;

-- 화면용: 내 레이어와 권한
create or replace function public.club_my_role(p_club uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_layer public.club_layers;
  v_status text;
begin
  select status into v_status from public.club_members where club_id = p_club and user_id = auth.uid();
  v_layer := public._my_club_layer(p_club);
  return jsonb_build_object(
    'status', v_status,
    'layer_id', v_layer.id, 'layer_name', v_layer.name, 'rank', v_layer.rank, 'kind', v_layer.kind,
    'permissions', coalesce(to_jsonb(public._layer_permissions(v_layer)), '[]'::jsonb)
  );
end;
$$;

-- ─────────────────────────────────────────────────────────── 클럽 만들기 · 가입 · 탈퇴
create or replace function public.club_create(p_slug text, p_name text, p_tagline text, p_join_mode text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_club uuid;
  v_admin uuid;
begin
  if not exists (select 1 from public.hosts where user_id = auth.uid() and status = 'active') then
    raise exception 'host_required';
  end if;
  if p_slug !~ '^[a-z0-9][a-z0-9-]{2,40}$' then raise exception 'invalid_slug'; end if;
  if exists (select 1 from public.clubs where slug = p_slug) then raise exception 'slug_taken'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'name_required'; end if;

  insert into public.clubs (slug, name, tagline, join_mode, created_by)
  values (p_slug, trim(p_name), nullif(trim(p_tagline), ''), coalesce(p_join_mode, 'open'), auth.uid())
  returning id into v_club;
  insert into public.club_layers (club_id, name, rank, kind, permissions) values
    (v_club, '관리자', 0, 'admin', '{}') returning id into v_admin;
  insert into public.club_layers (club_id, name, rank, kind, permissions) values
    (v_club, '운영진', 1, 'custom', array['notice.write', 'activity.create', 'participant.manage', 'member.approve']),
    (v_club, '멤버', 9, 'member', '{}');
  insert into public.club_members (club_id, user_id, layer_id) values (v_club, auth.uid(), v_admin);
  perform public._club_audit('club.created', v_club, auth.uid());
  return v_club;
end;
$$;

create or replace function public._club_admit(p_club uuid, p_status text, p_invite uuid default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_layer uuid;
  v_existing public.club_members;
begin
  if auth.uid() is null then raise exception 'auth_required'; end if;
  if not exists (select 1 from public.clubs where id = p_club and status = 'active') then
    raise exception 'not_found';
  end if;
  select id into v_member_layer from public.club_layers where club_id = p_club and kind = 'member';
  select * into v_existing from public.club_members where club_id = p_club and user_id = auth.uid() for update;
  if found then
    if v_existing.status = 'banned' then raise exception 'banned'; end if;
    if v_existing.status in ('active', 'pending') then raise exception 'already_member'; end if;
    update public.club_members
      set status = p_status, layer_id = v_member_layer, joined_at = now(), invite_id = p_invite,
          decided_by = null, decided_at = null
      where club_id = p_club and user_id = auth.uid();
  else
    insert into public.club_members (club_id, user_id, layer_id, status, invite_id)
    values (p_club, auth.uid(), v_member_layer, p_status, p_invite);
  end if;
  perform public._club_audit(case when p_status = 'active' then 'club.joined' else 'club.join_requested' end,
    p_club, auth.uid(), jsonb_build_object('invite', p_invite is not null));
  return p_status;
end;
$$;

create or replace function public.club_join(p_club uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mode text;
begin
  select join_mode into v_mode from public.clubs where id = p_club;
  return public._club_admit(p_club, case when v_mode = 'approval' then 'pending' else 'active' end);
end;
$$;

-- 초대 링크로 들어오면 승인 방식이어도 바로 가입된다.
create or replace function public.club_join_by_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.club_invites;
begin
  select * into v_inv from public.club_invites where code = p_code for update;
  if not found or v_inv.revoked_at is not null
    or (v_inv.expires_at is not null and v_inv.expires_at < now())
    or (v_inv.max_uses is not null and v_inv.used_count >= v_inv.max_uses) then
    raise exception 'invite_invalid';
  end if;
  perform public._club_admit(v_inv.club_id, 'active', v_inv.id);
  update public.club_invites set used_count = used_count + 1 where id = v_inv.id;
  return v_inv.club_id;
end;
$$;

create or replace function public.club_invite_create(p_club uuid, p_max_uses integer default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  if not public.club_has_permission(p_club, 'invite.create') then raise exception 'forbidden'; end if;
  insert into public.club_invites (club_id, created_by, max_uses, expires_at)
  values (p_club, auth.uid(), p_max_uses, now() + interval '7 days')
  returning code into v_code;
  perform public._club_audit('club.invite_created', p_club, null, jsonb_build_object('max_uses', p_max_uses));
  return v_code;
end;
$$;

create or replace function public.club_leave(p_club uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_layer public.club_layers := public._my_club_layer(p_club);
begin
  if v_layer.id is null then raise exception 'not_member'; end if;
  if v_layer.kind = 'admin' and (
    select count(*) from public.club_members
    where club_id = p_club and layer_id = v_layer.id and status = 'active'
  ) = 1 then
    raise exception 'last_admin';
  end if;
  update public.club_members set status = 'left' where club_id = p_club and user_id = auth.uid();
  perform public._club_audit('club.left', p_club, auth.uid());
end;
$$;

-- ─────────────────────────────────────────────────────────── 멤버 관리
create or replace function public.club_member_decide(p_club uuid, p_user uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.club_has_permission(p_club, 'member.approve') then raise exception 'forbidden'; end if;
  update public.club_members
    set status = case when p_approve then 'active' else 'left' end,
        decided_by = auth.uid(), decided_at = now(), joined_at = now()
    where club_id = p_club and user_id = p_user and status = 'pending';
  if not found then raise exception 'not_pending'; end if;
  perform public._club_audit(case when p_approve then 'club.member_approved' else 'club.member_rejected' end,
    p_club, p_user);
end;
$$;

-- 레이어 지정. 관리자가 아니면: 대상의 지금 레이어와 새 레이어가 모두 나보다 아래여야 하고,
-- 새 레이어의 권한이 내 권한 안에 있어야 한다.
create or replace function public.club_assign_layer(p_club uuid, p_user uuid, p_layer uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me public.club_layers := public._my_club_layer(p_club);
  v_cur public.club_layers;
  v_new public.club_layers;
begin
  if v_me.id is null or not ('member.assign_layer' = any (public._layer_permissions(v_me))) then
    raise exception 'forbidden';
  end if;
  select l.* into v_cur from public.club_members m join public.club_layers l on l.id = m.layer_id
    where m.club_id = p_club and m.user_id = p_user and m.status = 'active' for update of m;
  if not found then raise exception 'not_member'; end if;
  select * into v_new from public.club_layers where id = p_layer and club_id = p_club;
  if not found then raise exception 'not_found'; end if;

  if v_me.kind <> 'admin' then
    if v_cur.rank <= v_me.rank then raise exception 'cannot_manage_higher'; end if;
    if v_new.rank <= v_me.rank then raise exception 'cannot_assign_higher'; end if;
    if not (v_new.permissions <@ v_me.permissions) then raise exception 'cannot_grant_unowned'; end if;
  end if;
  -- 관리자를 다른 레이어로 내릴 때 관리자가 한 명은 남아야 한다.
  if v_cur.kind = 'admin' and v_new.kind <> 'admin' and (
    select count(*) from public.club_members
    where club_id = p_club and layer_id = v_cur.id and status = 'active'
  ) = 1 then
    raise exception 'last_admin';
  end if;

  update public.club_members set layer_id = p_layer where club_id = p_club and user_id = p_user;
  perform public._club_audit('club.layer_assigned', p_club, p_user,
    jsonb_build_object('from', v_cur.name, 'to', v_new.name));
end;
$$;

create or replace function public.club_ban(p_club uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me public.club_layers := public._my_club_layer(p_club);
  v_cur public.club_layers;
begin
  if v_me.id is null or not ('member.ban' = any (public._layer_permissions(v_me))) then
    raise exception 'forbidden';
  end if;
  if p_user = auth.uid() then raise exception 'cannot_ban_self'; end if;
  select l.* into v_cur from public.club_members m join public.club_layers l on l.id = m.layer_id
    where m.club_id = p_club and m.user_id = p_user and m.status in ('active', 'pending');
  if not found then raise exception 'not_member'; end if;
  if v_cur.rank <= v_me.rank then raise exception 'cannot_manage_higher'; end if;
  update public.club_members set status = 'banned', decided_by = auth.uid(), decided_at = now()
    where club_id = p_club and user_id = p_user;
  perform public._club_audit('club.member_banned', p_club, p_user);
end;
$$;

-- ─────────────────────────────────────────────────────────── 레이어 편집 (관리자만)
create or replace function public.club_layer_save(
  p_club uuid, p_layer uuid, p_name text, p_rank integer, p_permissions text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me public.club_layers := public._my_club_layer(p_club);
  v_layer public.club_layers;
  v_id uuid;
begin
  if v_me.kind is distinct from 'admin' then raise exception 'admin_only'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'name_required'; end if;

  if p_layer is null then
    if (select count(*) from public.club_layers where club_id = p_club) >= 6 then
      raise exception 'too_many_layers';
    end if;
    if p_rank is null or p_rank not between 1 and 8 then raise exception 'invalid_rank'; end if;
    if exists (select 1 from public.club_layers where club_id = p_club and rank = p_rank) then
      raise exception 'rank_taken';
    end if;
    insert into public.club_layers (club_id, name, rank, kind, permissions)
    values (p_club, trim(p_name), p_rank, 'custom', coalesce(p_permissions, '{}'))
    returning id into v_id;
    perform public._club_audit('club.layer_created', p_club, null,
      jsonb_build_object('name', trim(p_name), 'permissions', p_permissions));
    return v_id;
  end if;

  select * into v_layer from public.club_layers where id = p_layer and club_id = p_club for update;
  if not found then raise exception 'not_found'; end if;
  -- 관리자·멤버 레이어는 이름만 바꾼다(관리자는 전부, 멤버는 권한 없음으로 고정).
  if v_layer.kind <> 'custom' then
    update public.club_layers set name = trim(p_name) where id = p_layer;
  else
    if p_rank is null or p_rank not between 1 and 8 then raise exception 'invalid_rank'; end if;
    if exists (select 1 from public.club_layers where club_id = p_club and rank = p_rank and id <> p_layer) then
      raise exception 'rank_taken';
    end if;
    update public.club_layers
      set name = trim(p_name), rank = p_rank, permissions = coalesce(p_permissions, '{}')
      where id = p_layer;
  end if;
  perform public._club_audit('club.layer_updated', p_club, null,
    jsonb_build_object('name', trim(p_name), 'permissions', p_permissions));
  return p_layer;
end;
$$;

create or replace function public.club_layer_delete(p_club uuid, p_layer uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me public.club_layers := public._my_club_layer(p_club);
  v_layer public.club_layers;
  v_member_layer uuid;
  v_moved integer;
begin
  if v_me.kind is distinct from 'admin' then raise exception 'admin_only'; end if;
  select * into v_layer from public.club_layers where id = p_layer and club_id = p_club for update;
  if not found then raise exception 'not_found'; end if;
  if v_layer.kind <> 'custom' then raise exception 'fixed_layer'; end if;
  select id into v_member_layer from public.club_layers where club_id = p_club and kind = 'member';
  update public.club_members set layer_id = v_member_layer where club_id = p_club and layer_id = p_layer;
  get diagnostics v_moved = row_count;
  delete from public.club_layers where id = p_layer;
  perform public._club_audit('club.layer_deleted', p_club, null,
    jsonb_build_object('name', v_layer.name, 'moved_to_member', v_moved));
  return v_moved;
end;
$$;

revoke execute on function public._club_audit(text, uuid, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public._club_admit(uuid, text, uuid) from public, anon, authenticated;
revoke execute on function public._my_club_layer(uuid) from public, anon, authenticated;
revoke execute on function public.club_create(text, text, text, text) from public, anon;
revoke execute on function public.club_join(uuid) from public, anon;
revoke execute on function public.club_join_by_invite(text) from public, anon;
revoke execute on function public.club_invite_create(uuid, integer) from public, anon;
revoke execute on function public.club_leave(uuid) from public, anon;
revoke execute on function public.club_member_decide(uuid, uuid, boolean) from public, anon;
revoke execute on function public.club_assign_layer(uuid, uuid, uuid) from public, anon;
revoke execute on function public.club_ban(uuid, uuid) from public, anon;
revoke execute on function public.club_layer_save(uuid, uuid, text, integer, text[]) from public, anon;
revoke execute on function public.club_layer_delete(uuid, uuid) from public, anon;

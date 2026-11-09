-- 플랫폼 12단계: 이미지 보관함과 활동 표지(H06)
-- · 파일은 Storage의 media 버킷에 둔다. 경로가 곧 주인이다: u/<사람 id>/<파일 id>.<확장자> · c/<클럽 id>/<파일 id>.<확장자>
-- · 버킷은 공개다(활동 표지는 누구나 보는 화면에 쓰인다). 파일 주소는 추측할 수 없는 id지만, 비밀 사진을 올리는 곳은 아니다.
-- · 보관함 목록(media_assets)은 주인만 본다: 내 보관함은 나, 클럽 보관함은 그 클럽에서 활동을 열 수 있는 사람.
-- · 표지는 activities.cover_path에 'media:<경로>'로 적는다. 사이트 안 시안 이미지('/images/…')도 그대로 받는다.
-- · 후기 사진을 표지로 쓰는 것은 동의 방식이 정해진 뒤에 붙인다(AGENTS.md 열린 결정).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles (id) on delete cascade,
  club_id uuid references public.clubs (id) on delete cascade,
  path text not null unique
    check (path ~ '^(u|c)/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'),
  alt text check (alt is null or char_length(alt) <= 120),
  uploaded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  check ((owner_user_id is null) <> (club_id is null)),
  check (path like case when club_id is null then 'u/' || owner_user_id || '/%'
                        else 'c/' || club_id || '/%' end)
);
create index media_assets_owner_idx on public.media_assets (owner_user_id, created_at desc);
create index media_assets_club_idx on public.media_assets (club_id, created_at desc);

-- 이 경로의 보관함을 쓸 수 있나: 내 것이거나, 그 클럽에서 활동을 열 수 있거나.
create or replace function public._media_folder_ok(p_kind text, p_owner text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and p_owner ~ '^[0-9a-f-]{36}$'
    and case p_kind
      when 'u' then p_owner = auth.uid()::text
      when 'c' then public.club_has_permission(p_owner::uuid, 'activity.create')
      else false
    end;
$$;

alter table public.media_assets enable row level security;
create policy media_assets_read on public.media_assets for select
  using (
    owner_user_id = auth.uid()
    or (club_id is not null and public.club_has_permission(club_id, 'activity.create'))
  );
revoke insert, update, delete on public.media_assets from anon, authenticated;

-- Storage: 올리기·지우기는 자기 폴더(또는 권한 있는 클럽 폴더)에만. 읽기는 공개 버킷 주소로.
create policy media_objects_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and public._media_folder_ok((storage.foldername(name))[1], (storage.foldername(name))[2])
  );
create policy media_objects_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'media'
    and public._media_folder_ok((storage.foldername(name))[1], (storage.foldername(name))[2])
  );
-- 지우기 API가 대상을 찾으려면 읽기 권한이 필요하다(목록 화면은 media_assets로만 본다).
create policy media_objects_select on storage.objects for select to authenticated
  using (
    bucket_id = 'media'
    and public._media_folder_ok((storage.foldername(name))[1], (storage.foldername(name))[2])
  );

-- 올린 파일을 보관함에 등록한다. 파일이 실제로 올라가 있어야 한다.
create or replace function public.media_register(p_path text, p_alt text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_kind text := split_part(p_path, '/', 1);
  v_owner text := split_part(p_path, '/', 2);
  v_alt text := nullif(trim(coalesce(p_alt, '')), '');
  v_id uuid;
begin
  if v_uid is null then raise exception 'auth_required'; end if;
  if p_path !~ '^(u|c)/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$' then raise exception 'invalid_path'; end if;
  if not public._media_folder_ok(v_kind, v_owner) then raise exception 'forbidden'; end if;
  if char_length(coalesce(v_alt, '')) > 120 then raise exception 'too_long'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'media' and name = p_path) then
    raise exception 'file_missing';
  end if;
  if (select count(*) from public.media_assets
      where (v_kind = 'u' and owner_user_id = v_uid) or (v_kind = 'c' and club_id = v_owner::uuid)) >= 200 then
    raise exception 'saved_limit';
  end if;

  insert into public.media_assets (owner_user_id, club_id, path, alt, uploaded_by)
  values (case when v_kind = 'u' then v_uid end, case when v_kind = 'c' then v_owner::uuid end,
    p_path, v_alt, v_uid)
  returning id into v_id;
  return v_id;
end;
$$;

-- 보관함에서 지운다. 표지로 쓰는 활동(취소되지 않은)이 있으면 막는다. 파일 자체는 화면이 Storage API로 지운다.
create or replace function public.media_delete(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_asset public.media_assets;
begin
  if auth.uid() is null then raise exception 'auth_required'; end if;
  select * into v_asset from public.media_assets where id = p_id;
  if not found or not public._media_folder_ok(split_part(v_asset.path, '/', 1), split_part(v_asset.path, '/', 2)) then
    raise exception 'not_found';
  end if;
  if exists (select 1 from public.activities
             where cover_path = 'media:' || v_asset.path and status <> 'cancelled') then
    raise exception 'media_in_use';
  end if;
  -- 취소된 활동이 표지로 쓰던 것이면 표지를 비운다(깨진 이미지가 남지 않게).
  update public.activities set cover_path = null where cover_path = 'media:' || v_asset.path;
  delete from public.media_assets where id = p_id;
  return v_asset.path;
end;
$$;

-- 활동 표지를 정한다. p_media가 null이면 표지를 뺀다(종류 색과 제목의 기본 표지).
-- 내 보관함의 이미지는 내가 관리하는 어느 활동에나, 클럽 보관함의 이미지는 그 클럽의 활동에만.
alter table public.activities drop constraint activities_cover_path_check;
alter table public.activities add constraint activities_cover_path_check check (
  cover_path is null
  or cover_path ~ '^/images/[a-z0-9/_.-]+$'
  or cover_path ~ '^media:(u|c)/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
);

create or replace function public.activity_set_cover(p_activity uuid, p_media uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_act public.activities;
  v_asset public.media_assets;
begin
  if not public.can_manage_activity(p_activity) then raise exception 'forbidden'; end if;
  select * into v_act from public.activities where id = p_activity;
  if v_act.series_id is not null then raise exception 'session_cover'; end if;
  if p_media is null then
    update public.activities set cover_path = null where id = p_activity;
  else
    select * into v_asset from public.media_assets where id = p_media;
    if not found then raise exception 'not_found'; end if;
    if not (v_asset.owner_user_id = auth.uid()
            or (v_asset.club_id is not null and v_asset.club_id = v_act.club_id
                and public.club_has_permission(v_asset.club_id, 'activity.create'))) then
      raise exception 'media_not_usable';
    end if;
    update public.activities set cover_path = 'media:' || v_asset.path where id = p_activity;
  end if;
  perform public._write_audit('activity.cover_set', p_activity, null,
    jsonb_build_object('media', p_media));
end;
$$;

revoke execute on function public._media_folder_ok(text, text) from public, anon;
grant execute on function public._media_folder_ok(text, text) to authenticated;
revoke execute on function public.media_register(text, text) from public, anon;
revoke execute on function public.media_delete(uuid) from public, anon;
revoke execute on function public.activity_set_cover(uuid, uuid) from public, anon;
grant execute on function public.media_register(text, text) to authenticated;
grant execute on function public.media_delete(uuid) to authenticated;
grant execute on function public.activity_set_cover(uuid, uuid) to authenticated;

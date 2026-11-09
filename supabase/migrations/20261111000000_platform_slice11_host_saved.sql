-- 플랫폼 11단계: 호스트 보관함(H05) — 활동 양식 · 장소 즐겨찾기 · 공지 문구
-- 셋 다 지금은 개인 소유다(클럽이 함께 쓰는 보관함은 이후). 본인만 읽고, 쓰기는 아래 함수로만.
-- 양식의 내용(data)은 만들기 화면의 입력 모양(jsonb 객체)이며 일정은 담지 않는다. 화면 쪽이 모양을 다시 검사하고,
-- 활동을 실제로 만들 때는 activity_create가 권한·값을 다시 판단한다 — 양식은 "미리 채우기"일 뿐이다.

create table public.activity_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 8192),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table public.saved_places (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  area text check (area is null or char_length(area) <= 40),
  address_detail text check (address_detail is null or char_length(address_detail) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_snippets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 40),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index activity_templates_owner_idx on public.activity_templates (owner_id, updated_at desc);
create index saved_places_owner_idx on public.saved_places (owner_id, updated_at desc);
create index saved_snippets_owner_idx on public.saved_snippets (owner_id, updated_at desc);

create trigger activity_templates_touch before update on public.activity_templates
  for each row execute function public.touch_updated_at();
create trigger saved_places_touch before update on public.saved_places
  for each row execute function public.touch_updated_at();
create trigger saved_snippets_touch before update on public.saved_snippets
  for each row execute function public.touch_updated_at();

alter table public.activity_templates enable row level security;
alter table public.saved_places enable row level security;
alter table public.saved_snippets enable row level security;

create policy activity_templates_read on public.activity_templates for select
  using (owner_id = auth.uid());
create policy saved_places_read on public.saved_places for select
  using (owner_id = auth.uid());
create policy saved_snippets_read on public.saved_snippets for select
  using (owner_id = auth.uid());

revoke insert, update, delete on public.activity_templates, public.saved_places, public.saved_snippets
  from anon, authenticated;

-- 한 사람이 종류마다 둘 수 있는 개수. 보관함이 끝없이 늘지 않게.
create or replace function public._saved_limit()
returns integer
language sql
immutable
as $$ select 30 $$;

-- ── 양식: 같은 이름이면 덮어쓴다(양식 고치기). 일정 칸은 저장하지 않는다.
create or replace function public.template_save(p_name text, p_data jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := trim(coalesce(p_name, ''));
  v_id uuid;
begin
  if v_uid is null then raise exception 'auth_required'; end if;
  if v_name = '' then raise exception 'name_required'; end if;
  if char_length(v_name) > 40 then raise exception 'name_too_long'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'invalid_template'; end if;
  if pg_column_size(p_data) > 8192 then raise exception 'invalid_template'; end if;
  if not exists (select 1 from public.activity_templates where owner_id = v_uid and name = v_name)
     and (select count(*) from public.activity_templates where owner_id = v_uid) >= public._saved_limit() then
    raise exception 'saved_limit';
  end if;

  insert into public.activity_templates (owner_id, name, data)
  values (v_uid, v_name,
    p_data - array['startsAt', 'endsAt', 'firstStartsAt', 'startsOn', 'endsOn'])
  on conflict (owner_id, name) do update set data = excluded.data
  returning id into v_id;
  return v_id;
end;
$$;

-- ── 장소: id가 있으면 고치고, 없으면 새로.
create or replace function public.place_save(
  p_name text, p_area text, p_address_detail text, p_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := trim(coalesce(p_name, ''));
  v_area text := nullif(trim(coalesce(p_area, '')), '');
  v_addr text := nullif(trim(coalesce(p_address_detail, '')), '');
  v_id uuid;
begin
  if v_uid is null then raise exception 'auth_required'; end if;
  if v_name = '' then raise exception 'name_required'; end if;
  if char_length(v_name) > 40 or char_length(coalesce(v_area, '')) > 40
     or char_length(coalesce(v_addr, '')) > 80 then
    raise exception 'too_long';
  end if;
  if p_id is null then
    if (select count(*) from public.saved_places where owner_id = v_uid) >= public._saved_limit() then
      raise exception 'saved_limit';
    end if;
    insert into public.saved_places (owner_id, name, area, address_detail)
    values (v_uid, v_name, v_area, v_addr) returning id into v_id;
  else
    update public.saved_places set name = v_name, area = v_area, address_detail = v_addr
    where id = p_id and owner_id = v_uid returning id into v_id;
    if v_id is null then raise exception 'not_found'; end if;
  end if;
  return v_id;
end;
$$;

-- ── 공지 문구: id가 있으면 고치고, 없으면 새로.
create or replace function public.snippet_save(p_title text, p_body text, p_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_title text := trim(coalesce(p_title, ''));
  v_body text := trim(coalesce(p_body, ''));
  v_id uuid;
begin
  if v_uid is null then raise exception 'auth_required'; end if;
  if v_title = '' then raise exception 'name_required'; end if;
  if v_body = '' then raise exception 'body_required'; end if;
  if char_length(v_title) > 40 or char_length(v_body) > 1000 then raise exception 'too_long'; end if;
  if p_id is null then
    if (select count(*) from public.saved_snippets where owner_id = v_uid) >= public._saved_limit() then
      raise exception 'saved_limit';
    end if;
    insert into public.saved_snippets (owner_id, title, body)
    values (v_uid, v_title, v_body) returning id into v_id;
  else
    update public.saved_snippets set title = v_title, body = v_body
    where id = p_id and owner_id = v_uid returning id into v_id;
    if v_id is null then raise exception 'not_found'; end if;
  end if;
  return v_id;
end;
$$;

-- ── 지우기: 종류와 id. 내 것만.
create or replace function public.saved_delete(p_kind text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then raise exception 'auth_required'; end if;
  if p_kind = 'template' then
    delete from public.activity_templates where id = p_id and owner_id = v_uid;
  elsif p_kind = 'place' then
    delete from public.saved_places where id = p_id and owner_id = v_uid;
  elsif p_kind = 'snippet' then
    delete from public.saved_snippets where id = p_id and owner_id = v_uid;
  else
    raise exception 'invalid_kind';
  end if;
  get diagnostics v_count = row_count;
  if v_count = 0 then raise exception 'not_found'; end if;
end;
$$;

revoke execute on function public.template_save(text, jsonb) from public, anon;
revoke execute on function public.place_save(text, text, text, uuid) from public, anon;
revoke execute on function public.snippet_save(text, text, uuid) from public, anon;
revoke execute on function public.saved_delete(text, uuid) from public, anon;
grant execute on function public.template_save(text, jsonb) to authenticated;
grant execute on function public.place_save(text, text, text, uuid) to authenticated;
grant execute on function public.snippet_save(text, text, uuid) to authenticated;
grant execute on function public.saved_delete(text, uuid) to authenticated;

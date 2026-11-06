-- 첫 가입 온보딩(백로그 L03): 닉네임 확정 + 관심사 1~5개.
-- 설계: docs/architecture/platform-db-design.md 3절. 쓰기는 security definer 함수로만.

alter table public.profiles add column onboarded_at timestamptz;

-- ─────────────────────────────────────────────────────────── 관심사
create table public.interests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null check (char_length(name) between 1 and 20),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profile_interests (
  user_id uuid not null references public.profiles (id) on delete cascade,
  interest_id uuid not null references public.interests (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, interest_id)
);

create index profile_interests_interest on public.profile_interests (interest_id);

alter table public.interests enable row level security;
alter table public.profile_interests enable row level security;

-- 관심사는 공개 프로필 정보다(명세 1절).
create policy interests_read on public.interests for select using (true);
create policy profile_interests_read on public.profile_interests for select using (true);

-- ─────────────────────────────────────────────────────────── 닉네임
-- 2~12자, 한글·영문·숫자·밑줄. 앞뒤 공백은 지운다. (제안 기본값, 명세 1절)
create or replace function public.nickname_is_valid(p_nickname text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_nickname is not null
    and char_length(p_nickname) between 2 and 12
    and p_nickname ~ '^[가-힣a-zA-Z0-9_]+$';
$$;

/** 닉네임을 쓸 수 있는지. 화면의 바로 안내용이며 최종 확인은 온보딩 함수가 다시 한다. */
create or replace function public.nickname_check(p_nickname text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_name text := trim(p_nickname);
begin
  if not public.nickname_is_valid(v_name) then return 'nickname_invalid'; end if;
  if exists (
    select 1 from public.profiles
    -- search_path가 비어 있으면 citext 연산자를 못 찾아 대소문자를 구분하므로 lower로 비교한다.
    -- 저장 때는 citext 고유 제약이 같은 규칙으로 막는다.
    where lower(nickname::text) = lower(v_name) and id is distinct from auth.uid()
  ) then
    return 'nickname_taken';
  end if;
  return 'ok';
end;
$$;

-- ─────────────────────────────────────────────────────────── 온보딩 완료
create or replace function public.profile_complete_onboarding(p_nickname text, p_interests uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := trim(p_nickname);
  v_ids uuid[] := array(select distinct unnest(coalesce(p_interests, '{}'::uuid[])));
  v_status text;
begin
  if v_uid is null then raise exception 'auth_required'; end if;

  select status into v_status from public.profiles where id = v_uid;
  if v_status is not null and v_status <> 'active' then raise exception 'account_inactive'; end if;

  if not public.nickname_is_valid(v_name) then raise exception 'nickname_invalid'; end if;
  if cardinality(v_ids) not between 1 and 5 then raise exception 'interests_count'; end if;
  if (select count(*) from public.interests where id = any (v_ids) and is_active) <> cardinality(v_ids) then
    raise exception 'interest_invalid';
  end if;

  begin
    insert into public.profiles (id, nickname, onboarded_at)
    values (v_uid, v_name, now())
    on conflict (id) do update
      set nickname = excluded.nickname,
          onboarded_at = coalesce(public.profiles.onboarded_at, excluded.onboarded_at);
  exception when unique_violation then
    raise exception 'nickname_taken';
  end;

  delete from public.profile_interests where user_id = v_uid;
  insert into public.profile_interests (user_id, interest_id)
  select v_uid, unnest(v_ids);
end;
$$;

revoke execute on function public.nickname_check(text) from public, anon;
revoke execute on function public.profile_complete_onboarding(text, uuid[]) from public, anon;
grant execute on function public.nickname_check(text) to authenticated;
grant execute on function public.profile_complete_onboarding(text, uuid[]) to authenticated;

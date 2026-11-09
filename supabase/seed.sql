-- 로컬 시험장 전용 가짜 데이터. `supabase db reset` 때만 실행되며 운영 DB에는 올라가지 않는다.
-- 실제 회원 데이터를 넣지 않는다. 사람 목록은 src/lib/platform/personas.ts와 맞춘다.
-- 화면의 "처음 상태로" 버튼은 public.sandbox_reseed()를 서비스 롤로 호출한다.

create or replace function public.sandbox_reseed()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pw text := extensions.crypt('sandbox-pass-2026', extensions.gen_salt('bf'));
  -- 사람
  u_owner uuid := '00000000-0000-4000-a000-000000000001';
  u_host uuid := '00000000-0000-4000-a000-000000000002';
  u_admin uuid := '00000000-0000-4000-a000-000000000003';
  u_staff uuid := '00000000-0000-4000-a000-000000000004';
  u_member uuid := '00000000-0000-4000-a000-000000000005';
  u_guest uuid := '00000000-0000-4000-a000-000000000006';
  -- 클럽
  c_vibe uuid := '00000000-0000-4000-b000-000000000001';
  l_admin uuid := '00000000-0000-4000-b100-000000000001';
  l_staff uuid := '00000000-0000-4000-b100-000000000002';
  l_member uuid := '00000000-0000-4000-b100-000000000003';
  l_leader uuid := '00000000-0000-4000-b100-000000000004';
  l_ban uuid := '00000000-0000-4000-b100-000000000005';
  c_video uuid := '00000000-0000-4000-b000-000000000002';
  -- 활동
  a_tonight uuid := '00000000-0000-4000-c000-000000000001';
  a_members uuid := '00000000-0000-4000-c000-000000000002';
  a_cafe uuid := '00000000-0000-4000-c000-000000000003';
  a_last uuid := '00000000-0000-4000-c000-000000000004';
  a_draft uuid := '00000000-0000-4000-c000-000000000005';
  a_workshop uuid := '00000000-0000-4000-c000-000000000006';
  a_followup uuid := '00000000-0000-4000-c000-000000000007';
  a_clinic uuid := '00000000-0000-4000-c000-000000000008';
  o_paid uuid := '00000000-0000-4000-d000-000000000001';
  o_overdue uuid := '00000000-0000-4000-d000-000000000002';
  a_series uuid := '00000000-0000-4000-c000-000000000009';
  a_chal uuid := '00000000-0000-4000-c000-000000000014';
  a_chal_done uuid := '00000000-0000-4000-c000-000000000015';
  f1 uuid := '00000000-0000-4000-a000-000000000011';
  f2 uuid := '00000000-0000-4000-a000-000000000012';
  f3 uuid := '00000000-0000-4000-a000-000000000013';
  f4 uuid := '00000000-0000-4000-a000-000000000014';
  v_kst date := (now() at time zone 'Asia/Seoul')::date;
  v_session uuid;
  i integer;
  v_today timestamptz := date_trunc('minute', now());
  r record;
begin
  truncate public.club_invites, public.certifications, public.challenge_missions, public.challenge_details,
    public.settlement_items, public.settlements, public.refunds, public.entitlements,
    public.orders, public.refund_policies, public.platform_settings,
    public.audit_logs, public.attendances, public.participations, public.activity_hosts,
    public.activity_private, public.gathering_details, public.activities,
    public.club_members, public.club_layers, public.clubs,
    public.hosts, public.platform_staff, public.profiles restart identity cascade;
  alter sequence public.order_no_seq restart;
  delete from auth.users where email like '%@sandbox.motivo.test';

  for r in
    select * from (values
      (u_owner, 'owner', '모쏘운영'),
      (u_host, 'host', '바라호스트'),
      (u_admin, 'club-admin', '클럽장'),
      (u_staff, 'club-staff', '클럽운영진'),
      (u_member, 'member', '멤버하나'),
      (u_guest, 'guest', '처음온사람'),
      ('00000000-0000-4000-a000-000000000011'::uuid, 'filler1', '참가자1'),
      ('00000000-0000-4000-a000-000000000012'::uuid, 'filler2', '참가자2'),
      ('00000000-0000-4000-a000-000000000013'::uuid, 'filler3', '참가자3'),
      ('00000000-0000-4000-a000-000000000014'::uuid, 'filler4', '참가자4'),
      ('00000000-0000-4000-a000-000000000015'::uuid, 'filler5', '참가자5')
    ) as t (id, handle, nickname)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', r.id, 'authenticated', 'authenticated',
      r.handle || '@sandbox.motivo.test', v_pw, now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(),
      '', '', '', '', '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), r.id, r.id::text, 'email',
      jsonb_build_object('sub', r.id::text, 'email', r.handle || '@sandbox.motivo.test', 'email_verified', true),
      now(), now(), now()
    );
    insert into public.profiles (id, nickname, onboarded_at) values (r.id, r.nickname, now());
  end loop;

  insert into public.platform_staff (user_id, role) values (u_owner, 'owner');

  -- 가짜 사람들은 온보딩을 마친 상태로 둔다(관심사 두 개씩).
  insert into public.profile_interests (user_id, interest_id)
  select p.id, i.id from public.profiles p
  cross join public.interests i
  where i.slug in ('ai-tools', 'vibe-coding');

  -- 시험값: 수수료율 · 환불 규정은 대표 승인 전이다. 실제 값이 아니다.
  insert into public.platform_settings (fee_rate, order_due_hours, bank_account_note)
  values (0.10, 24, '(가짜) 모쏘은행 000-0000-0000 예금주 오디스트웍스');
  insert into public.refund_policies (target_kind, version, rules, approved_note) values
    ('gathering', 1,
     '[{"days_before": 7, "rate": 100}, {"days_before": 3, "rate": 50}, {"days_before": 0, "rate": 0}]',
     '시험값 (대표 승인 전)'),
    ('series', 1,
     '[{"days_before": 7, "rate": 100}, {"days_before": 3, "rate": 50}, {"days_before": 0, "rate": 0}]',
     '시험값 (대표 승인 전, 회차 중간 환불 계산은 나중)'),
    ('challenge', 1, '[{"days_before": 1, "rate": 100}, {"days_before": 0, "rate": 0}]',
     '시험값 (대표 승인 전)');
  insert into public.hosts (user_id, tier) values (u_host, 'paid'), (u_admin, 'basic');

  -- 클럽: 관리자 · 운영진(참가자 관리 + 활동 만들기) · 멤버
  insert into public.clubs (id, slug, name, tagline, description, created_by)
  values (c_vibe, 'weekend-vibe', '주말 바이브코딩 클럽', '주말마다 하나씩 만들어 보는 모임',
    '각자 만들고 싶은 걸 들고 와서 같이 만들어요.', u_admin);
  insert into public.club_layers (id, club_id, name, rank, kind, permissions) values
    (l_admin, c_vibe, '관리자', 0, 'admin', '{}'),
    (l_staff, c_vibe, '운영진', 1, 'custom',
      array['participant.manage', 'activity.create', 'notice.write', 'member.approve', 'member.assign_layer']),
    -- 운영진이 지정할 수 있는 아래 레이어(권한이 운영진 안에 있다)
    (l_leader, c_vibe, '새싹 리더', 5, 'custom', array['notice.write']),
    -- 운영진에게 없는 강퇴 권한을 가진 레이어: 운영진은 이 레이어로 지정할 수 없다
    (l_ban, c_vibe, '질서 지킴이', 3, 'custom', array['member.ban']),
    (l_member, c_vibe, '멤버', 9, 'member', '{}');
  insert into public.club_members (club_id, user_id, layer_id) values
    (c_vibe, u_admin, l_admin),
    (c_vibe, u_staff, l_staff),
    (c_vibe, u_member, l_member),
    (c_vibe, '00000000-0000-4000-a000-000000000011', l_member),
    (c_vibe, '00000000-0000-4000-a000-000000000012', l_member),
    (c_vibe, '00000000-0000-4000-a000-000000000013', l_member);
  insert into public.club_members (club_id, user_id, layer_id, status) values
    (c_vibe, '00000000-0000-4000-a000-000000000015', l_member, 'pending');

  -- 승인제 클럽: 유료 호스트가 관리자. 외부인은 신청하면 대기, 초대 링크면 바로 가입.
  insert into public.clubs (id, slug, name, tagline, description, join_mode, created_by)
  values (c_video, 'ai-video-club', 'AI 영상 만들기 클럽', '짧은 영상을 AI로 만들어 보는 모임',
    '매달 한 편씩 짧은 영상을 만들어 서로 보여줘요.', 'approval', u_host);
  insert into public.club_layers (club_id, name, rank, kind, permissions) values
    (c_video, '관리자', 0, 'admin', '{}'),
    (c_video, '운영진', 1, 'custom', array['notice.write', 'activity.create', 'participant.manage', 'member.approve']),
    (c_video, '멤버', 9, 'member', '{}');
  insert into public.club_members (club_id, user_id, layer_id)
  select c_video, u_host, id from public.club_layers where club_id = c_video and kind = 'admin';
  insert into public.club_members (club_id, user_id, layer_id)
  select c_video, '00000000-0000-4000-a000-000000000014', id
  from public.club_layers where club_id = c_video and kind = 'member';

  -- 1) 오늘 온라인 모각코: 정원 4, 이미 3명 → 남은 자리 1. 곧 시작해서 화상 링크가 열린다.
  insert into public.activities (id, kind, organizer_kind, club_id, created_by, slug, title, summary,
    join_mode, capacity, starts_at, ends_at, status)
  values (a_tonight, 'gathering', 'club', c_vibe, u_staff, 'tonight-mogakco', '오늘 저녁 온라인 모각코',
    '각자 만들던 걸 켜 두고 두 시간 같이 집중해요.', 'instant', 4,
    v_today + interval '20 minutes', v_today + interval '140 minutes', 'open');
  insert into public.gathering_details (activity_id, format, place_name, area)
  values (a_tonight, 'online', '화상 모임', '온라인');
  insert into public.activity_private (activity_id, video_url)
  values (a_tonight, 'https://meet.example.test/tonight-mogakco');
  insert into public.participations (activity_id, user_id, status) values
    (a_tonight, '00000000-0000-4000-a000-000000000011', 'confirmed'),
    (a_tonight, '00000000-0000-4000-a000-000000000012', 'confirmed'),
    (a_tonight, '00000000-0000-4000-a000-000000000013', 'confirmed');

  -- 2) 멤버 전용 회고: 클럽 멤버만 신청, 승인제, 주소는 확정 후 공개
  insert into public.activities (id, kind, organizer_kind, club_id, created_by, slug, title, summary,
    audience, join_mode, capacity, starts_at, ends_at, status)
  values (a_members, 'gathering', 'club', c_vibe, u_admin, 'members-retro', '멤버끼리 한 달 회고',
    '이번 달 만든 것을 돌아보는 멤버 모임이에요.', 'club_members', 'approval', 8,
    v_today + interval '7 days', v_today + interval '7 days 2 hours', 'open');
  insert into public.gathering_details (activity_id, format, place_name, area)
  values (a_members, 'offline', '성수 작업실', '서울 성동구');
  insert into public.activity_private (activity_id, address_detail)
  values (a_members, '성수이로 00길 0, 2층 (가짜 주소)');
  insert into public.participations (activity_id, user_id, status) values
    (a_members, '00000000-0000-4000-a000-000000000011', 'pending_approval');

  -- 3) 개인 호스트의 카페 번개: 클럽 밖, 누구나, 즉시 확정
  insert into public.activities (id, kind, organizer_kind, created_by, slug, title, summary,
    join_mode, capacity, starts_at, ends_at, status)
  values (a_cafe, 'gathering', 'host', u_host, 'capybara-cafe', '카피바라 카페에서 AI 수다',
    '요즘 써 본 AI 도구 하나씩 들고 와서 이야기해요.', 'instant', 6,
    v_today + interval '3 days', v_today + interval '3 days 2 hours', 'open');
  insert into public.gathering_details (activity_id, format, place_name, area)
  values (a_cafe, 'offline', '망원동 카페', '서울 마포구');
  insert into public.activity_private (activity_id, address_detail)
  values (a_cafe, '망원로 00, 1층 창가 자리 (가짜 주소)');
  insert into public.participations (activity_id, user_id, status) values
    (a_cafe, '00000000-0000-4000-a000-000000000014', 'confirmed'),
    (a_cafe, u_member, 'confirmed'); -- 회원 홈 시안: 멤버하나의 다가오는 일정

  -- 4) 지난주 모각코: 끝난 모임, 출석 기록 있음
  insert into public.activities (id, kind, organizer_kind, club_id, created_by, slug, title, summary,
    join_mode, capacity, starts_at, ends_at, status)
  values (a_last, 'gathering', 'club', c_vibe, u_staff, 'last-week-mogakco', '지난주 온라인 모각코',
    '지난주에 열린 모각코예요.', 'instant', 6,
    v_today - interval '7 days', v_today - interval '7 days' + interval '2 hours', 'ended');
  insert into public.gathering_details (activity_id, format, place_name, area)
  values (a_last, 'online', '화상 모임', '온라인');
  insert into public.participations (activity_id, user_id, status) values
    (a_last, u_member, 'confirmed'),
    (a_last, '00000000-0000-4000-a000-000000000011', 'confirmed');
  insert into public.attendances (gathering_id, user_id, status, checked_by) values
    (a_last, u_member, 'attended', u_staff),
    (a_last, '00000000-0000-4000-a000-000000000011', 'absent', u_staff);

  -- 5) 호스트의 작성 중 모임: 호스트 본인에게만 보인다
  insert into public.activities (id, kind, organizer_kind, created_by, slug, title, summary,
    join_mode, capacity, starts_at, status)
  values (a_draft, 'gathering', 'host', u_host, 'draft-night-walk', '(작성 중) 밤 산책 회고',
    '아직 공개 전인 모임이에요.', 'instant', 5, v_today + interval '10 days', 'draft');
  insert into public.gathering_details (activity_id, format, place_name, area)
  values (a_draft, 'offline', '한강', '서울');

  -- 6) 유료 워크숍: 개인 호스트, 15,000원, 정원 3. 한 명은 결제 완료, 한 명은 입금 기한이 지났다.
  insert into public.activities (id, kind, organizer_kind, created_by, slug, title, summary,
    join_mode, capacity, price, payee_user_id, starts_at, ends_at, status)
  values (a_workshop, 'gathering', 'host', u_host, 'ai-tools-workshop', 'AI 도구 실습 워크숍',
    '노트북을 들고 와서 세 가지 도구로 같은 결과물을 만들어 봐요.', 'instant', 3, 15000, u_host,
    v_today + interval '10 days', v_today + interval '10 days 3 hours', 'open');
  insert into public.gathering_details (activity_id, format, place_name, area)
  values (a_workshop, 'offline', '합정 스터디룸', '서울 마포구');
  insert into public.activity_private (activity_id, address_detail)
  values (a_workshop, '양화로 00, 3층 B룸 (가짜 주소)');
  insert into public.orders (id, user_id, activity_id, amount, item_snapshot, payee_user_id, fee_rate,
    refund_policy_id, depositor_name, due_at, status, confirmed_by, confirmed_at, created_at)
  select o_paid, '00000000-0000-4000-a000-000000000014', a_workshop, 15000,
    jsonb_build_object('title', 'AI 도구 실습 워크숍', 'price', 15000), u_host, 0.10, rp.id, '참가자4',
    now() + interval '23 hours', 'paid', u_owner, now() - interval '1 hour', now() - interval '1 day'
  from public.refund_policies rp where rp.target_kind = 'gathering';
  insert into public.orders (id, user_id, activity_id, amount, item_snapshot, payee_user_id, fee_rate,
    refund_policy_id, depositor_name, due_at, status, created_at)
  select o_overdue, '00000000-0000-4000-a000-000000000015', a_workshop, 15000,
    jsonb_build_object('title', 'AI 도구 실습 워크숍', 'price', 15000), u_host, 0.10, rp.id, '참가자5',
    now() - interval '1 hour', 'pending', now() - interval '25 hours'
  from public.refund_policies rp where rp.target_kind = 'gathering';
  insert into public.participations (activity_id, user_id, status, order_id) values
    (a_workshop, '00000000-0000-4000-a000-000000000014', 'confirmed', o_paid),
    (a_workshop, '00000000-0000-4000-a000-000000000015', 'pending_payment', o_overdue);
  insert into public.entitlements (user_id, activity_id, source, order_id)
  values ('00000000-0000-4000-a000-000000000014', a_workshop, 'order', o_paid);

  -- 7) 워크숍 참가자 전용 후속 Q&A: 워크숍 이용권이 있어야 신청할 수 있다.
  insert into public.activities (id, kind, organizer_kind, created_by, slug, title, summary,
    audience, required_activity_id, join_mode, capacity, starts_at, ends_at, status)
  values (a_followup, 'gathering', 'host', u_host, 'workshop-followup', '워크숍 참가자 후속 Q&A',
    '워크숍에서 만든 것을 일주일 써 보고 다시 모여요.', 'entitlement_holders', a_workshop, 'instant', 10,
    v_today + interval '17 days', v_today + interval '17 days 1 hour', 'open');
  insert into public.gathering_details (activity_id, format, place_name, area)
  values (a_followup, 'online', '화상 모임', '온라인');
  insert into public.activity_private (activity_id, video_url)
  values (a_followup, 'https://meet.example.test/workshop-followup');

  -- 8) 닷새 뒤 유료 클리닉: 지금 환불하면 시험 규정상 50%.
  insert into public.activities (id, kind, organizer_kind, created_by, slug, title, summary,
    join_mode, capacity, price, payee_user_id, starts_at, ends_at, status)
  values (a_clinic, 'gathering', 'host', u_host, 'prompt-clinic', '프롬프트 클리닉',
    '막힌 요청문을 들고 오면 같이 고쳐 봐요.', 'instant', 5, 20000, u_host,
    v_today + interval '5 days', v_today + interval '5 days 2 hours', 'open');
  insert into public.gathering_details (activity_id, format, place_name, area)
  values (a_clinic, 'online', '화상 모임', '온라인');
  insert into public.activity_private (activity_id, video_url)
  values (a_clinic, 'https://meet.example.test/prompt-clinic');

  -- 9) 4주 시즌: 개인 호스트, 시즌 단위 40,000원. 1회차는 지났고 2회차는 곧 시작. 중도 합류 허용.
  insert into public.activities (id, kind, organizer_kind, created_by, slug, title, summary,
    join_mode, capacity, price, payee_user_id, allow_late_join, status)
  values (a_series, 'series', 'host', u_host, 'vibe-season-4w', '4주 바이브코딩 시즌',
    '한 주에 한 번, 4주 동안 내 서비스 하나를 끝까지 만들어요.', 'instant', 6, 40000, u_host, true,
    'in_progress');
  for i in 1..4 loop
    v_session := ('00000000-0000-4000-c000-0000000000' || (9 + i)::text)::uuid;
    insert into public.activities (id, kind, series_id, session_no, organizer_kind, created_by, slug,
      title, summary, join_mode, starts_at, ends_at, status)
    values (v_session, 'gathering', a_series, i, 'host', u_host, 'vibe-season-4w-' || i,
      '4주 바이브코딩 시즌 ' || i || '회차 · ' || (array['기획', '첫 화면', '기능 붙이기', '배포와 발표'])[i],
      '시즌 등록자가 함께하는 회차예요.', 'instant',
      case i when 1 then v_today - interval '7 days' when 2 then v_today + interval '30 minutes'
        else v_today + make_interval(days => 7 * (i - 2)) end,
      case i when 1 then v_today - interval '7 days' + interval '2 hours'
        when 2 then v_today + interval '150 minutes'
        else v_today + make_interval(days => 7 * (i - 2)) + interval '2 hours' end,
      case when i = 1 then 'ended' else 'open' end);
    insert into public.gathering_details (activity_id, format, place_name, area)
    values (v_session, 'online', '화상 모임', '온라인');
    insert into public.activity_private (activity_id, video_url)
    values (v_session, 'https://meet.example.test/vibe-season-week-' || i);
  end loop;
  insert into public.orders (user_id, activity_id, amount, item_snapshot, payee_user_id, fee_rate,
    refund_policy_id, depositor_name, due_at, status, confirmed_by, confirmed_at)
  select u, a_series, 40000, jsonb_build_object('title', '4주 바이브코딩 시즌', 'price', 40000),
    u_host, 0.10, rp.id, n, now(), 'paid', u_owner, now() - interval '8 days'
  from (values (f1, '참가자1'), (f2, '참가자2')) as t (u, n)
  cross join public.refund_policies rp where rp.target_kind = 'series';
  insert into public.participations (activity_id, user_id, status, order_id)
  select a_series, o.user_id, 'confirmed', o.id from public.orders o where o.activity_id = a_series;
  insert into public.entitlements (user_id, activity_id, source, order_id)
  select o.user_id, a_series, 'order', o.id from public.orders o where o.activity_id = a_series;
  insert into public.attendances (gathering_id, user_id, status, checked_by) values
    ('00000000-0000-4000-c000-000000000010', f1, 'attended', u_host),
    ('00000000-0000-4000-c000-000000000010', f2, 'absent', u_host);

  -- 10) 진행 중인 2주 챌린지: 클럽 주최, 무료, 매일 인증, 10회 이상이면 완주. 중도 합류 허용.
  insert into public.activities (id, kind, organizer_kind, club_id, created_by, slug, title, summary,
    join_mode, allow_late_join, status)
  values (a_chal, 'challenge', 'club', c_vibe, u_staff, 'daily-build-2w', '2주 매일 하나씩 만들기',
    '매일 AI로 작은 것 하나를 만들고 한 줄로 남겨요.', 'instant', true, 'draft');
  insert into public.challenge_details (activity_id, starts_on, ends_on, cert_rule, cert_formats,
    completion_threshold)
  values (a_chal, v_kst - 4, v_kst + 9, 'daily', array['text', 'link'], 10);
  update public.activities set status = 'in_progress' where id = a_chal;
  insert into public.challenge_missions (activity_id, day_no, title, body) values
    (a_chal, null, '오늘 만든 것 한 줄', '무엇을 만들었고 AI에게 어떻게 요청했는지 한 줄로 남겨요.'),
    (a_chal, 5, '답 하나 고쳐 보기', '오늘은 AI가 준 답 중 하나를 직접 고친 이유를 적어요.');
  insert into public.participations (activity_id, user_id, status) values
    (a_chal, f1, 'confirmed'), (a_chal, f2, 'confirmed'), (a_chal, u_member, 'confirmed');
  insert into public.certifications (activity_id, user_id, cert_date, body)
  select a_chal, f1, v_kst - d, '참가자1의 ' || (5 - d) || '일차 기록' from generate_series(1, 4) d
  union all
  select a_chal, f2, v_kst - d, '참가자2의 ' || (5 - d) || '일차 기록' from generate_series(3, 4) d
  union all
  select a_chal, u_member, v_kst - d, '멤버하나의 ' || (5 - d) || '일차 기록' from generate_series(2, 4) d;
  update public.certifications set status = 'rejected', rejected_by = u_staff,
    rejected_reason = '미션과 관계없는 내용이에요 (가짜 반려 예시)'
    where activity_id = a_chal and user_id = f2 and cert_date = v_kst - 3;

  -- 11) 어제 끝난 1주 챌린지: 개인 호스트, 5회 이상 완주. 아직 완주 판정 전.
  insert into public.activities (id, kind, organizer_kind, created_by, slug, title, summary,
    join_mode, status)
  values (a_chal_done, 'challenge', 'host', u_host, 'prompt-diary-1w', '1주 프롬프트 일기',
    '일주일 동안 매일 쓴 요청문 하나를 남겨요.', 'instant', 'draft');
  insert into public.challenge_details (activity_id, starts_on, ends_on, cert_rule, cert_formats,
    completion_threshold)
  values (a_chal_done, v_kst - 7, v_kst - 1, 'daily', array['text'], 5);
  update public.activities set status = 'in_progress' where id = a_chal_done;
  insert into public.challenge_missions (activity_id, day_no, title)
  values (a_chal_done, null, '오늘의 요청문');
  insert into public.participations (activity_id, user_id, status) values
    (a_chal_done, f3, 'confirmed'), (a_chal_done, f4, 'confirmed');
  insert into public.certifications (activity_id, user_id, cert_date, body)
  select a_chal_done, f3, v_kst - d, '요청문 기록 ' || d from generate_series(1, 6) d
  union all
  select a_chal_done, f4, v_kst - d, '요청문 기록 ' || d from generate_series(5, 7) d;

  -- 표지(시안용 생성 이미지, docs/design-references/platform/service-draft-l01b.md). 하나는 비워 기본 표지를 본다.
  update public.activities a set cover_path = '/images/platform/mock/' || c.file
  from (values
    ('tonight-mogakco', 'cover-online-mogakco.jpg'),
    ('members-retro', 'cover-retro.jpg'),
    ('capybara-cafe', 'cover-cafe-chat.jpg'),
    ('ai-tools-workshop', 'cover-workshop.jpg'),
    ('prompt-clinic', 'cover-prompt-clinic.jpg'),
    ('vibe-season-4w', 'cover-season-studio.jpg'),
    ('daily-build-2w', 'cover-challenge-notebook.jpg')
  ) as c (slug, file)
  where a.slug = c.slug;

  -- 무료로 확정된 참가에도 이용권을 만든다(명세 9절).
  insert into public.entitlements (user_id, activity_id, source)
  select p.user_id, p.activity_id, 'free' from public.participations p
  where p.status = 'confirmed' and p.order_id is null;
  update public.participations p set entitlement_id = e.id
  from public.entitlements e
  where e.user_id = p.user_id and e.activity_id = p.activity_id and e.status = 'active';

  -- 호스트 보관함(H05): 바라호스트가 자주 쓰는 장소 · 공지 문구 · 양식 하나씩.
  insert into public.saved_places (owner_id, name, area, address_detail) values
    (u_host, '합정 스터디룸', '서울 마포구', '양화로 00, 3층 B룸 (가짜 주소)');
  insert into public.saved_snippets (owner_id, title, body) values
    (u_host, '준비물 안내', '노트북과 충전기를 챙겨 주세요. 와이파이는 현장에서 알려 드려요.');
  insert into public.activity_templates (owner_id, name, data) values
    (u_host, '카페 수다', jsonb_build_object(
      'kind', 'gathering', 'organizer', 'host', 'title', 'AI 수다', 'summary',
      '요즘 써 본 AI 도구 하나씩 들고 와서 이야기해요.', 'format', 'offline', 'placeName', '망원동 카페',
      'area', '서울 마포구', 'capacity', '6', 'price', '0', 'joinMode', 'instant', 'audience', 'anyone'));
end;
$$;

-- 관심사 목록(시안 값). 실제 목록은 소유자가 정한다. 초기화해도 지우지 않는다(참조 데이터).
insert into public.interests (slug, name, sort_order) values
  ('ai-tools', 'AI 도구', 10),
  ('vibe-coding', '바이브코딩', 20),
  ('web', '웹 만들기', 30),
  ('design', '디자인', 40),
  ('writing', '글쓰기', 50),
  ('video', '영상', 60),
  ('productivity', '일 잘하기', 70),
  ('side-project', '사이드 프로젝트', 80),
  ('startup', '창업', 90),
  ('study', '함께 공부', 100)
on conflict (slug) do nothing;

revoke execute on function public.sandbox_reseed() from public, anon, authenticated;
grant execute on function public.sandbox_reseed() to service_role;

select public.sandbox_reseed();

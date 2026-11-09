-- 플랫폼 9단계: 가입 신청(승인 대기) 중인 사람도 초대 링크로 바로 멤버가 된다.
-- 초대는 "승인 없이 바로 멤버"라는 약속이다. 먼저 신청해 둔 사람만 이 약속에서 빠지던 것을 고친다.
-- 이미 멤버(active)·강퇴(banned)는 그대로 막는다.

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
    if v_existing.status = 'active' then raise exception 'already_member'; end if;
    -- 승인 대기는 초대로만 넘어간다(같은 신청을 또 하는 건 막는다).
    if v_existing.status = 'pending' and not (p_invite is not null and p_status = 'active') then
      raise exception 'already_member';
    end if;
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

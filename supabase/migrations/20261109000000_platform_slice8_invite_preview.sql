-- 플랫폼 8단계: 초대 링크 미리보기
-- 초대 링크(/invite/[code])를 연 사람에게 어느 클럽 초대인지 보여 준다.
-- 초대 행 자체는 초대 권한자만 읽으므로(club_invites_read), 코드를 가진 사람에게 필요한 것만 돌려주는 함수를 둔다.
-- 돌려주는 것: 클럽 주소·이름·한 줄 소개·활성 멤버 수, 그리고 지금 쓸 수 있는 코드인지. 만든 사람·사용 횟수는 주지 않는다.

create or replace function public.club_invite_preview(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_inv public.club_invites;
  v_club public.clubs;
begin
  select * into v_inv from public.club_invites where code = p_code;
  if not found then
    return jsonb_build_object('valid', false);
  end if;
  select * into v_club from public.clubs where id = v_inv.club_id and status = 'active';
  if not found then
    return jsonb_build_object('valid', false);
  end if;
  return jsonb_build_object(
    'valid', v_inv.revoked_at is null
      and (v_inv.expires_at is null or v_inv.expires_at >= now())
      and (v_inv.max_uses is null or v_inv.used_count < v_inv.max_uses),
    'slug', v_club.slug,
    'name', v_club.name,
    'tagline', v_club.tagline,
    'members', (select count(*)::integer from public.club_members m
                where m.club_id = v_club.id and m.status = 'active')
  );
end;
$$;

grant execute on function public.club_invite_preview(text) to anon, authenticated;

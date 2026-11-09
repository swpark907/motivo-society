-- 플랫폼 15단계: 명단 내보내기 기록(H09)
-- 호스트가 명단을 파일(CSV)로 받거나 출석표를 열면 회원 정보가 플랫폼 밖으로 나갈 수 있다.
-- 내보내는 항목은 닉네임 · 신청 상태 · 신청일 · 결제 상태 · 주문 번호 · 출석/인증 수뿐이고(이메일 · 입금자명 없음),
-- 누가 언제 어떤 활동의 명단을 내보냈는지 감사 기록에 남긴다.

create or replace function public.roster_export_log(p_activity uuid, p_format text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_manage_activity(p_activity) then raise exception 'forbidden'; end if;
  if p_format not in ('csv', 'print') then raise exception 'invalid_kind'; end if;
  perform public._write_audit('roster.exported', p_activity, null, jsonb_build_object('format', p_format));
end;
$$;

revoke execute on function public.roster_export_log(uuid, text) from public, anon;
grant execute on function public.roster_export_log(uuid, text) to authenticated;

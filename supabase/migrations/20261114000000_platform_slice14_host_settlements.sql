-- 플랫폼 14단계: 호스트 정산 화면(H08)
-- 정산은 운영진이 만든다(settlement_create). 호스트는 자기가 받을 몫을 본다:
--   · 정산마다 기간 · 상태(정산 예정 / 지급 완료) · 참가비 · 환불 차감 · 수수료 · 지급액, 활동별 나눔
--   · 아직 어떤 정산에도 들어가지 않은 몫(결제 완료 주문 · 처리된 환불), 활동별 나눔
-- 계산은 settlement_create와 같은 규칙이다(수수료 = 주문 금액 × 주문에 적힌 비율, 환불은 그만큼 수수료도 돌려받음).
-- 클럽 활동의 정산 대상이 진행자가 아닐 수 있어서, 활동 관리 화면으로 갈 수 있는지(manageable)를 함께 준다.

create or replace function public.host_settlement_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'auth_required'; end if;

  return jsonb_build_object(
    'settlements', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'period_start', s.period_start, 'period_end', s.period_end,
        'status', s.status, 'paid_at', s.paid_at, 'created_at', s.created_at,
        'gross', s.gross_amount, 'refund', s.refund_amount, 'fee', s.fee_amount, 'payout', s.payout_amount,
        'activities', coalesce((
          select jsonb_agg(x order by x ->> 'title') from (
            select jsonb_build_object(
              'id', a.id, 'title', a.title, 'manageable', public.can_manage_activity(a.id),
              'gross', coalesce(sum(i.amount) filter (where i.amount > 0), 0),
              'refund', coalesce(-sum(i.amount) filter (where i.amount < 0), 0),
              'fee', coalesce(sum(i.fee_amount), 0),
              'payout', coalesce(sum(i.amount - i.fee_amount), 0)
            ) as x
            from public.settlement_items i
            left join public.orders o on o.id = i.order_id
            left join public.refunds r on r.id = i.refund_id
            left join public.orders ro on ro.id = r.order_id
            join public.activities a on a.id = coalesce(o.activity_id, ro.activity_id)
            where i.settlement_id = s.id
            group by a.id, a.title
          ) t
        ), '[]'::jsonb)
      ) order by s.period_end desc, s.created_at desc)
      from public.settlements s
      where s.payee_user_id = v_uid
    ), '[]'::jsonb),
    'unsettled', (
      with items as (
        select o.activity_id, o.amount, round(o.amount * coalesce(o.fee_rate, 0))::integer as fee
        from public.orders o
        where o.payee_user_id = v_uid
          and o.status in ('paid', 'refunded', 'partially_refunded')
          and not exists (select 1 from public.settlement_items i where i.order_id = o.id)
        union all
        select o.activity_id, -r.amount, -round(r.amount * coalesce(o.fee_rate, 0))::integer
        from public.refunds r join public.orders o on o.id = r.order_id
        where o.payee_user_id = v_uid
          and r.status in ('approved', 'paid') and r.amount > 0
          and not exists (select 1 from public.settlement_items i where i.refund_id = r.id)
      )
      select jsonb_build_object(
        'gross', coalesce(sum(amount) filter (where amount > 0), 0),
        'refund', coalesce(-sum(amount) filter (where amount < 0), 0),
        'fee', coalesce(sum(fee), 0),
        'payout', coalesce(sum(amount - fee), 0),
        'activities', coalesce((
          select jsonb_agg(x order by x ->> 'title') from (
            select jsonb_build_object(
              'id', a.id, 'title', a.title, 'manageable', public.can_manage_activity(a.id),
              'gross', coalesce(sum(it.amount) filter (where it.amount > 0), 0),
              'refund', coalesce(-sum(it.amount) filter (where it.amount < 0), 0),
              'fee', coalesce(sum(it.fee), 0),
              'payout', coalesce(sum(it.amount - it.fee), 0)
            ) as x
            from items it join public.activities a on a.id = it.activity_id
            group by a.id, a.title
          ) t
        ), '[]'::jsonb)
      )
      from items
    )
  );
end;
$$;

revoke execute on function public.host_settlement_overview() from public, anon;
grant execute on function public.host_settlement_overview() to authenticated;

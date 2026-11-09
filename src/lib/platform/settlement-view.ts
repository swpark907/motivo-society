// 호스트 정산 화면(H08)의 순수 계산: DB 결과 읽기 · 달별 묶기 · 기간 글자. React·DB 의존 없음.

export type Money = { gross: number; refund: number; fee: number; payout: number };

export type SettlementActivity = Money & { id: string; title: string; manageable: boolean };

export type Settlement = Money & {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: "scheduled" | "paid";
  paidAt: string | null;
  activities: SettlementActivity[];
};

export type SettlementOverview = {
  settlements: Settlement[];
  unsettled: Money & { activities: SettlementActivity[] };
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const str = (v: unknown) => (typeof v === "string" ? v : "");

function money(j: Record<string, unknown>): Money {
  return { gross: num(j.gross), refund: num(j.refund), fee: num(j.fee), payout: num(j.payout) };
}

function activities(v: unknown): SettlementActivity[] {
  return (Array.isArray(v) ? v : []).map((a: Record<string, unknown>) => ({
    ...money(a),
    id: str(a.id),
    title: str(a.title),
    manageable: a.manageable === true,
  }));
}

/** host_settlement_overview(jsonb) → 화면 모양. */
export function parseOverview(raw: unknown): SettlementOverview {
  const j = (raw ?? {}) as Record<string, unknown>;
  const u = (j.unsettled ?? {}) as Record<string, unknown>;
  return {
    settlements: (Array.isArray(j.settlements) ? j.settlements : []).map(
      (s: Record<string, unknown>) => ({
        ...money(s),
        id: str(s.id),
        periodStart: str(s.period_start),
        periodEnd: str(s.period_end),
        status: s.status === "paid" ? ("paid" as const) : ("scheduled" as const),
        paidAt: typeof s.paid_at === "string" ? s.paid_at : null,
        activities: activities(s.activities),
      }),
    ),
    unsettled: { ...money(u), activities: activities(u.activities) },
  };
}

export type MonthGroup = { key: string; label: string; settlements: Settlement[] } & Money;

/** 정산 기간이 끝난 달로 묶는다(최근 달부터). 달마다 합계를 함께. */
export function groupByMonth(list: Settlement[]): MonthGroup[] {
  const map = new Map<string, Settlement[]>();
  for (const s of list) {
    const key = s.periodEnd.slice(0, 7);
    map.set(key, [...(map.get(key) ?? []), s]);
  }
  return [...map]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => ({
      key,
      label: `${key.slice(0, 4)}년 ${Number(key.slice(5, 7))}월`,
      settlements: items,
      gross: items.reduce((n, s) => n + s.gross, 0),
      refund: items.reduce((n, s) => n + s.refund, 0),
      fee: items.reduce((n, s) => n + s.fee, 0),
      payout: items.reduce((n, s) => n + s.payout, 0),
    }));
}

/** 정산 예정 · 지급 완료 합계(지급 완료는 실제로 받은 돈). */
export function totals(list: Settlement[]): { scheduled: number; paid: number } {
  return {
    scheduled: list.filter((s) => s.status === "scheduled").reduce((n, s) => n + s.payout, 0),
    paid: list.filter((s) => s.status === "paid").reduce((n, s) => n + s.payout, 0),
  };
}

/** "10.26 – 11.2" */
export function periodText(start: string, end: string): string {
  const md = (d: string) => (d ? `${Number(d.slice(5, 7))}.${Number(d.slice(8, 10))}` : "");
  return start === end ? md(start) : `${md(start)} – ${md(end)}`;
}

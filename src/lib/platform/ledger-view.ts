// 활동 장부(H07)의 순수 계산: DB 함수 결과 읽기 · 고친 기록 문장. React·DB 의존 없음.

export type LedgerEntry = {
  id: string;
  kind: "expense" | "income";
  amount: number;
  memo: string;
  occurredOn: string;
  /** 관리하는 사람에게만 */
  receiptPath: string | null;
  createdBy: string | null;
};

export type LedgerHistory = { action: string; at: string; actor: string | null; text: string };

export type Ledger =
  | { access: "none" }
  | {
      access: "manager" | "participant";
      public: boolean;
      received: number;
      refunded: number;
      fee: number;
      otherIncome: number;
      expense: number;
      net: number;
      entries: LedgerEntry[];
      /** 관리하는 사람에게만: 받을 돈 · 정산 지급 완료 · 정산 예정 · 아직 정산 전 */
      payout: { total: number; settled: number; scheduled: number; unsettled: number } | null;
      history: LedgerHistory[];
    };

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** activity_ledger(jsonb) → 화면 모양. 모르는 값은 0 · 빈 값으로. */
export function parseLedger(raw: unknown): Ledger {
  const j = (raw ?? {}) as Record<string, unknown>;
  if (j.access !== "manager" && j.access !== "participant") return { access: "none" };
  const entries = (Array.isArray(j.entries) ? j.entries : []).map((e: Record<string, unknown>) => ({
    id: str(e.id),
    kind: e.kind === "income" ? ("income" as const) : ("expense" as const),
    amount: num(e.amount),
    memo: str(e.memo),
    occurredOn: str(e.occurred_on),
    receiptPath: typeof e.receipt_path === "string" ? e.receipt_path : null,
    createdBy: typeof e.created_by === "string" ? e.created_by : null,
  }));
  const manager = j.access === "manager";
  const total = num(j.payout);
  const settled = num(j.settled);
  const scheduled = num(j.scheduled);
  return {
    access: j.access,
    public: j.public === true,
    received: num(j.received),
    refunded: num(j.refunded),
    fee: num(j.fee),
    otherIncome: num(j.other_income),
    expense: num(j.expense),
    net: num(j.net),
    entries,
    payout: manager ? { total, settled, scheduled, unsettled: total - settled - scheduled } : null,
    history: (Array.isArray(j.history) ? j.history : []).map((h: Record<string, unknown>) => ({
      action: str(h.action),
      at: str(h.at),
      actor: typeof h.actor === "string" ? h.actor : null,
      text: historyText(str(h.action), (h.detail ?? {}) as HistoryDetail),
    })),
  };
}

type Snapshot = { kind?: string; amount?: number; memo?: string };
type HistoryDetail = { before?: Snapshot; after?: Snapshot; public?: boolean };

const KIND = (k?: string) => (k === "income" ? "기타 수입" : "지출");
const wonText = (n?: number) => `${(n ?? 0).toLocaleString("ko-KR")}원`;
const line = (s?: Snapshot) => `${KIND(s?.kind)} · ${s?.memo ?? ""} ${wonText(s?.amount)}`;

/** 고친 기록 한 줄. "적음: 지출 · 대관 30,000원" · "고침: … → …" · "지움: …" · "참가자에게 공개". */
export function historyText(action: string, d: HistoryDetail): string {
  switch (action) {
    case "ledger.created":
      return `적음: ${line(d.after)}`;
    case "ledger.updated":
      return `고침: ${line(d.before)} → ${line(d.after)}`;
    case "ledger.deleted":
      return `지움: ${line(d.before)}`;
    case "ledger.visibility":
      return d.public ? "장부를 참가자에게 공개" : "장부를 관리하는 사람만 보게";
    default:
      return action;
  }
}

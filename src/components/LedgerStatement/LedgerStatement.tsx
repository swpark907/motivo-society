import { shortDate } from "@/lib/platform/activity-time";
import type { Ledger } from "@/lib/platform/ledger-view";
import { won } from "@/lib/platform/messages";
import styles from "./LedgerStatement.module.scss";

type Open = Exclude<Ledger, { access: "none" }>;

/**
 * 장부 요약: 참가비 수입 − 환불 − 수수료 + 기타 수입 − 지출 = 남은 돈.
 * 모자라도 경고색을 쓰지 않는다(무료 모임에서 호스트가 비용을 내는 건 흔한 일이라) — 부호로만 말한다.
 * 호스트 관리 화면과 (공개된 장부의) 참가자 화면이 같은 모양을 쓴다. 0원인 줄은 빼서 짧게.
 */
export function LedgerStatement({ ledger }: { ledger: Open }) {
  const rows: { label: string; amount: number; sign: "+" | "−" }[] = [
    { label: "참가비 수입", amount: ledger.received, sign: "+" as const },
    { label: "환불", amount: ledger.refunded, sign: "−" as const },
    { label: "수수료", amount: ledger.fee, sign: "−" as const },
    { label: "기타 수입", amount: ledger.otherIncome, sign: "+" as const },
    { label: "지출", amount: ledger.expense, sign: "−" as const },
  ].filter((r) => r.amount !== 0);

  return (
    <dl className={styles.statement}>
      {rows.map((r) => (
        <div key={r.label}>
          <dt>{r.label}</dt>
          <dd>
            {r.sign} {won(r.amount)}
          </dd>
        </div>
      ))}
      <div className={styles.total}>
        <dt>남은 돈</dt>
        <dd>{ledger.net < 0 ? `− ${won(-ledger.net)}` : won(ledger.net)}</dd>
      </div>
    </dl>
  );
}

/** 장부 항목 한 줄의 앞부분: "11.9 (일) · 지출" */
export function entryMeta(e: { occurredOn: string; kind: string }): string {
  const day = e.occurredOn ? shortDate(new Date(`${e.occurredOn}T00:00:00+09:00`)) : "";
  return `${day} · ${e.kind === "income" ? "기타 수입" : "지출"}`;
}

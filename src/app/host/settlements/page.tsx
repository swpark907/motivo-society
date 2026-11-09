import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { shortDate } from "@/lib/platform/activity-time";
import { getSettlementOverview } from "@/lib/platform/host";
import { won } from "@/lib/platform/messages";
import { requireUser } from "@/lib/platform/session";
import {
  groupByMonth,
  periodText,
  totals,
  type Money,
  type SettlementActivity,
} from "@/lib/platform/settlement-view";
import s from "./settlements.module.scss";

export const metadata: Metadata = {
  title: "정산",
  robots: { index: false },
};

export default async function SettlementsPage() {
  await requireUser("/host/settlements");
  const o = await getSettlementOverview();
  const t = totals(o.settlements);
  const months = groupByMonth(o.settlements);
  const hasUnsettled = o.unsettled.activities.length > 0;

  return (
    <PlatformPage
      label="HOST · SETTLEMENT"
      title="정산"
      lead="운영진이 입금을 확인한 참가비에서 환불과 수수료를 빼고 정산해요. 수수료는 주문에 적힌 비율로 계산해요."
      back={{ href: "/host", label: "호스트 도구" }}
    >
      {o.settlements.length === 0 && !hasUnsettled ? (
        <EmptyState
          title="정산할 참가비가 아직 없어요"
          body="유료 활동에서 입금이 확인되면 여기에 쌓여요. 무료 활동의 돈은 활동별 장부에서 봐요."
          action={{ href: "/host", label: "내가 연 활동 보기" }}
        />
      ) : (
        <>
          <dl className={s.tiles} aria-label="정산 요약">
            <div>
              <dt>아직 정산 전</dt>
              <dd>{signed(o.unsettled.payout)}</dd>
            </div>
            <div>
              <dt>정산 예정</dt>
              <dd>{won(t.scheduled)}</dd>
            </div>
            <div>
              <dt>지급 완료</dt>
              <dd>{won(t.paid)}</dd>
            </div>
          </dl>

          {hasUnsettled && (
            <section className={s.section} aria-labelledby="unsettled-h">
              <h2 id="unsettled-h">아직 정산 전</h2>
              <p className={s.hint}>
                입금이 확인됐지만 아직 어느 정산에도 들어가지 않은 몫이에요. 운영진이 정산을 만들면
                정산 예정으로 옮겨 가요.
                {o.unsettled.payout < 0 &&
                  " 이미 지급된 참가비를 나중에 환불해서 마이너스예요. 다음 정산에서 빠져요."}
              </p>
              <div className={s.card}>
                <MoneyLines m={o.unsettled} />
                <ActivityList list={o.unsettled.activities} />
              </div>
            </section>
          )}

          {months.map((m) => (
            <section key={m.key} className={s.section} aria-labelledby={`m-${m.key}`}>
              <h2 id={`m-${m.key}`}>
                {m.label} <span>{won(m.payout)}</span>
              </h2>
              {m.settlements.map((x) => (
                <article
                  key={x.id}
                  className={s.card}
                  aria-label={`${periodText(x.periodStart, x.periodEnd)} 정산`}
                >
                  <header className={s.cardHead}>
                    <strong>{periodText(x.periodStart, x.periodEnd)} 정산</strong>
                    <StatusBadge
                      status={x.status === "paid" ? "paid" : "scheduled"}
                      label={
                        x.status === "paid"
                          ? `지급 완료${x.paidAt ? ` · ${shortDate(new Date(x.paidAt))}` : ""}`
                          : "정산 예정"
                      }
                    />
                  </header>
                  <MoneyLines m={x} />
                  <ActivityList list={x.activities} />
                </article>
              ))}
            </section>
          ))}
        </>
      )}
    </PlatformPage>
  );
}

/** 모자란 금액도 다른 줄과 같은 "− 1,000원" 꼴로. */
function signed(n: number): string {
  return n < 0 ? `− ${won(-n)}` : won(n);
}

function MoneyLines({ m }: { m: Money }) {
  return (
    <dl className={s.lines}>
      <div>
        <dt>참가비</dt>
        <dd>{won(m.gross)}</dd>
      </div>
      {m.refund > 0 && (
        <div>
          <dt>환불 차감</dt>
          <dd>− {won(m.refund)}</dd>
        </div>
      )}
      <div>
        <dt>수수료</dt>
        <dd>− {won(m.fee)}</dd>
      </div>
      <div className={s.payout}>
        <dt>받을 돈</dt>
        <dd>{signed(m.payout)}</dd>
      </div>
    </dl>
  );
}

function ActivityList({ list }: { list: SettlementActivity[] }) {
  if (list.length === 0) return null;
  return (
    <ul className={s.activities} aria-label="활동별">
      {list.map((a) => (
        <li key={a.id}>
          {a.manageable ? (
            <Link href={`/host/activities/${a.id}#ledger`}>{a.title}</Link>
          ) : (
            <span>{a.title}</span>
          )}
          <small>
            참가비 {won(a.gross)}
            {a.refund > 0 && ` · 환불 − ${won(a.refund)}`} · 수수료 − {won(a.fee)}
          </small>
          <strong>{signed(a.payout)}</strong>
        </li>
      ))}
    </ul>
  );
}

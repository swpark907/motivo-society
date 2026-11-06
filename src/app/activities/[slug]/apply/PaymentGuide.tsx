"use client";

// 클라이언트 컴포넌트인 이유: 계좌번호·입금자명 복사(클립보드)와 남은 시간을 1분마다 다시 센다.
import { useEffect, useState } from "react";
import { timeLeftText } from "@/lib/platform/activity-time";
import s from "./apply.module.scss";

type Props = {
  amount: string;
  bankNote: string;
  account: string;
  depositor: string;
  dueAt: string;
  dueLabel: string;
  orderNo: string;
  /** 서버가 그린 시각. 첫 화면을 서버와 같게 그려 하이드레이션이 어긋나지 않게 한다. */
  renderedAt: string;
};

export function PaymentGuide({
  amount,
  bankNote,
  account,
  depositor,
  dueAt,
  dueLabel,
  orderNo,
  renderedAt,
}: Props) {
  const [now, setNow] = useState(() => new Date(renderedAt));
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);
  const left = timeLeftText(new Date(dueAt), now);

  return (
    <dl className={s.payment}>
      <div>
        <dt>입금할 금액</dt>
        <dd className={s.amount}>{amount}</dd>
      </div>
      <div>
        <dt>계좌</dt>
        <dd>
          <span>{bankNote}</span>
          <CopyButton value={account} label="계좌번호 복사" />
        </dd>
      </div>
      <div>
        <dt>입금자명</dt>
        <dd>
          <strong>{depositor}</strong>
          <CopyButton value={depositor} label="입금자명 복사" />
        </dd>
      </div>
      <div>
        <dt>기한</dt>
        <dd className={s.due}>
          <strong>{left ?? "기한이 지났어요"}</strong>
          <span>{dueLabel}까지</span>
        </dd>
      </div>
      <div>
        <dt>주문 번호</dt>
        <dd>{orderNo}</dd>
      </div>
    </dl>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      window.prompt("복사해 주세요", value);
    }
  }
  return (
    <button type="button" className={s.copy} onClick={copy} aria-live="polite">
      {done ? "복사했어요" : label}
    </button>
  );
}

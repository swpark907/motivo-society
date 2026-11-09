import { deleteMedia, uploadMedia } from "./host-media";
import { parseLedger, type Ledger } from "./ledger-view";
import { errorCodeFrom } from "./messages";
import { getCurrentUser } from "./session";
import { createSessionClient } from "./supabase-server";

// 활동 장부(H07). 계산과 보기 권한은 DB 함수 activity_ledger가 정한다.

export async function getLedger(activityId: string): Promise<Ledger> {
  const supabase = await createSessionClient();
  const { data } = await supabase.rpc("activity_ledger", { p_activity: activityId });
  return parseLedger(data);
}

export type LedgerInput = {
  kind: "expense" | "income";
  amount: number;
  memo: string;
  occurredOn: string;
  /** 새 영수증 사진(있으면 내 보관함에 영수증으로 올려 붙인다) */
  receipt: File | null;
};

/** 적거나(id 없음) 고친다. 새 영수증이 있으면 먼저 올리고 붙인다(없으면 붙어 있던 것을 둔다). */
export async function saveLedgerEntry(
  activityId: string,
  input: LedgerInput,
  id?: string,
): Promise<string | null> {
  let receipt: string | null = null;
  if (input.receipt && input.receipt.size > 0) {
    const user = await getCurrentUser();
    if (!user) return "auth_required";
    const up = await uploadMedia(
      input.receipt,
      { kind: "user", id: user.id },
      `영수증 · ${input.memo}`.slice(0, 120),
      "receipt",
    );
    if ("error" in up) return up.error;
    receipt = up.id;
  }
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("ledger_entry_save", {
    p_activity: activityId,
    p_kind: input.kind,
    p_amount: input.amount,
    p_memo: input.memo,
    p_occurred_on: input.occurredOn,
    ...(receipt ? { p_receipt: receipt } : {}),
    ...(id ? { p_id: id } : {}),
  });
  if (error) {
    // 방금 올린 영수증은 항목이 저장되지 않았으면 되돌려 지운다(어디에도 안 보이는 파일이 남지 않게).
    if (receipt) await deleteMedia(receipt);
    return errorCodeFrom(error.message);
  }
  return null;
}

export async function deleteLedgerEntry(id: string): Promise<string | null> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("ledger_entry_delete", { p_id: id });
  return error ? errorCodeFrom(error.message) : null;
}

export async function setLedgerPublic(activityId: string, open: boolean): Promise<string | null> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("activity_set_ledger_public", {
    p_activity: activityId,
    p_public: open,
  });
  return error ? errorCodeFrom(error.message) : null;
}

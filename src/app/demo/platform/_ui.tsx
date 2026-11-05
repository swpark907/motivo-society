import { errorMessage, noticeMessage, statusTone } from "@/lib/platform/messages";
import styles from "./sandbox.module.scss";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function Notice({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const notice = typeof params.notice === "string" ? noticeMessage(params.notice) : null;
  if (error) {
    return (
      <p className={styles.noticeError} role="alert">
        {errorMessage(error)}
      </p>
    );
  }
  if (notice) {
    return (
      <p className={styles.notice} role="status">
        {notice}
      </p>
    );
  }
  return null;
}

export function ReturnTo({ path }: { path: string }) {
  return <input type="hidden" name="returnTo" value={path} />;
}

/** 상태 배지. 라벨은 화면 문구, 모양은 상태의 성격(statusTone)으로 정한다. */
export function Badge({ status, label }: { status: string; label: string | undefined }) {
  return <span className={styles[`badge_${statusTone(status)}`]}>{label ?? status}</span>;
}

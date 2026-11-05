import { createSessionClient } from "@/lib/platform/supabase-server";
import { Notice, type SearchParams } from "../_ui";
import styles from "../sandbox.module.scss";

const ACTION_LABELS: Record<string, string> = {
  "participation.applied": "신청",
  "participation.cancelled": "신청 취소",
  "participation.promoted": "대기 → 자동 확정",
  "participation.approved": "승인",
  "participation.rejected": "거절",
  "attendance.marked": "출석 체크",
  "order.created": "주문 생성(입금 대기)",
  "order.paid": "입금 확인",
  "order.expired": "입금 기한 만료",
  "refund.requested": "환불 요청",
  "refund.approved": "환불 승인",
  "refund.rejected": "환불 거절",
  "refund.paid": "환불 송금",
  "settlement.created": "정산 생성",
  "settlement.paid": "정산 지급",
  "certification.rejected": "인증 반려",
  "challenge.finalized": "챌린지 종료·완주 판정",
  "activity.created": "활동 만들기(초안)",
  "activity.published": "활동 공개",
  "club.created": "클럽 만들기",
  "club.joined": "클럽 가입",
  "club.join_requested": "클럽 가입 신청",
  "club.left": "클럽 탈퇴",
  "club.member_approved": "가입 승인",
  "club.member_rejected": "가입 거절",
  "club.layer_assigned": "레이어 지정",
  "club.member_banned": "강퇴",
  "club.layer_created": "레이어 추가",
  "club.layer_updated": "레이어 수정",
  "club.layer_deleted": "레이어 삭제",
  "club.invite_created": "초대 코드 생성",
};

const timeFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export default async function AuditLogPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createSessionClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select(
      "id, action, detail, created_at, actor:profiles!audit_logs_actor_id_fkey(nickname), target:profiles!audit_logs_target_user_id_fkey(nickname), activity:activities(title), club:clubs(name)",
    )
    .order("id", { ascending: false })
    .limit(100);

  return (
    <>
      <Notice searchParams={searchParams} />
      <h1 className={styles.title}>운영 기록</h1>
      <p className={styles.muted}>
        상태를 바꾼 모든 행동이 남아요. 회원 정보 열람 권한이 있는 운영진(지금은 소유자)만 볼 수
        있어요.
      </p>
      {!logs || logs.length === 0 ? (
        <p className={styles.muted}>
          보이는 기록이 없어요. 소유자가 아니면 비어 보이는 게 정상이에요.
        </p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">시각</th>
              <th scope="col">누가</th>
              <th scope="col">무엇을</th>
              <th scope="col">대상</th>
              <th scope="col">활동·클럽</th>
              <th scope="col">결과</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className={styles.nowrap}>{timeFormat.format(new Date(l.created_at))}</td>
                <td>{l.actor?.nickname ?? "시스템"}</td>
                <td>{ACTION_LABELS[l.action] ?? l.action}</td>
                <td>{l.target?.nickname ?? "-"}</td>
                <td>{l.activity?.title ?? l.club?.name ?? "-"}</td>
                <td>
                  <code>{JSON.stringify(l.detail)}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

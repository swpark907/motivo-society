/** DB 함수가 올리는 오류 코드와 상태 값을 화면 문구로 바꾼다. */

const ERROR_MESSAGES: Record<string, string> = {
  auth_required: "로그인이 필요해요.",
  account_inactive: "이용이 멈춘 계정이에요.",
  not_found: "볼 수 없는 활동이에요.",
  session_has_no_own_apply: "회차는 따로 신청하지 않아요. 시즌에 신청해 주세요.",
  not_open: "지금은 신청을 받지 않아요.",
  not_open_yet: "아직 신청이 열리지 않았어요.",
  apply_closed: "신청 기간이 끝났어요.",
  members_only: "클럽 멤버만 신청할 수 있는 모임이에요.",
  entitlement_required: "앞선 활동에 참가한 사람(이용권 보유자)만 신청할 수 있어요.",
  refund_required: "결제가 끝난 참가는 취소 대신 환불 요청으로 진행해요.",
  order_not_pending: "입금 대기 중인 주문이 아니에요.",
  participation_missing: "주문에 연결된 참가 신청을 찾지 못했어요.",
  order_not_paid: "결제가 끝난 주문만 환불을 요청할 수 있어요.",
  refund_exists: "이미 진행 중인 환불 요청이 있어요.",
  refund_not_requested: "요청 상태의 환불이 아니에요.",
  refund_not_approved: "승인된 환불만 송금 완료로 바꿀 수 있어요.",
  nothing_to_settle: "이 기간에 정산할 주문이나 환불이 없어요.",
  settlement_not_scheduled: "정산 예정 상태가 아니에요.",
  not_challenge: "챌린지가 아니에요.",
  outside_period: "챌린지 기간이 아니에요.",
  empty_cert: "인증 내용을 적어 주세요.",
  format_not_allowed: "이 챌린지에서 받지 않는 인증 형식이에요.",
  invalid_link: "링크는 http:// 또는 https://로 시작해야 해요.",
  cert_rejected: "오늘 인증은 반려됐어요. 진행자에게 문의해 주세요.",
  reason_required: "반려 사유를 적어 주세요.",
  not_ended_yet: "종료일이 지나야 완주를 판정할 수 있어요.",
  host_required: "클럽은 호스트 자격이 있는 사람만 만들 수 있어요.",
  invalid_slug: "주소는 영어 소문자·숫자·하이픈 3~41자로 적어 주세요.",
  slug_taken: "이미 쓰는 주소예요.",
  name_required: "이름을 적어 주세요.",
  banned: "이 클럽에서 강퇴되어 다시 가입할 수 없어요.",
  already_member: "이미 가입했거나 가입 신청 중이에요.",
  invite_invalid: "쓸 수 없는 초대 코드예요(만료·취소·횟수 초과).",
  not_member: "클럽 멤버가 아니에요.",
  last_admin: "마지막 관리자예요. 다른 사람에게 관리자를 넘긴 뒤에 나갈 수 있어요.",
  cannot_manage_higher: "나와 같거나 위 레이어인 사람은 관리할 수 없어요.",
  cannot_assign_higher: "나와 같거나 위 레이어로는 지정할 수 없어요.",
  cannot_grant_unowned: "내가 갖지 않은 권한이 있는 레이어로는 지정할 수 없어요.",
  cannot_ban_self: "자기 자신은 강퇴할 수 없어요.",
  admin_only: "레이어는 관리자만 고칠 수 있어요.",
  too_many_layers: "레이어는 최대 6개예요.",
  invalid_rank: "순서는 1~8 사이로 적어 주세요(작을수록 위).",
  rank_taken: "같은 순서의 레이어가 이미 있어요.",
  fixed_layer: "관리자·멤버 레이어는 지울 수 없어요.",
  nickname_invalid: "닉네임은 2~12자의 한글·영문·숫자·밑줄(_)로 지어 주세요.",
  nickname_taken: "이미 누가 쓰고 있는 닉네임이에요.",
  interests_count: "관심사를 1개 이상, 5개 이하로 골라 주세요.",
  interest_invalid: "고를 수 없는 관심사가 섞여 있어요. 새로고침한 뒤 다시 골라 주세요.",
  invalid_kind: "활동 종류를 골라 주세요.",
  title_required: "제목을 적어 주세요.",
  invalid_price: "참가비는 0원 이상이에요.",
  invalid_capacity: "정원은 1명 이상이에요.",
  no_create_permission: "이 클럽에서 활동을 열 권한(모임·시즌·챌린지 열기)이 없어요.",
  payee_not_paid_host: "유료 활동의 정산 대상은 이 클럽의 유료 호스트여야 해요.",
  paid_host_required: "유료 활동이나 시즌은 유료 호스트만 열 수 있어요.",
  invalid_organizer: "주최를 골라 주세요.",
  members_only_needs_club: "멤버 전용은 클럽 주최 활동에서만 고를 수 있어요.",
  required_activity_missing: "참가 자격이 될 이전 활동을 골라 주세요.",
  schedule_required: "일정을 적어 주세요.",
  starts_in_past: "시작이 이미 지났어요.",
  ends_before_start: "끝이 시작보다 빨라요.",
  invalid_threshold: "완주 조건(인증 횟수)을 1 이상으로 적어 주세요.",
  threshold_over_days: "매일 인증이면 완주 조건이 기간 일수보다 클 수 없어요.",
  invalid_session_count: "회차는 2~12개예요.",
  invalid_session_gap: "회차 간격은 1일 이상, 길이는 10분 이상이에요.",
  not_draft: "이미 공개된 활동이에요.",
  already_applied: "이미 신청했어요.",
  not_applied: "신청한 기록이 없어요.",
  activity_finished: "끝났거나 취소된 활동이에요.",
  forbidden: "이 활동을 관리할 권한이 없어요.",
  not_pending: "승인 대기 중인 신청이 아니에요.",
  invalid_status: "알 수 없는 출석 상태예요.",
  not_gathering: "출석은 모임에서만 체크해요.",
  too_early_to_check: "출석은 시작 1시간 전부터 체크할 수 있어요.",
  not_confirmed: "확정된 참가자만 출석을 체크할 수 있어요.",
};

const NOTICE_MESSAGES: Record<string, string> = {
  confirmed: "참가가 확정됐어요.",
  waitlisted: "정원이 차서 대기 명단에 올랐어요. 자리가 나면 순서대로 확정돼요.",
  pending_approval: "신청했어요. 주최 측이 승인하면 확정돼요.",
  pending_payment: "자리를 잡았어요. 입금 기한 안에 입금하면 운영진 확인 뒤 확정돼요.",
  paid: "입금을 확인했어요. 참가 확정과 이용권 발급까지 끝났어요.",
  expired: "기한이 지난 입금 대기를 만료 처리했어요.",
  refund_requested: "환불을 요청했어요. 운영진이 처리하면 알려 드려요.",
  refund_decided: "환불 요청을 처리했어요.",
  refund_paid: "환불 송금 완료로 표시했어요.",
  settlement_created: "정산을 만들었어요.",
  settlement_paid: "정산 지급 완료로 표시했어요.",
  cert_submitted: "오늘 인증을 올렸어요.",
  cert_rejected: "인증을 반려했어요. 사유가 참가자에게 보여요.",
  finalized: "챌린지를 종료하고 완주를 판정했어요.",
  club_created: "클럽을 만들었어요. 관리자·운영진·멤버 레이어가 함께 생겼어요.",
  active: "클럽에 가입했어요.",
  pending: "가입을 신청했어요. 운영진이 승인하면 멤버가 돼요.",
  club_left: "클럽에서 나왔어요.",
  member_decided: "가입 신청을 처리했어요.",
  layer_assigned: "레이어를 바꿨어요.",
  member_banned: "강퇴했어요. 이 사람은 다시 가입할 수 없어요.",
  layer_saved: "레이어를 저장했어요.",
  layer_deleted: "레이어를 지웠어요. 그 레이어 사람들은 멤버로 내려갔어요.",
  invite_created: "초대 코드를 만들었어요.",
  invite_joined: "초대 코드로 바로 가입했어요.",
  activity_created: "초안으로 만들었어요. 확인하고 공개하면 목록에 보여요.",
  published: "공개했어요. 이제 신청을 받아요.",
  published_running: "공개했어요. 이미 시작일이 지나 진행 중으로 열렸어요.",
  cancelled: "신청을 취소했어요.",
  decided: "처리했어요.",
  marked: "출석을 기록했어요.",
  reseeded: "가짜 데이터를 처음 상태로 되돌렸어요.",
  switched: "사람을 바꿨어요.",
};

export function errorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? `처리하지 못했어요 (${code}).`;
}

export function noticeMessage(code: string): string | null {
  return NOTICE_MESSAGES[code] ?? null;
}

/** Postgres 예외 메시지(`raise exception 'code'`)에서 코드만 꺼낸다. */
export function errorCodeFrom(message: string | undefined): string {
  const code = (message ?? "").trim();
  return /^[a-z_]+$/.test(code) ? code : "unknown";
}

export const PARTICIPATION_LABELS: Record<string, string> = {
  pending_approval: "승인 대기",
  pending_payment: "입금 대기",
  waitlisted: "대기 명단",
  confirmed: "확정",
  cancelled: "취소",
};

export const ACTIVITY_STATUS_LABELS: Record<string, string> = {
  draft: "작성 중",
  open: "모집 중",
  closed: "모집 마감",
  in_progress: "진행 중",
  ended: "종료",
  cancelled: "취소됨",
};

export const KIND_LABELS: Record<string, string> = {
  gathering: "모임",
  series: "시즌",
  challenge: "챌린지",
};

export const ORGANIZER_LABELS: Record<string, string> = {
  club: "클럽 주최",
  host: "개인 호스트",
  official: "공식",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "입금 대기",
  paid: "결제 완료",
  cancelled: "입금 전 취소",
  expired: "기한 만료",
  refunded: "환불 완료",
  partially_refunded: "부분 환불",
};

export const REFUND_STATUS_LABELS: Record<string, string> = {
  requested: "요청됨",
  approved: "승인 (송금 전)",
  rejected: "거절",
  paid: "송금 완료",
};

export function won(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

/** 클럽 레이어 권한 — 플랫폼이 정한 목록(명세 3절). DB CHECK와 같은 값이어야 한다. */
export const CLUB_PERMISSIONS = [
  { id: "club.edit", group: "클럽", label: "클럽 정보 수정" },
  { id: "space.manage", group: "클럽", label: "공간 만들기·설정" },
  { id: "member.approve", group: "사람", label: "가입 승인" },
  { id: "member.ban", group: "사람", label: "강퇴" },
  { id: "member.assign_layer", group: "사람", label: "레이어 지정" },
  { id: "invite.create", group: "사람", label: "초대 링크 만들기" },
  { id: "activity.create", group: "활동", label: "모임·시즌·챌린지 열기" },
  { id: "notice.write", group: "활동", label: "공지 쓰기" },
  { id: "post.moderate", group: "활동", label: "글 고정·숨기기" },
  { id: "participant.contact", group: "민감", label: "참가자 연락처 보기" },
  { id: "participant.manage", group: "민감", label: "참가 확정·취소 처리" },
] as const;

export function permissionLabel(id: string): string {
  return CLUB_PERMISSIONS.find((p) => p.id === id)?.label ?? id;
}

/**
 * 상태 값의 성격. 화면은 이것으로 배지 모양만 정한다.
 * done = 진행됐거나 유효함 · wait = 누군가의 다음 행동을 기다림 · off = 끝났거나 빠짐
 */
export type StatusTone = "done" | "wait" | "off";

const DONE = ["confirmed", "paid", "attended", "completed", "active", "open", "in_progress"];
const WAIT = [
  "pending",
  "pending_approval",
  "pending_payment",
  "waitlisted",
  "requested",
  "approved",
  "draft",
  "scheduled",
];

export function statusTone(status: string): StatusTone {
  if (DONE.includes(status)) return "done";
  if (WAIT.includes(status)) return "wait";
  return "off";
}

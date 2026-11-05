# 플랫폼 DB 구조 설계 (초안)

2026-11-03. [기능 명세](../product/platform-functional-spec.md)를 테이블 구조로 옮긴 첫 설계다. 명세 13절의 남은 결정은 **제안 기본값**으로 두고 설계했다. 기본값이 바뀌면 영향받는 곳을 각 절의 "기본값 의존"에 적었다.

- 범위: 테이블, 주요 열, 관계, 상태, 권한 검사 방식, 기존 운영 스키마에서 옮겨 가는 길. SQL 마이그레이션은 이 설계를 맞춘 뒤 개발 프로젝트에서 작성한다.
- 이름은 영어 snake_case, 화면 용어는 가칭 그대로 쓴다.
- 기준 스키마: [운영 스키마 검토](supabase-current-schema-review.md)(2026-11-01 덤프).

---

## 1. 설계 원칙

1. **모임·시즌·챌린지는 한 테이블(`activities`)에 담는다.** 셋은 신청 → 확정 → 참여 → 후기라는 같은 흐름을 쓴다(대략 기획 5절). 주문, 이용권, 참가, 대화가 "무엇에 대한 것인지"를 하나의 외래 키로 가리킬 수 있다. 종류별로 다른 항목만 따로 둔다.
2. **참여 자격은 이용권(`entitlements`) 한 곳에서 판정한다.** 무료 참가, 결제, 초대, 운영 부여, 수료가 모두 이용권을 만든다.
3. **"무엇에 대한 것"은 진짜 외래 키로 건다.** `target_type + target_id` 문자열 대신, 가능한 대상마다 nullable 외래 키를 두고 "정확히 하나만 채운다"는 CHECK를 건다. 지워진 대상을 가리키는 고아 행을 DB가 막는다.
4. **지우지 않고 상태로 남긴다.** 결제·참여가 걸린 행은 `status`로 닫는다. 글·댓글은 `deleted_at`을 채우고 본문을 비운다.
5. **누가 언제를 남긴다.** 상태를 바꾸는 행동은 해당 행의 `*_by`, `*_at` 열과 `audit_logs`에 함께 남긴다.
6. **민감 정보는 따로 둔다.** 실명·전화·계좌, 화상 링크·상세 주소는 별도 테이블에 두고, 일반 조회 경로에서 아예 읽히지 않게 한다.
7. **공통 열.** `id uuid`(기본 `gen_random_uuid()`), `created_at`, `updated_at`(`timestamptz`, 표준시 저장). 금액은 원 단위 정수(`integer`). 날짜만 의미 있는 값(챌린지 인증일)은 한국 시간 기준 `date`로 저장한다.

---

## 2. 한눈에 보기

```text
 계정 ─ profiles · profile_private · interests · platform_staff
   │
   ├─ 호스트 ─ host_applications · hosts · host_payout_accounts
   │
   ├─ 클럽 ─ clubs · club_layers · club_members · club_invites
   │           │
   │           └─ 공간 ─ spaces · posts · comments · reactions
   │                       ▲ (활동 대화도 같은 공간 구조를 쓴다)
   ├─ 활동 ─ activities ─┬─ gathering_details · activity_private
   │   (모임·시즌·챌린지) ├─ challenge_details · challenge_missions · certifications
   │                     ├─ activity_hosts · participations · attendances · reviews
   │                     │
   ├─ 클래스 ─ classes · lesson_progress · class_states · class_attachments
   │                     │
   └─ 거래 ─ orders · refunds · refund_policies ──▶ entitlements ◀── (활동·클래스 자격 판정)
             settlements · settlement_items

 운영 ─ notifications · notification_settings · reports · sanctions · user_blocks
        curated_picks · audit_logs
```

---

## 3. 계정과 권한

### `profiles` — 공개 프로필 (기존 테이블을 키운다)

| 열                                              | 내용                                                   |
| ----------------------------------------------- | ------------------------------------------------------ |
| `id`                                            | `auth.users.id`와 같다                                 |
| `nickname`                                      | `citext`, **고유**                                     |
| `avatar_path`, `bio`, `links`(text[], 최대 3개) | 꾸미기                                                 |
| `show_clubs`                                    | 참여 클럽을 공개 프로필에 보일지                       |
| `onboarded_at`                                  | 닉네임·관심사 선택을 마친 시각. 비어 있으면 온보딩으로 |
| `status`                                        | `active` / `suspended` / `withdrawn`                   |

- 탈퇴하면 `status = withdrawn`, 닉네임을 "탈퇴한 사용자"로 바꾸고 꾸미기를 비운다. 글은 남는다.
- 기본값 의존: 닉네임 중복 불가. 허용으로 바뀌면 고유 제약만 뺀다.

### `profile_private` — 필요한 순간에만 받는 본인 정보

`user_id`(PK), `real_name`, `phone`, `birth_year`, `verified_at`(나중 본인 인증용 자리).

- 본인과, "회원 정보 열람" 권한이 있는 운영진만 읽는다. 운영진이 읽으면 `audit_logs`에 남긴다.
- 모임 주최자가 참가자 연락처를 볼 때도 직접 읽지 않고, 권한을 확인하고 기록을 남기는 함수로만 읽는다.

### `interests`, `profile_interests`

- `interests`: `slug`(고유), `name`, `sort_order`, `is_active`. 소유자가 관리한다.
- `profile_interests`: `(user_id, interest_id)`. 1~5개 제한은 명령 계층에서 검사한다.
- 클럽·활동의 관심사 태그도 같은 `interests`를 쓴다(`club_interests`, `activity_interests`).

### `platform_staff` — 플랫폼 운영진

`user_id`(PK), `role`(지금은 `owner` 하나), `granted_by`, `granted_at`.

- 역할 → 동작별 권한(`content`, `community`, `commerce`, `member_data`) 대응은 코드 상수 한 곳(`src/lib/auth/`)에 둔다. 서버는 역할 이름이 아니라 권한으로 검사한다.
- DB 함수 `has_platform_permission(permission)`을 같은 대응으로 만들어 RLS에서 쓴다.
- 기존 `profiles.member_role = 'staff'`, `motivo_admins`와의 관계는 8절.

---

## 4. 호스트

| 테이블                 | 내용                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `host_applications`    | `user_id`, `requested_tier`(`basic` / `paid`), 하고 싶은 것, 자기소개, 참고 링크, `status`(`pending` / `approved` / `rejected`), `reviewed_by`, `reviewed_at`, `review_note` |
| `hosts`                | `user_id`(PK), `tier`(`basic` / `paid`), `status`(`active` / `suspended`), `approved_at`, `suspended_at`, `suspended_reason`                                                 |
| `host_payout_accounts` | `user_id`(PK), 예금주, 은행, 계좌번호(암호화), 사업자 여부, 사업자 번호(선택), `updated_at`                                                                                  |

- 신청 이력은 `host_applications`에 쌓고, 현재 자격은 `hosts` 한 행으로 본다. 기본 → 유료 승급도 새 신청 한 건이다.
- 계좌번호는 Supabase Vault(또는 pgsodium)로 암호화해 저장하고, 정산 처리 화면에서만 복호화한다. 방식은 개발 프로젝트에서 확인한다.
- 결정 대기(명세 2절): 유료 호스트에게 받을 정보가 정해지면 이 테이블 열만 바뀐다.

---

## 5. 클럽과 공간

### 클럽

| 테이블           | 주요 열                                                                                                                                                                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clubs`          | `slug`(고유, URL 영구), `name`, `tagline`, `description`, `cover_path`, `region`(nullable), `join_mode`(`open` / `approval`), `join_questions`(jsonb, 최대 3개), `visibility`(`public` / `members`), `member_limit`, `status`(`active` / `archived` / `suspended`), `created_by` |
| `club_layers`    | `club_id`, `name`, `rank`(작을수록 높다, 관리자 0), `kind`(`admin` / `custom` / `member`), `permissions`(text[])                                                                                                                                                                 |
| `club_members`   | `(club_id, user_id)`, `layer_id`, `status`(`pending` / `active` / `left` / `banned`), `join_answers`(jsonb), `joined_at`, `invite_id`, `decided_by`, `decided_at`                                                                                                                |
| `club_invites`   | `club_id`, `code`(고유), `created_by`, `expires_at`, `max_uses`, `used_count`, `revoked_at`                                                                                                                                                                                      |
| `club_interests` | `(club_id, interest_id)`, 1~3개                                                                                                                                                                                                                                                  |

- **권한 목록**은 플랫폼이 정의한 값만 허용한다: `club.edit`, `space.manage`, `member.approve`, `member.ban`, `member.assign_layer`, `invite.create`, `activity.create`, `notice.write`, `post.moderate`, `participant.contact`, `participant.manage`. `permissions <@ array[...]` CHECK로 강제한다.
- 레이어 수 상한(6개), "자기보다 아래 레이어만 관리", "자기가 가진 권한만 부여", "마지막 관리자 탈퇴 불가"는 DB 함수(`club_assign_layer` 등) 안에서 한 트랜잭션으로 검사한다. 화면에서 우회할 수 없게 하기 위해서다.
- 클럽을 만들면 함수 하나가 관리자·운영진·멤버 레이어, 공지·자유 공간, 만든 사람의 관리자 멤버십을 함께 만든다.
- `banned` 행을 남겨 두어 재가입을 막는다.
- 클럽 주최 유료 활동의 정산 대상은 클럽이 아니라 활동마다 정한다(6절 `payee_user_id`, 2026-11-04 확정).
- 기본값 의존: 관리자 계정이 탈퇴·정지되면 다음 레이어의 가장 오래된 멤버가 승계(`joined_at` 순). 클럽 가입 수 제한 없음.

### 공간 — 클럽 게시판과 활동 대화를 같은 구조로

| 테이블      | 주요 열                                                                                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spaces`    | 주인(`club_id` 또는 `activity_id`, 정확히 하나), `name`, `description`, `kind`(`general` / `notice` / `showcase` / `activity_chat` / `activity_qna`), `sort_order`, `read_scope`, `write_min_rank` |
| `posts`     | `space_id`, `author_id`, `title`, `body`, `images`(text[], 최대 10), `links`, `showcase_url`, `pinned_at`, `hidden_at`, `hidden_by`, `curation_candidate_at`, `deleted_at`                         |
| `comments`  | 대상(`post_id` 또는 `certification_id`, 정확히 하나), `author_id`, `body`, `parent_id`(한 단계 답글), `hidden_at`, `deleted_at`                                                                    |
| `reactions` | 대상(`post_id` / `comment_id` / `certification_id` 중 하나), `user_id`, `kind`(지금은 `like`), 대상·사용자별 고유                                                                                  |

- `read_scope`: `public`(누구나) / `members`(클럽 멤버) / `participants`(활동의 확정 참가자와 진행자).
- **활동 대화는 활동이 주인인 공간 두 개로 만든다.** 참가자 대화(`activity_chat`, `participants`)와 공개 문의(`activity_qna`, `public`, 쓰기는 로그인 필요). 글·댓글·반응·신고를 클럽 게시판과 똑같이 쓴다.
- 결과물 공간은 `showcase_url`과 대표 이미지가 필수다(명령 계층 검사).
- 기본값 의존: 공개 문의를 없애기로 하면 활동마다 공간을 하나만 만든다. 테이블은 바뀌지 않는다.

---

## 6. 활동 — 모임, 시즌, 챌린지

### `activities` — 공통

| 묶음      | 열                                                                                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 종류      | `kind`(`gathering` / `series` / `challenge`), `series_id`(회차 모임이면 소속 시즌), `session_no`                                                                     |
| 주최      | `organizer_kind`(`club` / `host` / `official`), `club_id`(클럽 주최), `created_by`                                                                                   |
| 소개      | `slug`(고유, URL 영구), `title`, `summary`, `description`, `cover_path`                                                                                              |
| 공개·대상 | `visibility`(`public` / `members`), `audience`(`anyone` / `club_members` / `entitlement_holders`), 필요 이용권 대상(`required_class_id` 또는 `required_activity_id`) |
| 신청      | `join_mode`(`instant` / `approval`), `apply_opens_at`, `apply_closes_at`, `allow_late_join`, `questions`(jsonb, 최대 3개)                                            |
| 일정      | `starts_at`, `ends_at`(timestamptz, 종류와 상관없이 정렬·캘린더에 쓰는 공통 일정)                                                                                    |
| 인원      | `capacity`, `min_participants`                                                                                                                                       |
| 비용      | `price`(0이면 무료), `onsite_cost_note`, `payee_user_id`(유료일 때 정산받을 사람)                                                                                    |
| 상태      | `status`(`draft` / `open` / `closed` / `in_progress` / `ended` / `cancelled`), `cancelled_by`, `cancelled_at`, `cancel_reason`                                       |

- **세 종류를 한 테이블에 묶는다 (2026-11-04 확정).** 내 활동 목록·캘린더, 발견 피드와 검색, 클럽의 활동 탭, 호스트 대시보드(입금 대기·출석·명단), 월별 정산, 운영진의 입금 확인 대기열·신고·공식 픽을 종류 구분 없이 한 목록으로 다룬다. "시즌 등록자 전용 챌린지"처럼 종류를 넘나드는 참가 조건도 `required_activity_id` 하나로 건다.
- **공통 일정 `starts_at`·`ends_at` (2026-11-04 확정).** 목록 정렬("다가오는 순")·캘린더·리마인드는 이 두 열만 본다. 종류별로 채우는 방법:
  - 모임: 호스트가 입력한 시작·종료 일시 그대로. 모임의 일정은 여기에만 둔다.
  - 챌린지: `challenge_details.starts_on`의 한국 시간 0시 ~ `ends_on` 다음 날 0시. 상세 항목이 바뀌면 트리거가 다시 채운다.
  - 시즌: 첫 회차의 `starts_at` ~ 마지막 회차의 `ends_at`. 회차가 추가·변경·취소되면 트리거가 다시 채운다. 회차가 없으면 비어 있다.
  - 공개(`open`) 이후에는 두 열이 비어 있을 수 없다(상태 전환 함수에서 검사). `ends_at >= starts_at` CHECK. 목록용 인덱스 `(status, starts_at)`.
- `in_progress`는 시즌·챌린지에서 쓴다. 모임은 `open → closed → ended`.
- **정산 대상은 활동마다 정한다 (2026-11-04 확정).** 유료 활동이면 `payee_user_id`가 필수이고, 유료 호스트 등급이어야 한다. 개인 주최는 기본으로 주최자 본인, 클럽 주최는 활동을 연 사람이 클럽의 유료 호스트 중에서 고른다. 공식 주최는 비운다. 주문을 만들 때 이 값을 주문의 `payee_user_id`로 복사하므로, 나중에 활동의 정산 대상을 바꿔도 이미 들어온 주문은 처음 사람에게 정산된다. 바꾸는 일은 `participant.manage` 권한과 기록이 필요하다.
- 주최 규칙(CHECK): `club`이면 `club_id` 필수. `host`이면 만든 사람이 활성 호스트여야 하고(유료면 `paid` 등급), `official`은 플랫폼 운영진만 만든다. 등급 검사는 생성 함수에서 한다.
- **회차 모임은 독립 신청을 받지 않는다.** `series_id`가 있는 모임은 시즌의 참가 정보를 따르고, 자기 `price`·`capacity`를 쓰지 않는다.
- "다음 주 같은 시간으로 복제"는 새 행을 만드는 기능일 뿐, 반복 규칙을 저장하지 않는다.

### 종류별 항목

| 테이블               | 내용                                                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gathering_details`  | `activity_id`(PK), `format`(`offline` / `online`), `place_name`, `area`(목록에 보이는 대략 위치), `map_url`, `hide_address_until_confirmed`                                                                  |
| `activity_private`   | `activity_id`(PK), `video_url`, `address_detail`. 확정 참가자·진행자만, 화상 링크는 시작 30분 전부터 읽히는 함수로만 연다                                                                                    |
| `challenge_details`  | `activity_id`(PK), `starts_on`, `ends_on`(date), `cert_rule`(`daily` / `weekly_n` / `total_n`), `cert_n`, `cert_formats`(text[]: `text` / `photo` / `link`), `completion_threshold`, `certs_visibility`      |
| `challenge_missions` | `activity_id`, `day_no`(null이면 자유 미션), `title`, `body`                                                                                                                                                 |
| `certifications`     | `activity_id`, `user_id`, `mission_id`, `cert_date`(한국 시간 date), `body`, `images`, `link`, `status`(`accepted` / `rejected`), `rejected_by`, `rejected_reason`. `(activity_id, user_id, cert_date)` 고유 |
| `activity_hosts`     | `(activity_id, user_id)`, `role`(지금은 `facilitator`). 진행자 여러 명                                                                                                                                       |

- 시즌은 별도 항목 테이블이 없다. 회차 일정은 회차 모임(`series_id`로 묶인 `activities`)의 `starts_at`에 있고, 시즌 행의 공통 일정은 거기서 계산된다.
- 챌린지의 `starts_on`·`ends_on`(date)은 인증일 계산의 기준으로 남긴다. 공통 일정 열은 여기서 파생된 값이다.
- 인증일은 서버가 한국 시간으로 계산해 넣고, 그날이 지나면 수정할 수 없다(트리거로 막는다).
- 기본값 의존: `certs_visibility` 기본 `participants`. 인증을 하루 여러 번 허용하게 되면 고유 제약을 뺀다.
- 시험장에서 정한 것(2026-11-04): 회차의 참가자 판정·관리 권한은 시즌을 따른다(`is_confirmed_participant`, `can_manage_activity`). 시즌 행은 회차가 없을 때 일정이 비어 있을 수 있어 공개 시 일정 필수 규칙에서 뺀다. 완주 판정은 종료일 다음 날부터 진행자가 실행한다(운영에서는 주기 작업 후보).

### 참가, 출석, 후기

| 테이블           | 주요 열                                                                                                                                                                                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `participations` | `(activity_id, user_id)` 고유, `status`(`pending_approval` / `pending_payment` / `waitlisted` / `confirmed` / `cancelled`), `answers`(jsonb), `order_id`, `entitlement_id`, `waitlisted_at`, `decided_by`, `cancelled_by`, `cancel_reason`, `outcome`(챌린지 `completed` / `incomplete`) |
| `attendances`    | `(gathering_id, user_id)` 고유, `status`(`attended` / `absent`), `checked_by`, `checked_at`                                                                                                                                                                                              |
| `reviews`        | `(activity_id, user_id)` 고유, `body`, `images`, `deleted_at`                                                                                                                                                                                                                            |

- **시즌 참가는 시즌 행 하나에만 남긴다.** 회차 모임에는 참가 행을 복제하지 않는다. 회차 출석은 `attendances(gathering_id = 회차)`에 남기고, 시즌 출석률은 이걸 모아 계산한다. 중도 합류·중도 환불이 생겨도 참가 행 하나만 바꾸면 된다.
- 단발 모임도 출석은 `attendances`에 남긴다. 노쇼는 `absent` 기록으로 충분하다(기본값: 기록만, 제재 없음).
- **정원은 DB 함수 안에서 잠금을 걸고 센다.** 신청·확정·대기 승격은 `select ... for update`로 활동 행을 잠근 뒤 `confirmed + pending_payment` 수를 세는 함수(`participation_apply`, `participation_confirm`, `participation_promote_waitlist`)로만 바꾼다. 동시에 마지막 자리를 신청해도 초과 확정이 생기지 않게 하기 위해서다.
- 기본값 의존: 입금 대기 중에도 자리를 잡는다(`pending_payment`를 정원에 센다). 바뀌면 함수의 세는 조건만 바뀐다.
- 후기 작성 자격(참석 처리된 사람)은 `attendances`로 검사한다. 챌린지는 참가 확정자가 종료 뒤에 쓴다.

---

## 7. 클래스, 거래, 이용권

### 클래스와 진도

| 테이블              | 주요 열                                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `classes`           | `slug`(PK, 기존 `class_slug`와 같은 값), `title`, `price`, `access_days`(null이면 무제한), `free_scope`(무료 공개 수업 범위, jsonb), `status` |
| `lesson_progress`   | `(user_id, class_slug, lesson_id)` 고유, `completed_at`                                                                                       |
| `class_states`      | `(user_id, class_slug)` PK, `state`(jsonb), `schema_version`, `updated_at`                                                                    |
| `class_attachments` | `user_id`, `class_slug`, `kind`(지금은 `result_screen`), `storage_path`, `regions`(jsonb: 변경 영역과 설명), `updated_at`                     |

- 단원·수업 구성은 계속 코드(`workbook-course.ts`)가 정본이다. DB는 `lesson_id` 문자열만 들고 있다.
- **지금 `WorkbookProgressContext`가 들고 있는 방문 상태를 처음엔 `class_states.state` 한 덩어리로 옮긴다.** 완료 판정에 쓰는 수업 완료만 `lesson_progress`로 따로 뺀다(명세 8절). `schema_version`으로 상태 모양이 바뀔 때 이행한다.
- 첨부 결과 화면은 Storage 비공개 버킷에 두고, 지금 IndexedDB에 있는 변경 영역·설명은 `regions`로 옮긴다.
- 기본값 의존: 비로그인 체험은 서버에 아무것도 쓰지 않는다. 로그인하면 그때까지의 방문 상태를 한 번 올린다.

### 주문

| 테이블            | 주요 열                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orders`          | `order_no`(사람이 읽는 번호), `user_id`, 대상(`activity_id` 또는 `class_slug`, 정확히 하나), `amount`, `item_snapshot`(jsonb: 주문 시점 제목·가격·일정), `payee_user_id`(정산받을 호스트, 공식이면 null), `fee_rate`(정산 대상이면 필수), `refund_policy_id`, `method`(`bank_transfer` / 나중 `pg`), `depositor_name`, `due_at`, `cash_receipt`(jsonb), `status`(`pending` / `paid` / `cancelled` / `expired` / `refunded` / `partially_refunded`), `confirmed_by`, `confirmed_at` |
| `refunds`         | `order_id`, `requested_by`, `requested_at`, `reason`, `amount`(규정으로 계산), `status`(`requested` / `approved` / `rejected` / `paid`), `processed_by`, `processed_at`, 환불 계좌(암호화)                                                                                                                                                                                                                                                                                         |
| `refund_policies` | `target_kind`(`gathering` / `series` / `challenge` / `class`), `version`, `rules`(jsonb: 시점별 환불 비율), `effective_from`, `approved_note`                                                                                                                                                                                                                                                                                                                                      |

- **금액, 수수료율, 정산 대상은 서버가 주문을 만들 때 정해 넣는다.** 화면이 보낸 값은 쓰지 않는다. `item_snapshot`과 `fee_rate`를 남겨 두므로 나중에 가격이나 수수료가 바뀌어도 지난 주문은 그대로다.
- 입금 확인은 `commerce` 권한을 가진 운영진만 하는 함수(`order_confirm_payment`) 하나로 처리한다. 이 함수가 한 트랜잭션 안에서 주문 `paid` → 이용권 발급 → 참가 `confirmed` → 알림 생성을 한다. 나중에 PG 웹훅도 같은 함수를 부른다.
- 24시간 만료는 주기 작업(Supabase cron)으로 `pending → expired`, 잡아 둔 자리를 풀고 대기자에게 알린다.
- 기본값 의존: 환불 규정 내용(대표 승인)은 `refund_policies.rules`의 값일 뿐, 구조는 바뀌지 않는다.
- 시험장에서 더한 것(2026-11-04): 수수료율·입금 기한·입금 계좌 안내는 한 줄짜리 `platform_settings`에 둔다. `refunds`에는 계산에 쓴 비율(`rate`)도 남긴다. 한 주문에 진행 중인 환불은 하나만(부분 고유 인덱스). 실제 값은 대표 승인 전이며 `supabase/seed.sql`에만 시험값이 있다.

### 이용권

`entitlements`: `user_id`, 대상(`activity_id` 또는 `class_slug`, 정확히 하나), `source`(`order` / `free` / `invite` / `grant` / `completion` / `legacy`), `order_id`, `granted_by`, `starts_at`, `ends_at`, `status`(`active` / `revoked`), `revoked_by`, `revoked_at`, `revoke_reason`.

- 만료는 상태로 바꾸지 않고 `ends_at`으로 판정한다(주기 작업이 필요 없다).
- 판정 함수 하나: `has_entitlement(user_id, activity_id | class_slug)`. 활동 대상 조건(`entitlement_holders`), 클래스 수업 열기, 참가자 대화 읽기가 모두 이 함수를 쓴다.
- 환불이 승인되면 같은 트랜잭션에서 이용권 `revoked`, 참가 `cancelled`.

### 호스트 정산

| 테이블             | 주요 열                                                                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `settlements`      | `payee_user_id`, `period_start`, `period_end`, `gross_amount`, `refund_amount`, `fee_amount`, `payout_amount`, `status`(`scheduled` / `paid`), `paid_at`, `processed_by`, `note` |
| `settlement_items` | `settlement_id`, `order_id` 또는 `refund_id`(정확히 하나), `amount`(매출은 양수, 환불 차감은 음수), `fee_amount`                                                                 |

- 한 주문·한 환불은 한 번만 정산에 들어간다(`order_id`, `refund_id` 각각 고유).
- 지급 뒤에 생긴 환불은 다음 정산의 음수 항목으로 들어간다(명세 9절).
- 결정 대기: 수수료율, 정산 주기(대표 승인), 법적 성격과 세금 처리(법률·세무 확인). 원천징수가 필요하면 `settlements`에 세액 열을 더한다.

---

## 8. 알림, 신뢰, 운영

| 테이블                  | 주요 열                                                                                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notifications`         | `user_id`, `kind`, `payload`(jsonb: 링크와 문구 재료), `read_at`, `emailed_at`                                                                                                                                               |
| `notification_settings` | `(user_id, kind)`, `email_enabled`. 거래 필수 종류는 끌 수 없게 함수에서 막는다                                                                                                                                              |
| `reports`               | `reporter_id`, 대상(`user_id` / `club_id` / `activity_id` / `post_id` / `comment_id` / `certification_id` 중 하나), `reason`, `body`, `status`(`open` / `actioned` / `dismissed`), `handled_by`, `handled_at`, `action_note` |
| `sanctions`             | `user_id`, `kind`(`warning` / `suspension` / `ban`), `ends_at`, `reason`, `report_id`, `issued_by`                                                                                                                           |
| `user_blocks`           | `(blocker_id, blocked_id)`. 기본값: 서로의 글·댓글을 숨기고, 같은 모임 신청은 막지 않는다                                                                                                                                    |
| `curated_picks`         | 대상(클럽·활동·글 중 하나), `slot`(예: 홈 공식 픽), `sort_order`, `starts_at`, `ends_at`, `picked_by`                                                                                                                        |
| `audit_logs`            | `actor_id`, `action`, 대상 종류와 id, `detail`(jsonb), `created_at`. 지우거나 고치지 않는다(UPDATE·DELETE 권한 없음)                                                                                                         |

- 이메일 발송은 알림 행을 만든 뒤 서버(Resend)가 보내고 `emailed_at`을 채운다. 발송 실패로 상태 변경 트랜잭션이 되돌아가지 않게, 상태 변경과 발송을 분리한다.
- 리마인드(전날·1시간 전)는 주기 작업이 `activities.starts_at`을 보고 알림 행을 만든다.

---

## 9. 권한 검사를 어디서 하나

| 하는 일                                                | 방식                                                                                                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 공개 페이지 읽기(클럽, 활동, 공개 글)                  | 로그인 없이 RLS `select` 정책으로. DM 링크 진입과 OG 생성이 같은 경로를 쓴다                                                                                 |
| 내 것 읽기·쓰기(프로필, 내 글, 진도)                   | RLS `auth.uid() = user_id`                                                                                                                                   |
| 상태를 바꾸는 행동(신청, 확정, 입금 확인, 레이어 지정) | 서버 액션 → `security definer` DB 함수. 함수가 권한·정원·상태 전이를 한 트랜잭션에서 검사하고 `audit_logs`에 남긴다. 테이블에 직접 UPDATE 권한을 주지 않는다 |
| 민감 정보(연락처, 계좌, 화상 링크)                     | 테이블 `select` 정책 없음. 확인과 기록을 함께 하는 함수로만 읽는다                                                                                           |

- 서버 액션(`src/lib/<domain>/`)은 입력 검증(zod)과 화면용 오류를 맡고, 최종 규칙은 DB 함수가 지킨다. 같은 규칙을 두 곳에 쓰지 않도록 "검증 = 서버 액션, 불변 조건 = DB 함수"로 나눈다.
- 서비스 롤 키는 주기 작업과 웹훅에서만 쓴다. 사용자 요청 경로는 사용자 세션으로 DB에 접근한다.

---

## 10. 기존 운영 스키마에서 옮겨 가는 길

운영 중인 형제 서비스(클래스룸)를 멈추지 않도록 **늘리고 → 옮기고 → 줄이는** 순서로 간다. 각 단계는 개발 프로젝트에서 먼저 검증한다.

| 기존                                     | 새 구조                                                        | 방법                                                                                                                                                                                                            |
| ---------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`(이름·나이·전화 등 필수)       | `profiles` + `profile_private`                                 | ① 새 열 추가(닉네임 등) ② 기존 행의 이름·전화·나이를 `profile_private`로 복사 ③ 형제 서비스 코드가 새 위치를 읽게 바꾼 뒤 ④ 기존 열의 NOT NULL을 풀고 나중에 지운다. 닉네임은 기존 회원에게 첫 로그인 때 받는다 |
| `profiles.discovery_source`, `interests` | 유입 경로는 클래스 신청 정보로, 관심사는 `profile_interests`로 | 관심사 값이 자유 텍스트면 `interests` 목록에 대응시키는 표를 만들어 옮긴다                                                                                                                                      |
| `profiles.member_role = 'staff'`         | 공식 시즌(오프라인 클래스)의 `activity_hosts`                  | 클래스 운영 권한이었으므로 플랫폼 운영진이 아니라 활동 진행자로 옮긴다. `is_class_staff()`는 이행 기간 동안 새 구조를 보도록 고친다                                                                             |
| `class_enrollments`                      | `entitlements`(`source = legacy`)                              | 행을 그대로 옮기고, 같은 이름의 읽기 전용 view를 남겨 형제 서비스가 바로 깨지지 않게 한다                                                                                                                       |
| `applications`(신청서 + 결제 상태)       | `orders` + `participations`(공식 시즌)                         | 흡수 때 옮긴다. 그전까지 새 플랫폼은 `applications`를 쓰지 않는다                                                                                                                                               |
| 클래스룸·스페이스 테이블들               | 그대로 둔다                                                    | 이름이 겹치지 않는다. 흡수 방식이 정해지면 따로 판단한다                                                                                                                                                        |
| `motivo_*` 5개                           | 건드리지 않는다                                                | 주인 확인 전. 확인 결과에 따라 A/B 판단(운영 스키마 검토 문서)                                                                                                                                                  |

- 이름 충돌 점검: 새 테이블 중 `spaces`, `posts`는 기존 `space_*` 테이블과 이름은 다르지만 뜻이 비슷하다. 혼동을 줄이려면 기존 쪽을 흡수 때 `classroom_*`로 옮기는 것을 제안한다(지금은 하지 않는다).
- 로그인: 카카오 계정과 기존 이메일 계정을 같은 이메일로 연결하는 방식(Supabase의 자동 연결 조건, 이메일 미확인 카카오 계정 처리)은 개발 프로젝트에서 직접 확인한 뒤 정한다.

---

## 11. 단계별로 만드는 테이블

| 단계(대략 기획 6절) | 테이블                                                                                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 계정·권한         | `profiles` 확장, `profile_private`, `interests`, `profile_interests`, `platform_staff`, `audit_logs`                                                                                                        |
| 2 클래스 + 이용권   | `classes`, `entitlements`, `lesson_progress`, `class_states`, `class_attachments`                                                                                                                           |
| 3 클럽과 모임(무료) | 클럽 5개, 공간 4개, `activities`, `gathering_details`, `activity_private`, `activity_hosts`, `participations`, `attendances`, `reviews`, `notifications`, `notification_settings`, `reports`, `user_blocks` |
| 4 유료 참여         | `orders`, `refunds`, `refund_policies`, `host_payout_accounts`, `settlements`, `settlement_items`. 시즌은 `activities`에 이미 들어 있다                                                                     |
| 5 챌린지            | `challenge_details`, `challenge_missions`, `certifications`                                                                                                                                                 |
| 6 호스트 확장       | `host_applications`, `hosts`, `sanctions`, `curated_picks`                                                                                                                                                  |

- 3단계에서 클럽을 만들려면 호스트 자격이 필요하므로, `hosts`는 3단계에 함께 만들고 신청 화면만 6단계에 둔다. 그전에는 소유자가 직접 호스트를 지정한다.

---

## 12. 정리된 질문 (2026-11-04)

1. **`activities` 하나로 묶기** — 확정: 묶는다. 종류별로 다른 일정은 공통 `starts_at`·`ends_at`으로 맞춘다(6절).
2. **클럽 주최 유료 활동의 정산 대상** — 확정: 활동마다 정한다(6절).
3. **회차 출석과 시즌 참가 분리** — 확정: 분리한다. 참가는 시즌에 한 번, 출석은 회차마다 남긴다(6절).
4. **진도는 `class_states` 한 덩어리로 시작** — 확정: 제안대로 수업 완료만 `lesson_progress`로 따로 두고 나머지는 한 덩어리로 시작한다. 회원 활동 캘린더(AGENTS.md 열린 결정)를 붙일 때 날짜별 활동 기록 테이블을 추가한다.

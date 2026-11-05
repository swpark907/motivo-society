# 운영 Supabase 스키마 검토

2026-11-01. 운영 프로젝트 `motivo_landingpage`의 `public` 스키마를 `supabase db dump`로 읽기 전용 덤프해 검토했다. **데이터는 읽지 않았다.** 덤프 원본은 레포에 넣지 않았다. 첫 마이그레이션의 위치와 형식은 별도로 정한다.

`storage`·`auth` 스키마 설정, 스토리지 버킷 정책, 엣지 함수, 인증 제공자 설정은 이번 덤프 범위가 아니다.

## 현재 구성 (테이블 17개, 함수 3개, RLS 정책 36개)

| 묶음                  | 테이블                                                                                                 | 형제 레포 SQL에 정의                       |
| --------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| 신청·결제             | `applications`, `application_rate_limits`                                                              | 있음(`schema.sql`)                         |
| 회원                  | `profiles`, `class_enrollments`, `class_intros`                                                        | 있음(`members.sql`, 이후 파일에서 열 추가) |
| 클래스룸              | `class_quiz_attempts`, `class_survey_reviews`, `class_feedback_requests`                               | 있음                                       |
| 스페이스(출석·라운지) | `space_attendance`, `space_help_requests`, `space_lounge_messages`, `space_quizzes`                    | 있음(`motivo-space.sql`)                   |
| **모쏘 콘텐츠·관리**  | `motivo_admins`, `motivo_content`, `motivo_home`, `motivo_toolkit_editors`, `motivo_toolkit_approvals` | **없음**                                   |

## 눈에 띄는 점

1. **로컬 레포 어디에도 정의가 없는 테이블 5개가 운영 DB에 있다.**
   - 무엇: `motivo_*` 테이블. 콘텐츠 CMS 구조다(`kind`: discover·ai·library·gatherings·workbooks, `variant`: draft·published).
   - 기능: 관리자 목록, 툴킷 편집자, 발행 승인 요청이 있고 RLS 정책 15개가 붙어 있다.
   - 확인 범위: 형제 레포 4곳(`motivo-class-landingpage`, `motivo-content`, `vibe-web-class-ssot`, 이 레포)에서 이 이름을 쓰는 코드를 찾지 못했다.
   - 추정: 다른 앱이나 대시보드에서 만들었을 가능성이 있다. 누가, 어떤 서비스에서 쓰는지 확인이 필요하다.
2. **`profiles`가 클래스 신청서 성격이다.**
   - 이름·나이·이메일·전화번호·유입 경로·관심사가 모두 필수다.
   - 플랫폼 일반 가입에서 나이와 전화번호를 필수로 받으면 진입 장벽이 된다.
   - 플랫폼 프로필과 클래스 신청 정보를 나누거나, 필수 조건을 완화해야 한다.
3. **권한이 전역 한 칸이다.** `profiles.member_role`은 `member`·`staff` 두 값뿐이고, `is_class_staff()`가 이걸로 클래스 운영 권한을 판정한다. 큰 그림의 세 층(플랫폼·클럽·모임)으로 옮길 때 이 값이 무엇에 대응할지 정해야 한다. `motivo_admins`와도 겹친다.
4. **수강 권한은 이용권의 원형이다.** `class_enrollments(user_id, class_slug, unlocked_at)`가 "누가 어떤 클래스를 이용할 수 있나"를 담는다. 이용권 테이블로 일반화하기 좋은 출발점이다.
5. **신청과 결제가 한 테이블이다.** `applications`가 신청서 내용과 결제 상태(pending·paid·cancelled·expired)를 함께 갖는다. 큰 그림의 "주문 → 입금 확인 → 이용권" 흐름으로 옮길 때 주문과 신청서를 나눠야 한다.
6. **형제 레포의 SQL 파일과는 대체로 맞는다.** `profiles`의 열은 여러 파일에 나뉘어 추가돼 있다(`member_role`은 `class-feedback.sql`, `experience_points`는 `motivo-space.sql`). 덤프가 이 파일들보다 정확한 기준점이다.

## A(기존 프로젝트 키우기) 판단에 주는 영향

- **규모가 작아서 A가 여전히 현실적이다.** 테이블 17개이고, 대부분 클래스룸·스페이스 전용이라 새 도메인과 이름이 겹치지 않는다.
- **바꿔야 할 핵심은 세 곳이다.** `profiles`의 필수 항목, 권한(`member_role`·`motivo_admins`), 신청과 주문의 분리. 셋 다 운영 중인 클래스룸이 쓰는 곳이라 형제 서비스 코드와 함께 바꿔야 한다.
- **B로 전환할지는 `motivo_*` 테이블의 주인을 확인한 뒤 판단한다.** 다른 서비스가 같은 DB를 쓰고 있다면, A에서는 그 서비스까지 영향 범위에 들어간다.

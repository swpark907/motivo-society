import Link from "next/link";
import { KIND_LABELS } from "@/lib/platform/messages";
import { createSessionClient } from "@/lib/platform/supabase-server";
import { createActivity } from "../actions";
import { getViewer } from "../_data";
import { Notice, ReturnTo, type SearchParams } from "../_ui";
import styles from "../sandbox.module.scss";

type Options = {
  host_tier: "basic" | "paid" | null;
  official: boolean;
  clubs: { id: string; name: string; paid_hosts: { id: string; nickname: string }[] }[];
};

const KINDS = ["gathering", "series", "challenge"] as const;
type Kind = (typeof KINDS)[number];

export default async function NewActivityPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const kind: Kind = KINDS.includes(params.kind as Kind) ? (params.kind as Kind) : "gathering";
  const path = "/demo/platform/new";
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <>
        <Notice searchParams={searchParams} />
        <h1 className={styles.title}>활동 만들기</h1>
        <p className={styles.muted}>위에서 사람을 골라 로그인하면 만들 수 있어요.</p>
      </>
    );
  }

  const supabase = await createSessionClient();
  const [{ data: optionData }, { data: openActivities }] = await Promise.all([
    supabase.rpc("activity_create_options"),
    supabase
      .from("activities")
      .select("id, kind, title")
      .is("series_id", null)
      .neq("status", "draft")
      .order("starts_at", { ascending: false }),
  ]);
  const options = optionData as Options;
  const organizers = [
    ...options.clubs.map((c) => ({ value: `club:${c.id}`, label: `클럽 주최 · ${c.name}` })),
    ...(options.host_tier
      ? [
          {
            value: "host",
            label: `개인 호스트로 (${options.host_tier === "paid" ? "유료 호스트" : "기본 호스트"})`,
          },
        ]
      : []),
    ...(options.official ? [{ value: "official", label: "모쏘 공식" }] : []),
  ];
  const payees = options.clubs.flatMap((c) =>
    c.paid_hosts.map((h) => ({ value: h.id, label: `${h.nickname} (${c.name})` })),
  );

  return (
    <>
      <Notice searchParams={searchParams} />
      <h1 className={styles.title}>활동 만들기</h1>
      <p className={styles.muted}>
        만들면 초안으로 저장되고, 상세 화면에서 공개해야 목록에 보여요. 누가 무엇을 열 수 있는지는
        DB 함수가 검사해요.
      </p>
      <dl className={styles.meta}>
        <div>
          <dt>내가 고를 수 있는 주최</dt>
          <dd>{organizers.length ? organizers.map((o) => o.label).join(", ") : "없음"}</dd>
        </div>
        <div>
          <dt>규칙</dt>
          <dd>
            클럽은 &quot;모임·시즌·챌린지 열기&quot; 권한으로, 개인은 호스트 자격으로. 유료·시즌은
            유료 호스트만.
          </dd>
        </div>
      </dl>

      <nav className={styles.kindTabs} aria-label="활동 종류">
        {KINDS.map((k) => (
          <Link key={k} href={`${path}?kind=${k}`} aria-current={k === kind ? "page" : undefined}>
            {KIND_LABELS[k]}
          </Link>
        ))}
      </nav>

      {organizers.length === 0 ? (
        <p className={styles.panel}>
          지금 사람은 활동을 열 수 없어요. 호스트 자격이나 클럽의 활동 열기 권한이 필요해요.
        </p>
      ) : (
        <form action={createActivity} className={`${styles.panel} ${styles.stack}`}>
          <ReturnTo path={path} />
          <input type="hidden" name="kind" value={kind} />

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>주최</span>
              <select name="organizer" required>
                {organizers.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>제목</span>
              <input name="title" required maxLength={60} />
            </label>
            <label className={`${styles.field} ${styles.wide}`}>
              <span>소개</span>
              <input name="summary" maxLength={120} />
            </label>
          </div>

          <fieldset className={styles.formGrid}>
            <legend className={styles.subTitle}>
              {kind === "gathering" ? "일정과 장소" : kind === "series" ? "회차" : "기간과 인증"}
            </legend>
            {kind === "gathering" && (
              <>
                <label className={styles.field}>
                  <span>시작 (한국 시간)</span>
                  <input name="startsAt" type="datetime-local" required />
                </label>
                <label className={styles.field}>
                  <span>끝 (선택)</span>
                  <input name="endsAt" type="datetime-local" />
                </label>
              </>
            )}
            {kind === "series" && (
              <>
                <label className={styles.field}>
                  <span>첫 회차 시작</span>
                  <input name="firstStartsAt" type="datetime-local" required />
                </label>
                <label className={styles.field}>
                  <span>회차 수 (2~12)</span>
                  <input name="sessionCount" type="number" min={2} max={12} defaultValue={4} />
                </label>
                <label className={styles.field}>
                  <span>간격 (일)</span>
                  <input name="intervalDays" type="number" min={1} defaultValue={7} />
                </label>
                <label className={styles.field}>
                  <span>회차 길이 (분)</span>
                  <input name="durationMinutes" type="number" min={10} defaultValue={120} />
                </label>
              </>
            )}
            {kind === "challenge" && (
              <>
                <label className={styles.field}>
                  <span>시작일</span>
                  <input name="startsOn" type="date" required />
                </label>
                <label className={styles.field}>
                  <span>종료일</span>
                  <input name="endsOn" type="date" required />
                </label>
                <label className={styles.field}>
                  <span>인증 규칙</span>
                  <select name="certRule" defaultValue="daily">
                    <option value="daily">매일</option>
                    <option value="weekly_n">주 N회</option>
                    <option value="total_n">기간 중 총 N회</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span>N (주 N회·총 N회일 때)</span>
                  <input name="certN" type="number" min={1} />
                </label>
                <label className={styles.field}>
                  <span>완주 조건 (인증 횟수)</span>
                  <input name="threshold" type="number" min={1} required />
                </label>
                <label className={styles.field}>
                  <span>자유 미션 (선택)</span>
                  <input name="mission" maxLength={60} />
                </label>
                <div className={styles.inlineForms}>
                  <label className={styles.check}>
                    <input type="checkbox" name="certFormats" value="text" defaultChecked />
                    <span>글 인증</span>
                  </label>
                  <label className={styles.check}>
                    <input type="checkbox" name="certFormats" value="link" />
                    <span>링크 인증</span>
                  </label>
                </div>
              </>
            )}
            {kind !== "challenge" && (
              <>
                <label className={styles.field}>
                  <span>형식</span>
                  <select name="format" defaultValue="offline">
                    <option value="offline">오프라인</option>
                    <option value="online">온라인</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span>장소 이름</span>
                  <input name="placeName" maxLength={40} />
                </label>
                <label className={styles.field}>
                  <span>지역 (목록에 보임)</span>
                  <input name="area" maxLength={40} />
                </label>
                <label className={styles.field}>
                  <span>상세 주소 (확정자만)</span>
                  <input name="addressDetail" maxLength={80} />
                </label>
                <label className={styles.field}>
                  <span>화상 링크 (확정자만, 30분 전부터)</span>
                  <input name="videoUrl" type="url" />
                </label>
              </>
            )}
          </fieldset>

          <fieldset className={styles.formGrid}>
            <legend className={styles.subTitle}>신청과 비용</legend>
            <label className={styles.field}>
              <span>정원 (비우면 제한 없음)</span>
              <input name="capacity" type="number" min={1} />
            </label>
            <label className={styles.field}>
              <span>참가비 (원, 0이면 무료)</span>
              <input name="price" type="number" min={0} step={1000} defaultValue={0} />
            </label>
            <label className={styles.field}>
              <span>정산받을 사람 (클럽 주최 유료일 때)</span>
              <select name="payee" defaultValue="">
                <option value="">나 (개인 주최는 항상 나)</option>
                {payees.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>참가 방식</span>
              <select name="joinMode" defaultValue="instant">
                <option value="instant">바로 확정</option>
                <option value="approval">주최자 승인</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>대상</span>
              <select name="audience" defaultValue="anyone">
                <option value="anyone">누구나</option>
                <option value="club_members">클럽 멤버만</option>
                <option value="entitlement_holders">이전 활동 참가자만</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>이전 활동 (참가자만일 때)</span>
              <select name="requiredActivity" defaultValue="">
                <option value="">고르지 않음</option>
                {(openActivities ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    [{KIND_LABELS[a.kind]}] {a.title}
                  </option>
                ))}
              </select>
            </label>
            {kind !== "gathering" && (
              <label className={styles.check}>
                <input type="checkbox" name="allowLateJoin" />
                <span>시작한 뒤에도 합류 받기</span>
              </label>
            )}
          </fieldset>

          <button type="submit" className={styles.primaryButton}>
            초안으로 만들기
          </button>
        </form>
      )}
    </>
  );
}

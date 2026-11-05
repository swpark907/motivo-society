import Link from "next/link";
import { createSessionClient } from "@/lib/platform/supabase-server";
import { createClub, joinClubByInvite } from "../actions";
import { getViewer } from "../_data";
import { Notice, ReturnTo, type SearchParams } from "../_ui";
import styles from "../sandbox.module.scss";

const PATH = "/demo/platform/clubs";
const MEMBER_STATUS: Record<string, string> = {
  active: "멤버",
  pending: "가입 신청 중",
  left: "탈퇴",
  banned: "강퇴됨",
};

export default async function ClubsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createSessionClient();
  const viewer = await getViewer();
  const [{ data: clubs }, { data: mine }, { data: host }] = await Promise.all([
    supabase
      .from("clubs")
      .select("id, slug, name, tagline, join_mode, club_members(count)")
      .eq("club_members.status", "active")
      .order("created_at"),
    viewer
      ? supabase.from("club_members").select("club_id, status").eq("user_id", viewer.id)
      : Promise.resolve({ data: [] as { club_id: string; status: string }[] }),
    viewer
      ? supabase.from("hosts").select("tier, status").eq("user_id", viewer.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const myStatus = new Map((mine ?? []).map((m) => [m.club_id, m.status]));

  return (
    <>
      <Notice searchParams={searchParams} />
      <h1 className={styles.title}>클럽</h1>
      <p className={styles.muted}>
        클럽은 멤버 명단과 레이어(역할)가 있는 소속 단위예요. 레이어 권한 규칙은 모두 DB 함수가
        검사해요.
      </p>

      <ul className={styles.cards}>
        {(clubs ?? []).map((c) => (
          <li key={c.id} className={styles.card}>
            <Link href={`/demo/platform/clubs/${c.slug}`} className={styles.cardLink}>
              <div className={styles.chips}>
                <span className={styles.chip}>
                  {c.join_mode === "approval" ? "승인 후 가입" : "바로 가입"}
                </span>
                <span className={styles.chip}>멤버 {c.club_members[0]?.count ?? 0}명</span>
                {myStatus.get(c.id) && (
                  <span className={styles.chipAccent}>{MEMBER_STATUS[myStatus.get(c.id)!]}</span>
                )}
              </div>
              <h2 className={styles.cardTitle}>{c.name}</h2>
              <p className={styles.muted}>{c.tagline}</p>
            </Link>
          </li>
        ))}
      </ul>

      {viewer && (
        <section className={styles.panel} aria-labelledby="invite-heading">
          <h2 id="invite-heading" className={styles.panelTitle}>
            초대 코드로 가입
          </h2>
          <form action={joinClubByInvite} className={styles.row}>
            <ReturnTo path={PATH} />
            <label className={styles.field}>
              <span>초대 코드</span>
              <input name="code" required maxLength={40} />
            </label>
            <button type="submit" className={styles.ghostButton}>
              가입하기
            </button>
          </form>
          <p className={styles.muted}>초대 코드로 들어오면 승인 방식 클럽이어도 바로 가입돼요.</p>
        </section>
      )}

      {viewer && (
        <section className={styles.panel} aria-labelledby="create-heading">
          <h2 id="create-heading" className={styles.panelTitle}>
            클럽 만들기
          </h2>
          {host?.status === "active" ? (
            <form action={createClub} className={styles.stack}>
              <ReturnTo path={PATH} />
              <div className={styles.row}>
                <label className={styles.field}>
                  <span>이름</span>
                  <input name="name" required maxLength={40} />
                </label>
                <label className={styles.field}>
                  <span>주소 (영어 소문자)</span>
                  <input name="slug" required pattern="[a-z0-9][a-z0-9\-]{2,40}" />
                </label>
                <label className={styles.field}>
                  <span>한 줄 소개</span>
                  <input name="tagline" maxLength={60} />
                </label>
                <label className={styles.field}>
                  <span>가입 방식</span>
                  <select name="joinMode" defaultValue="open">
                    <option value="open">바로 가입</option>
                    <option value="approval">승인 후 가입</option>
                  </select>
                </label>
              </div>
              <button type="submit" className={styles.primaryButton}>
                클럽 만들기
              </button>
            </form>
          ) : (
            <p className={styles.muted}>
              클럽은 호스트 자격이 있는 사람만 만들 수 있어요. 바라호스트나 클럽장으로 바꿔 보세요.
            </p>
          )}
        </section>
      )}
    </>
  );
}

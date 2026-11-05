import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ACTIVITY_STATUS_LABELS,
  CLUB_PERMISSIONS,
  KIND_LABELS,
  permissionLabel,
} from "@/lib/platform/messages";
import { createSessionClient } from "@/lib/platform/supabase-server";
import {
  assignClubLayer,
  banClubMember,
  createClubInvite,
  decideClubMember,
  deleteClubLayer,
  joinClub,
  leaveClub,
  saveClubLayer,
} from "../../actions";
import { formatWhen, getViewer } from "../../_data";
import { Badge, Notice, ReturnTo, type SearchParams } from "../../_ui";
import styles from "../../sandbox.module.scss";

type MyRole = {
  status: string | null;
  layer_id: string | null;
  layer_name: string | null;
  rank: number | null;
  kind: string | null;
  permissions: string[];
};

export default async function ClubDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const path = `/demo/platform/clubs/${slug}`;
  const supabase = await createSessionClient();
  const viewer = await getViewer();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, tagline, description, join_mode")
    .eq("slug", slug)
    .maybeSingle();
  if (!club) notFound();

  const [
    { data: roleData },
    { data: layers },
    { data: members },
    { data: invites },
    { data: acts },
  ] = await Promise.all([
    supabase.rpc("club_my_role", { p_club: club.id }),
    supabase
      .from("club_layers")
      .select("id, name, rank, kind, permissions")
      .eq("club_id", club.id)
      .order("rank"),
    supabase
      .from("club_members")
      .select(
        "user_id, status, layer_id, joined_at, profile:profiles!club_members_user_id_fkey(nickname)",
      )
      .eq("club_id", club.id)
      .order("joined_at"),
    supabase
      .from("club_invites")
      .select("id, code, used_count, max_uses, expires_at")
      .eq("club_id", club.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("activities")
      .select("id, kind, title, status, starts_at")
      .eq("club_id", club.id)
      .is("series_id", null)
      .order("starts_at"),
  ]);

  const role = (roleData ?? { permissions: [] }) as MyRole;
  const can = (p: string) => role.permissions.includes(p);
  const isAdmin = role.kind === "admin";
  const layerBy = new Map((layers ?? []).map((l) => [l.id, l]));
  const active = (members ?? []).filter((m) => m.status === "active");
  const pending = (members ?? []).filter((m) => m.status === "pending");
  const myRank = role.rank ?? 99;

  return (
    <>
      <Notice searchParams={searchParams} />
      <p>
        <Link href="/demo/platform/clubs" className={styles.back}>
          ← 클럽 목록
        </Link>
      </p>
      <div className={styles.chips}>
        <span className={styles.chip}>
          {club.join_mode === "approval" ? "승인 후 가입" : "바로 가입"}
        </span>
        <span className={styles.chip}>멤버 {active.length}명</span>
      </div>
      <h1 className={styles.title}>{club.name}</h1>
      <p className={styles.muted}>{club.description ?? club.tagline}</p>

      <section className={styles.panel} aria-labelledby="me-heading">
        <h2 id="me-heading" className={styles.panelTitle}>
          나와 이 클럽
        </h2>
        {!viewer ? (
          <p className={styles.muted}>위에서 사람을 골라 로그인하면 가입할 수 있어요.</p>
        ) : role.status === "active" ? (
          <div className={styles.stack}>
            <p>
              내 레이어: <strong>{role.layer_name}</strong> (순서 {role.rank})
            </p>
            <div className={styles.chips}>
              {role.permissions.length === 0 ? (
                <span className={styles.chip}>권한 없음 (일반 멤버)</span>
              ) : (
                role.permissions.map((p) => (
                  <span key={p} className={styles.chip}>
                    {permissionLabel(p)}
                  </span>
                ))
              )}
            </div>
            <form action={leaveClub}>
              <ReturnTo path={path} />
              <input type="hidden" name="clubId" value={club.id} />
              <button type="submit" className={styles.ghostButton}>
                클럽 나가기
              </button>
            </form>
          </div>
        ) : role.status === "pending" ? (
          <p className={styles.muted}>가입 신청 중이에요. 운영진이 승인하면 멤버가 돼요.</p>
        ) : role.status === "banned" ? (
          <p className={styles.muted}>이 클럽에서 강퇴되어 다시 가입할 수 없어요.</p>
        ) : (
          <form action={joinClub}>
            <ReturnTo path={path} />
            <input type="hidden" name="clubId" value={club.id} />
            <button type="submit" className={styles.primaryButton}>
              {club.join_mode === "approval" ? "가입 신청" : "가입하기"}
            </button>
          </form>
        )}
      </section>

      {pending.length > 0 && can("member.approve") && (
        <section className={styles.panel} aria-labelledby="pending-heading">
          <h2 id="pending-heading" className={styles.panelTitle}>
            가입 신청 {pending.length}건
          </h2>
          <table className={styles.table}>
            <tbody>
              {pending.map((m) => (
                <tr key={m.user_id}>
                  <td>{m.profile?.nickname}</td>
                  <td>
                    <div className={styles.inlineForms}>
                      {[true, false].map((approve) => (
                        <form key={String(approve)} action={decideClubMember}>
                          <ReturnTo path={path} />
                          <input type="hidden" name="clubId" value={club.id} />
                          <input type="hidden" name="userId" value={m.user_id} />
                          <input type="hidden" name="approve" value={String(approve)} />
                          <button
                            type="submit"
                            className={approve ? styles.smallPrimary : styles.smallGhost}
                          >
                            {approve ? "승인" : "거절"}
                          </button>
                        </form>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className={styles.panel} aria-labelledby="members-heading">
        <h2 id="members-heading" className={styles.panelTitle}>
          멤버 {active.length}명
        </h2>
        {(can("member.assign_layer") || can("member.ban")) && (
          <p className={styles.muted}>
            레이어 바꾸기·강퇴는 나보다 아래 레이어인 사람에게만, 그리고 내가 가진 권한 안의
            레이어로만 돼요. 규칙에 맞지 않으면 DB가 거절해요. 일부러 눌러 봐도 괜찮아요.
          </p>
        )}
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">사람</th>
              <th scope="col">레이어</th>
              {can("member.assign_layer") && <th scope="col">레이어 바꾸기</th>}
              {can("member.ban") && <th scope="col">강퇴</th>}
            </tr>
          </thead>
          <tbody>
            {active.map((m) => {
              const layer = layerBy.get(m.layer_id);
              const isMe = m.user_id === viewer?.id;
              return (
                <tr key={m.user_id}>
                  <td>
                    {m.profile?.nickname}
                    {isMe && " (나)"}
                  </td>
                  <td>{layer?.name}</td>
                  {can("member.assign_layer") && (
                    <td>
                      {!isMe && (
                        <form action={assignClubLayer} className={styles.inlineForms}>
                          <ReturnTo path={path} />
                          <input type="hidden" name="clubId" value={club.id} />
                          <input type="hidden" name="userId" value={m.user_id} />
                          <select
                            name="layerId"
                            defaultValue={m.layer_id}
                            className={styles.select}
                            aria-label={`${m.profile?.nickname}의 레이어`}
                          >
                            {(layers ?? []).map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.name}
                              </option>
                            ))}
                          </select>
                          <button type="submit" className={styles.smallGhost}>
                            바꾸기
                          </button>
                        </form>
                      )}
                    </td>
                  )}
                  {can("member.ban") && (
                    <td>
                      {!isMe && (layer?.rank ?? 0) > myRank && (
                        <form action={banClubMember}>
                          <ReturnTo path={path} />
                          <input type="hidden" name="clubId" value={club.id} />
                          <input type="hidden" name="userId" value={m.user_id} />
                          <button type="submit" className={styles.smallGhost}>
                            강퇴
                          </button>
                        </form>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className={styles.panel} aria-labelledby="layers-heading">
        <h2 id="layers-heading" className={styles.panelTitle}>
          레이어 {layers?.length ?? 0}/6
        </h2>
        <p className={styles.muted}>
          순서가 작을수록 위예요. 관리자(0)는 모든 권한, 멤버(9)는 권한이 없고 둘 다 지울 수 없어요.
          {isAdmin ? " 관리자라서 레이어를 고칠 수 있어요." : " 레이어는 관리자만 고쳐요."}
        </p>
        <div className={styles.stack}>
          {(layers ?? []).map((l) =>
            isAdmin ? (
              <LayerForm key={l.id} clubId={club.id} path={path} layer={l} />
            ) : (
              <div key={l.id} className={styles.layerRow}>
                <strong>
                  {l.rank}. {l.name}
                </strong>
                <div className={styles.chips}>
                  {l.kind === "admin" ? (
                    <span className={styles.chip}>모든 권한</span>
                  ) : l.permissions.length === 0 ? (
                    <span className={styles.chip}>권한 없음</span>
                  ) : (
                    l.permissions.map((p) => (
                      <span key={p} className={styles.chip}>
                        {permissionLabel(p)}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ),
          )}
          {isAdmin && (layers?.length ?? 0) < 6 && (
            <LayerForm clubId={club.id} path={path} layer={null} />
          )}
        </div>
      </section>

      {can("invite.create") && (
        <section className={styles.panel} aria-labelledby="invites-heading">
          <h2 id="invites-heading" className={styles.panelTitle}>
            초대 코드
          </h2>
          <form action={createClubInvite}>
            <ReturnTo path={path} />
            <input type="hidden" name="clubId" value={club.id} />
            <button type="submit" className={styles.ghostButton}>
              초대 코드 만들기 (7일 · 5회)
            </button>
          </form>
          {(invites ?? []).length > 0 && (
            <table className={styles.table}>
              <tbody>
                {(invites ?? []).map((i) => (
                  <tr key={i.id}>
                    <td>
                      <code className={styles.code}>{i.code}</code>
                    </td>
                    <td>
                      {i.used_count}/{i.max_uses ?? "∞"}회 사용
                    </td>
                    <td>{formatWhen(i.expires_at)}까지</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      <section className={styles.panel} aria-labelledby="acts-heading">
        <h2 id="acts-heading" className={styles.panelTitle}>
          이 클럽의 활동
        </h2>
        <p className={styles.muted}>모임·시즌·챌린지가 종류와 상관없이 한 줄로 쌓여요.</p>
        <table className={styles.table}>
          <tbody>
            {(acts ?? []).map((a) => (
              <tr key={a.id}>
                <td className={styles.nowrap}>{formatWhen(a.starts_at)}</td>
                <td>{KIND_LABELS[a.kind]}</td>
                <td>
                  <Link href={`/demo/platform/activities/${a.id}`}>{a.title}</Link>
                </td>
                <td>
                  <Badge status={a.status} label={ACTIVITY_STATUS_LABELS[a.status]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

type Layer = { id: string; name: string; rank: number; kind: string; permissions: string[] };

function LayerForm({ clubId, path, layer }: { clubId: string; path: string; layer: Layer | null }) {
  const fixed = layer !== null && layer.kind !== "custom";
  return (
    <div className={styles.layerRow}>
      <form action={saveClubLayer} className={styles.stack}>
        <ReturnTo path={path} />
        <input type="hidden" name="clubId" value={clubId} />
        <input type="hidden" name="layerId" value={layer?.id ?? ""} />
        <div className={styles.row}>
          <label className={styles.field}>
            <span>{layer ? "이름" : "새 레이어 이름"}</span>
            <input name="name" defaultValue={layer?.name ?? ""} required maxLength={20} />
          </label>
          <label className={styles.field}>
            <span>순서</span>
            <input
              name="rank"
              type="number"
              min={fixed ? undefined : 1}
              max={fixed ? undefined : 8}
              defaultValue={layer?.rank ?? ""}
              readOnly={fixed}
              required
            />
          </label>
        </div>
        {fixed ? (
          <p className={styles.muted}>
            {layer.kind === "admin" ? "모든 권한 (고정)" : "권한 없음 (고정)"}
          </p>
        ) : (
          <fieldset className={styles.permGrid}>
            <legend className={styles.muted}>권한</legend>
            {CLUB_PERMISSIONS.map((p) => (
              <label key={p.id} className={styles.check}>
                <input
                  type="checkbox"
                  name="permissions"
                  value={p.id}
                  defaultChecked={layer?.permissions.includes(p.id)}
                />
                <span>
                  <small>{p.group}</small> {p.label}
                </span>
              </label>
            ))}
          </fieldset>
        )}
        <div className={styles.inlineForms}>
          <button type="submit" className={styles.smallGhost}>
            {layer ? "저장" : "레이어 추가"}
          </button>
        </div>
      </form>
      {layer && !fixed && (
        <form action={deleteClubLayer}>
          <ReturnTo path={path} />
          <input type="hidden" name="clubId" value={clubId} />
          <input type="hidden" name="layerId" value={layer.id} />
          <button type="submit" className={styles.smallGhost}>
            레이어 지우기
          </button>
        </form>
      )}
    </div>
  );
}

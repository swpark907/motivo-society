import { beforeEach, describe, expect, it } from "vitest";
import { anon, as, code, ID, newUser, reseed } from "./helpers";

// 화면이 바뀌어도 지켜져야 하는 DB 규칙. 각 테스트는 가짜 데이터를 처음 상태로 되돌리고 시작한다.
beforeEach(async () => {
  await reseed();
});

describe("참가 신청과 정원", () => {
  it("마지막 자리는 확정, 그다음은 대기, 취소하면 대기자가 올라간다", async () => {
    const guest = await as("guest");
    const member = await as("member");
    expect((await guest.rpc("participation_apply", { p_activity: ID.tonight })).data).toBe(
      "confirmed",
    );
    expect((await member.rpc("participation_apply", { p_activity: ID.tonight })).data).toBe(
      "waitlisted",
    );

    expect(
      code((await guest.rpc("participation_cancel", { p_activity: ID.tonight })).error),
    ).toBeNull();
    const { data } = await member
      .from("participations")
      .select("status")
      .eq("activity_id", ID.tonight)
      .eq("user_id", ID.member)
      .single();
    expect(data?.status).toBe("confirmed");
  });

  it("남은 한 자리에 동시에 신청해도 한 명만 확정된다", async () => {
    const people = await Promise.all(["guest", "member", "host", "filler4", "filler5"].map(as));
    const results = await Promise.all(
      people.map((c) => c.rpc("participation_apply", { p_activity: ID.tonight })),
    );
    const statuses = results.map((r) => r.data);
    expect(statuses.filter((s) => s === "confirmed")).toHaveLength(1);
    expect(statuses.filter((s) => s === "waitlisted")).toHaveLength(4);
  });

  it("멤버 전용 모임은 클럽 밖 사람의 신청을 거부한다", async () => {
    const guest = await as("guest");
    const { error } = await guest.rpc("participation_apply", { p_activity: ID.membersOnly });
    expect(code(error)).toBe("members_only");
  });
});

describe("돈의 흐름과 이용권", () => {
  it("입금 확인 → 이용권 → 참가자 전용 모임 신청 → 환불하면 이용권 회수", async () => {
    const guest = await as("guest");
    const owner = await as("owner");

    expect(code((await guest.rpc("participation_apply", { p_activity: ID.followup })).error)).toBe(
      "entitlement_required",
    );
    expect((await guest.rpc("participation_apply", { p_activity: ID.workshop })).data).toBe(
      "pending_payment",
    );
    const { data: order } = await guest
      .from("orders")
      .select("id, amount")
      .eq("activity_id", ID.workshop)
      .eq("user_id", ID.guest)
      .single();
    expect(order?.amount).toBe(15000);

    // 호스트는 입금을 확인할 수 없다(운영진만).
    const host = await as("host");
    expect(code((await host.rpc("order_confirm_payment", { p_order: order!.id })).error)).toBe(
      "forbidden",
    );
    expect(
      code((await owner.rpc("order_confirm_payment", { p_order: order!.id })).error),
    ).toBeNull();

    expect((await guest.rpc("participation_apply", { p_activity: ID.followup })).data).toBe(
      "confirmed",
    );

    // 결제한 참가는 취소가 아니라 환불 요청으로만 나간다.
    expect(code((await guest.rpc("participation_cancel", { p_activity: ID.workshop })).error)).toBe(
      "refund_required",
    );
    const { data: amount } = await guest.rpc("refund_request", {
      p_order: order!.id,
      p_reason: "",
    });
    expect(amount).toBe(15000); // 시작 10일 전 · 시험 규정 100%
    const { data: refund } = await owner
      .from("refunds")
      .select("id")
      .eq("order_id", order!.id)
      .single();
    expect(
      code((await owner.rpc("refund_decide", { p_refund: refund!.id, p_approve: true })).error),
    ).toBeNull();

    const { data: ent } = await guest
      .from("entitlements")
      .select("status")
      .eq("activity_id", ID.workshop)
      .eq("user_id", ID.guest)
      .single();
    expect(ent?.status).toBe("revoked");
  });
});

describe("보이는 범위", () => {
  it("초안·운영 기록·참가자 전용 정보는 권한 없는 사람에게 보이지 않는다", async () => {
    const guest = await as("guest");
    const { data: drafts } = await guest.from("activities").select("id").eq("id", ID.draft);
    expect(drafts).toHaveLength(0);
    const { data: logs } = await guest.from("audit_logs").select("id");
    expect(logs).toHaveLength(0);
    const { data: priv } = await guest.from("activity_private").select("activity_id");
    expect(priv).toHaveLength(0);
    const { data: info } = await guest.rpc("get_activity_private", { p_activity: ID.tonight });
    expect((info as { access: string }).access).toBe("none");

    const host = await as("host");
    const { data: ownDraft } = await host.from("activities").select("id").eq("id", ID.draft);
    expect(ownDraft).toHaveLength(1);
  });

  it("로그인하지 않아도 공개 활동은 읽힌다(DM 링크 진입)", async () => {
    const { data } = await anon().from("activities").select("id").eq("id", ID.tonight);
    expect(data).toHaveLength(1);
  });
});

describe("클럽 레이어 권한", () => {
  it("운영진은 자기에게 없는 권한의 레이어로 지정할 수 없고, 아래 레이어로는 지정할 수 있다", async () => {
    const staff = await as("club-staff");
    const deny = await staff.rpc("club_assign_layer", {
      p_club: ID.club,
      p_user: ID.member,
      p_layer: ID.layerBan,
    });
    expect(code(deny.error)).toBe("cannot_grant_unowned");
    const ok = await staff.rpc("club_assign_layer", {
      p_club: ID.club,
      p_user: ID.member,
      p_layer: ID.layerLeader,
    });
    expect(code(ok.error)).toBeNull();
  });

  it("마지막 관리자는 클럽을 나갈 수 없다", async () => {
    const admin = await as("club-admin");
    expect(code((await admin.rpc("club_leave", { p_club: ID.club })).error)).toBe("last_admin");
  });
});

describe("챌린지 인증", () => {
  it("참가자는 오늘 인증을 올리고, 참가하지 않은 사람은 올릴 수 없다", async () => {
    const member = await as("member");
    const ok = await member.rpc("certification_submit", {
      p_activity: ID.challenge,
      p_body: "오늘 기록",
    });
    expect(code(ok.error)).toBeNull();
    const host = await as("host");
    const deny = await host.rpc("certification_submit", { p_activity: ID.challenge, p_body: "x" });
    expect(code(deny.error)).toBe("not_confirmed");
  });
});

describe("첫 가입 온보딩", () => {
  async function interestIds(client: Awaited<ReturnType<typeof newUser>>, count: number) {
    const { data } = await client.from("interests").select("id").order("sort_order").limit(count);
    return (data ?? []).map((row) => row.id);
  }

  it("닉네임은 겹칠 수 없고(대소문자 무시), 형식이 맞아야 한다", async () => {
    const fresh = await newUser();
    const ids = await interestIds(fresh, 1);
    expect((await fresh.rpc("nickname_check", { p_nickname: "멤버하나" })).data).toBe(
      "nickname_taken",
    );
    expect(
      code(
        (
          await fresh.rpc("profile_complete_onboarding", {
            p_nickname: "멤버하나",
            p_interests: ids,
          })
        ).error,
      ),
    ).toBe("nickname_taken");
    expect(
      code(
        (await fresh.rpc("profile_complete_onboarding", { p_nickname: "a", p_interests: ids }))
          .error,
      ),
    ).toBe("nickname_invalid");
    expect(
      code(
        (
          await fresh.rpc("profile_complete_onboarding", {
            p_nickname: "공백 있음",
            p_interests: ids,
          })
        ).error,
      ),
    ).toBe("nickname_invalid");

    const other = await newUser();
    expect(
      code(
        (
          await other.rpc("profile_complete_onboarding", {
            p_nickname: "BaraKing",
            p_interests: ids,
          })
        ).error,
      ),
    ).toBeNull();
    expect((await fresh.rpc("nickname_check", { p_nickname: "baraking" })).data).toBe(
      "nickname_taken",
    );
    expect(
      code(
        (
          await fresh.rpc("profile_complete_onboarding", {
            p_nickname: "baraking",
            p_interests: ids,
          })
        ).error,
      ),
    ).toBe("nickname_taken");
  });

  it("관심사는 1~5개이고, 마치면 프로필과 관심사가 생긴다", async () => {
    const fresh = await newUser();
    const six = await interestIds(fresh, 6);
    expect(
      code(
        (await fresh.rpc("profile_complete_onboarding", { p_nickname: "새사람", p_interests: [] }))
          .error,
      ),
    ).toBe("interests_count");
    expect(
      code(
        (await fresh.rpc("profile_complete_onboarding", { p_nickname: "새사람", p_interests: six }))
          .error,
      ),
    ).toBe("interests_count");
    expect(
      code(
        (
          await fresh.rpc("profile_complete_onboarding", {
            p_nickname: "새사람",
            p_interests: ["00000000-0000-4000-ffff-000000000000"],
          })
        ).error,
      ),
    ).toBe("interest_invalid");

    expect(
      code(
        (
          await fresh.rpc("profile_complete_onboarding", {
            p_nickname: " 새사람 ",
            p_interests: six.slice(0, 3),
          })
        ).error,
      ),
    ).toBeNull();
    const { data: user } = await fresh.auth.getUser();
    const { data: profile } = await fresh
      .from("profiles")
      .select("nickname, onboarded_at")
      .eq("id", user.user!.id)
      .single();
    expect(profile?.nickname).toBe("새사람");
    expect(profile?.onboarded_at).not.toBeNull();
    const { count } = await fresh
      .from("profile_interests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.user!.id);
    expect(count).toBe(3);
  });

  it("로그인하지 않으면 온보딩 함수를 부를 수 없다", async () => {
    const { error } = await anon().rpc("profile_complete_onboarding", {
      p_nickname: "익명",
      p_interests: [],
    });
    expect(error).not.toBeNull();
  });
});

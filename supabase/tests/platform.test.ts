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

describe("초대 링크 미리보기", () => {
  it("코드를 가진 누구나 어느 클럽인지 보지만, 만든 사람·사용 횟수는 받지 않는다", async () => {
    const host = await as("host");
    const { data: invite } = await host.rpc("club_invite_create", { p_club: ID.videoClub });
    const preview = (await anon().rpc("club_invite_preview", { p_code: String(invite) }))
      .data as Record<string, unknown>;
    expect(preview).toMatchObject({
      valid: true,
      slug: "ai-video-club",
      name: "AI 영상 만들기 클럽",
    });
    expect(Object.keys(preview).sort()).toEqual(["members", "name", "slug", "tagline", "valid"]);
  });

  it("승인 대기 중인 사람도 초대 링크로는 바로 멤버가 되고, 같은 신청을 또 할 수는 없다", async () => {
    const guest = await as("guest");
    expect((await guest.rpc("club_join", { p_club: ID.videoClub })).data).toBe("pending");
    expect(code((await guest.rpc("club_join", { p_club: ID.videoClub })).error)).toBe(
      "already_member",
    );
    const { data: invite } = await (
      await as("host")
    ).rpc("club_invite_create", { p_club: ID.videoClub });
    const { error } = await guest.rpc("club_join_by_invite", { p_code: String(invite) });
    expect(error).toBeNull();
    const { data: me } = await guest
      .from("club_members")
      .select("status")
      .eq("club_id", ID.videoClub)
      .eq("user_id", ID.guest)
      .single();
    expect(me?.status).toBe("active");
    expect(code((await guest.rpc("club_join_by_invite", { p_code: String(invite) })).error)).toBe(
      "already_member",
    );
  });

  it("없는 코드는 아무 클럽도 알려 주지 않는다", async () => {
    const { data } = await anon().rpc("club_invite_preview", { p_code: "abcdef123456" });
    expect(data).toEqual({ valid: false });
  });
});

describe("호스트 도구 입구", () => {
  it("호스트·클럽 운영진은 들어오고, 일반 멤버는 들어오지 못한다", async () => {
    const access = async (h: string) =>
      ((await (await as(h)).rpc("host_access")).data ?? {}) as Record<string, unknown>;
    expect(await access("host")).toMatchObject({ eligible: true, host_tier: "paid" });
    expect(await access("club-staff")).toMatchObject({ eligible: true, club_create: true });
    expect(await access("member")).toMatchObject({ eligible: false, managed: 0 });
    expect((await anon().rpc("host_access")).error).not.toBeNull();
  });

  it("내가 연 활동은 지난 것까지 전부, 시즌 회차는 빼고, 남의 개인 활동은 없다", async () => {
    const host = await as("host");
    const { data } = await host.rpc("host_my_activities");
    const ids = (data ?? []) as string[];
    expect(ids).toContain(ID.workshop);
    expect(ids).toContain("00000000-0000-4000-c000-000000000009"); // 시즌
    expect(ids).not.toContain("00000000-0000-4000-c000-000000000010"); // 시즌 1회차
    expect(ids).not.toContain(ID.challenge); // 클럽 주최(바라호스트는 그 클럽 운영진이 아님)
    const { data: mine } = await (await as("member")).rpc("host_my_activities");
    expect(mine).toEqual([]);
  });
});

describe("호스트 보관함", () => {
  it("양식·장소·문구는 본인만 보고, 같은 이름의 양식은 덮어쓰며 일정은 저장하지 않는다", async () => {
    const host = await as("host");
    const member = await as("member");

    const { data: id, error } = await host.rpc("template_save", {
      p_name: "카페 수다",
      p_data: { kind: "gathering", title: "새 제목", startsAt: "2026-12-01T19:00" },
    });
    expect(error).toBeNull();
    const { data: rows } = await host.from("activity_templates").select("id, data");
    expect(rows).toHaveLength(1); // seed의 같은 이름 양식을 덮어썼다
    expect(rows?.[0].id).toBe(id);
    expect(rows?.[0].data).toEqual({ kind: "gathering", title: "새 제목" });

    expect(await member.from("activity_templates").select("id")).toMatchObject({ data: [] });
    expect(await member.from("saved_places").select("id")).toMatchObject({ data: [] });
    expect(await member.from("saved_snippets").select("id")).toMatchObject({ data: [] });

    // 남의 것은 고치거나 지울 수 없다
    const { data: place } = await host.from("saved_places").select("id").single();
    expect(
      code(
        (
          await member.rpc("place_save", {
            p_id: place!.id,
            p_name: "가로채기",
            p_area: "",
            p_address_detail: "",
          })
        ).error,
      ),
    ).toBe("not_found");
    expect(
      code((await member.rpc("saved_delete", { p_kind: "place", p_id: place!.id })).error),
    ).toBe("not_found");
    expect(
      code((await host.rpc("saved_delete", { p_kind: "place", p_id: place!.id })).error),
    ).toBeNull();

    // 직접 쓰기는 막혀 있다
    expect(
      (await host.from("saved_snippets").insert({ owner_id: ID.host, title: "x", body: "y" }))
        .error,
    ).not.toBeNull();
    expect((await anon().rpc("snippet_save", { p_title: "x", p_body: "y" })).error).not.toBeNull();
  });

  it("빈 이름·너무 긴 문구는 거절한다", async () => {
    const host = await as("host");
    expect(code((await host.rpc("template_save", { p_name: " ", p_data: {} })).error)).toBe(
      "name_required",
    );
    expect(
      code((await host.rpc("snippet_save", { p_title: "안내", p_body: "가".repeat(1001) })).error),
    ).toBe("too_long");
    expect(code((await host.rpc("template_save", { p_name: "x", p_data: [] })).error)).toBe(
      "invalid_template",
    );
  });
});

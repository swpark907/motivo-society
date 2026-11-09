import { describe, expect, it } from "vitest";
import {
  applyTemplate,
  emptyDraft,
  firstInvalidStep,
  kstInputToIso,
  organizerChoices,
  parseDraft,
  parseImportParts,
  stepErrors,
  toCreatePayload,
  type Draft,
} from "./activity-draft";

const NOW = new Date("2026-11-09T03:00:00Z"); // 한국 11.9 12:00
const CLUB = "00000000-0000-4000-b000-000000000001";

const choices = organizerChoices({
  hostTier: "basic",
  official: false,
  clubs: [{ id: CLUB, name: "주말 클럽", paidHosts: [{ id: "h1", nickname: "바라호스트" }] }],
});

const draft = (over: Partial<Draft>): Draft => ({ ...emptyDraft("host"), ...over });

describe("주최 고르기", () => {
  it("클럽 → 개인 → 공식, 기본 호스트는 유료·시즌 불가", () => {
    expect(choices.map((c) => c.value)).toEqual([`club:${CLUB}`, "host"]);
    expect(choices[1]).toMatchObject({ paid: false, series: false });
    expect(choices[0]).toMatchObject({ paid: true, series: true });
  });

  it("기본 호스트는 시즌을 열 수 없다고 알린다", () => {
    expect(stepErrors("kind", draft({ kind: "series" }), choices, NOW).organizer).toMatch(/시즌/);
    expect(stepErrors("kind", draft({ organizer: "" }), choices, NOW).organizer).toBeDefined();
    expect(stepErrors("kind", draft({}), choices, NOW)).toEqual({});
  });
});

describe("단계별 검사", () => {
  it("기본 정보: 제목 필수, 화상 링크 모양", () => {
    expect(stepErrors("basic", draft({}), choices, NOW).title).toBeDefined();
    expect(
      stepErrors("basic", draft({ title: "모임", videoUrl: "meet.test" }), choices, NOW).videoUrl,
    ).toBeDefined();
    expect(stepErrors("basic", draft({ title: "모임" }), choices, NOW)).toEqual({});
    expect(
      stepErrors("basic", draft({ title: "모임", placeName: "가".repeat(41) }), choices, NOW)
        .placeName,
    ).toBeDefined();
  });

  it("모임 일정: 한국 시간으로 읽고, 지난 시각·거꾸로 된 끝을 막는다", () => {
    expect(
      stepErrors("schedule", draft({ startsAt: "2026-11-09T11:59" }), choices, NOW).startsAt,
    ).toBe("시작이 이미 지났어요.");
    expect(
      stepErrors(
        "schedule",
        draft({ startsAt: "2026-11-10T19:00", endsAt: "2026-11-10T18:00" }),
        choices,
        NOW,
      ).endsAt,
    ).toBe("끝이 시작보다 빨라요.");
    expect(stepErrors("schedule", draft({ startsAt: "2026-11-10T19:00" }), choices, NOW)).toEqual(
      {},
    );
  });

  it("시즌 일정: 회차 수·간격·길이", () => {
    const e = stepErrors(
      "schedule",
      draft({
        kind: "series",
        firstStartsAt: "2026-11-12T20:00",
        sessionCount: "13",
        intervalDays: "0",
        durationMinutes: "5",
      }),
      choices,
      NOW,
    );
    expect(Object.keys(e).sort()).toEqual(["durationMinutes", "intervalDays", "sessionCount"]);
  });

  it("챌린지: 오늘 시작 가능, 매일 인증이면 완주 조건 ≤ 기간 일수, 인증 방법 하나 이상", () => {
    const base = { kind: "challenge" as const, startsOn: "2026-11-09", endsOn: "2026-11-15" };
    expect(stepErrors("schedule", draft({ ...base, threshold: "7" }), choices, NOW)).toEqual({});
    expect(
      stepErrors("schedule", draft({ ...base, threshold: "8" }), choices, NOW).threshold,
    ).toMatch(/7일/);
    expect(
      stepErrors("schedule", draft({ ...base, threshold: "3", certRule: "weekly_n" }), choices, NOW)
        .certN,
    ).toBeDefined();
    expect(
      stepErrors("schedule", draft({ ...base, threshold: "3", certText: false }), choices, NOW)
        .certText,
    ).toBeDefined();
    expect(
      stepErrors(
        "schedule",
        draft({ ...base, startsOn: "2026-11-08", threshold: "3" }),
        choices,
        NOW,
      ).startsOn,
    ).toBeDefined();
  });

  it("자리·가격: 기본 호스트의 유료, 클럽 유료의 정산 대상, 대상 조건", () => {
    expect(stepErrors("seats", draft({ price: "10000" }), choices, NOW).price).toMatch(
      /유료 호스트/,
    );
    const club = draft({ organizer: `club:${CLUB}`, price: "10000" });
    expect(stepErrors("seats", club, choices, NOW).payee).toBeDefined();
    expect(stepErrors("seats", { ...club, payee: "h1" }, choices, NOW)).toEqual({});
    expect(
      stepErrors("seats", draft({ audience: "club_members" }), choices, NOW).audience,
    ).toBeDefined();
    expect(
      stepErrors("seats", draft({ audience: "entitlement_holders" }), choices, NOW)
        .requiredActivity,
    ).toBeDefined();
    expect(stepErrors("seats", draft({ capacity: "0" }), choices, NOW).capacity).toBeDefined();
  });

  it("확인 전 처음 걸리는 단계를 알려 준다", () => {
    expect(firstInvalidStep(draft({ title: "모임" }), choices, NOW)?.step).toBe("schedule");
    expect(
      firstInvalidStep(draft({ title: "모임", startsAt: "2026-11-10T19:00" }), choices, NOW),
    ).toBeNull();
  });
});

describe("DB에 넘길 모양", () => {
  it("datetime-local은 한국 시간", () => {
    expect(kstInputToIso("2026-11-10T19:00")).toBe("2026-11-10T19:00:00+09:00");
    expect(kstInputToIso("")).toBe("");
  });

  it("종류에 맞는 칸만, 형식에 맞는 장소만 보낸다", () => {
    const p = toCreatePayload(
      draft({
        title: " 모임 ",
        format: "online",
        placeName: "카페",
        videoUrl: "https://meet.test/x",
        startsAt: "2026-11-10T19:00",
        allowLateJoin: true,
      }),
    );
    expect(p).toMatchObject({
      kind: "gathering",
      organizer: "host",
      club_id: "",
      title: "모임",
      place_name: "",
      video_url: "https://meet.test/x",
      starts_at: "2026-11-10T19:00:00+09:00",
      allow_late_join: false,
      payee_user_id: "",
    });
    expect(p).not.toHaveProperty("starts_on");

    const c = toCreatePayload(
      draft({
        kind: "challenge",
        organizer: `club:${CLUB}`,
        certLink: true,
        price: "5000",
        payee: "h1",
      }),
    );
    expect(c).toMatchObject({
      organizer: "club",
      club_id: CLUB,
      cert_formats: ["text", "link"],
      payee_user_id: "h1",
    });
    expect(c).not.toHaveProperty("format");
  });

  it("받은 JSON은 아는 키·모양만 남긴다", () => {
    expect(parseDraft("{")).toBeNull();
    expect(parseDraft(JSON.stringify({ kind: "party" }))).toBeNull();
    const d = parseDraft(
      JSON.stringify({ kind: "series", title: "시즌", certText: "yes", joinMode: "x", evil: 1 }),
    );
    expect(d).toMatchObject({
      kind: "series",
      title: "시즌",
      certText: false,
      joinMode: "instant",
    });
    expect(d).not.toHaveProperty("evil");
  });
});

describe("지난 활동에서 가져오기", () => {
  const src = draft({
    kind: "series",
    organizer: `club:${CLUB}`,
    title: "4주 시즌",
    summary: "한 주에 한 번",
    format: "online",
    videoUrl: "https://meet.test/s",
    capacity: "6",
    price: "40000",
    payee: "h1",
    joinMode: "approval",
    sessionCount: "6",
    startsAt: "2026-10-01T19:00",
    firstStartsAt: "2026-10-01T19:00",
  });

  it("take가 없으면 전부, 모르는 값은 버린다", () => {
    expect(parseImportParts(undefined)).toHaveLength(5);
    expect(parseImportParts("place,evil,intro")).toEqual(["intro", "place"]);
    expect(parseImportParts("")).toEqual([]);
  });

  it("고른 항목만 옮기고, 종류는 원본 · 일정은 비운다", () => {
    const d = applyTemplate(emptyDraft(), src, ["intro", "capacity"], choices);
    expect(d).toMatchObject({
      kind: "series",
      organizer: `club:${CLUB}`,
      title: "4주 시즌",
      capacity: "6",
      price: "0",
      format: "offline",
      joinMode: "instant",
      sessionCount: "4",
      firstStartsAt: "",
      startsAt: "",
    });
    const all = applyTemplate(emptyDraft(), src, parseImportParts(undefined), choices);
    expect(all).toMatchObject({
      price: "40000",
      payee: "h1",
      videoUrl: "https://meet.test/s",
      joinMode: "approval",
      sessionCount: "6",
      firstStartsAt: "",
    });
  });

  it("지금 고를 수 없는 주최는 옮기지 않는다", () => {
    const d = applyTemplate(emptyDraft(), { ...src, organizer: "official" }, [], choices);
    expect(d.organizer).toBe("");
  });
});

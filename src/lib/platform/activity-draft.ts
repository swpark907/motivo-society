// 활동 만들기(/host/new)의 입력 값 · 단계별 검사 · DB 함수(activity_create)에 넘길 모양.
// React·DB 의존 없음. 화면은 단계마다 이 검사를 쓰고, 서버 액션은 전체를 한 번 더 검사한다.
// 최종 판단(권한 · 정산 대상 · 일정)은 DB 함수가 한다 — 여기는 사람이 고칠 수 있게 미리 알려 주는 몫.
import type { ActivityKind } from "./explore-filters";
import { kstDateKey } from "./schedule";

export type CreateOptions = {
  hostTier: "basic" | "paid" | null;
  official: boolean;
  clubs: { id: string; name: string; paidHosts: { id: string; nickname: string }[] }[];
};

export type OrganizerChoice = {
  /** "host" · "official" · "club:<id>" */
  value: string;
  kind: "club" | "host" | "official";
  clubId: string | null;
  label: string;
  /** 이 주최로 유료 활동을 열 수 있나 */
  paid: boolean;
  /** 이 주최로 시즌을 열 수 있나 */
  series: boolean;
  paidHosts: { id: string; nickname: string }[];
};

/** 내가 고를 수 있는 주최. 클럽(활동 열기 권한) → 개인 호스트 → 모쏘 공식 순. */
export function organizerChoices(o: CreateOptions): OrganizerChoice[] {
  return [
    ...o.clubs.map((c) => ({
      value: `club:${c.id}`,
      kind: "club" as const,
      clubId: c.id,
      label: c.name,
      paid: c.paidHosts.length > 0,
      series: true,
      paidHosts: c.paidHosts,
    })),
    ...(o.hostTier
      ? [
          {
            value: "host",
            kind: "host" as const,
            clubId: null,
            label:
              o.hostTier === "paid" ? "개인 호스트 (유료 호스트)" : "개인 호스트 (기본 호스트)",
            paid: o.hostTier === "paid",
            series: o.hostTier === "paid",
            paidHosts: [],
          },
        ]
      : []),
    ...(o.official
      ? [
          {
            value: "official",
            kind: "official" as const,
            clubId: null,
            label: "모쏘 공식",
            paid: true,
            series: true,
            paidHosts: [],
          },
        ]
      : []),
  ];
}

export type Draft = {
  kind: ActivityKind;
  organizer: string;
  title: string;
  summary: string;
  format: "offline" | "online";
  placeName: string;
  area: string;
  addressDetail: string;
  videoUrl: string;
  /** datetime-local 값("2026-11-20T19:00"), 한국 시간으로 읽는다 */
  startsAt: string;
  endsAt: string;
  firstStartsAt: string;
  sessionCount: string;
  intervalDays: string;
  durationMinutes: string;
  /** date 값("2026-11-20") */
  startsOn: string;
  endsOn: string;
  certRule: "daily" | "weekly_n" | "total_n";
  certN: string;
  threshold: string;
  mission: string;
  certText: boolean;
  certLink: boolean;
  capacity: string;
  price: string;
  payee: string;
  joinMode: "instant" | "approval";
  audience: "anyone" | "club_members" | "entitlement_holders";
  requiredActivity: string;
  allowLateJoin: boolean;
};

export function emptyDraft(organizer = ""): Draft {
  return {
    kind: "gathering",
    organizer,
    title: "",
    summary: "",
    format: "offline",
    placeName: "",
    area: "",
    addressDetail: "",
    videoUrl: "",
    startsAt: "",
    endsAt: "",
    firstStartsAt: "",
    sessionCount: "4",
    intervalDays: "7",
    durationMinutes: "120",
    startsOn: "",
    endsOn: "",
    certRule: "daily",
    certN: "",
    threshold: "",
    mission: "",
    certText: true,
    certLink: false,
    capacity: "",
    price: "0",
    payee: "",
    joinMode: "instant",
    audience: "anyone",
    requiredActivity: "",
    allowLateJoin: false,
  };
}

export type StepId = "kind" | "basic" | "schedule" | "seats" | "confirm";

export const STEPS: { id: StepId; label: string }[] = [
  { id: "kind", label: "종류·주최" },
  { id: "basic", label: "기본 정보" },
  { id: "schedule", label: "일정" },
  { id: "seats", label: "자리·가격" },
  { id: "confirm", label: "확인" },
];

export const TITLE_MAX = 60;
export const SUMMARY_MAX = 120;

export type Errors = Partial<Record<keyof Draft, string>>;

/** datetime-local 값을 한국 시간 ISO로. 빈 값은 빈 문자열. */
export function kstInputToIso(value: string): string {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00+09:00` : "";
}

const isInt = (v: string) => /^\d+$/.test(v.trim());
const num = (v: string) => Number(v.trim());

function daysBetween(on: string, off: string): number {
  return Math.round((Date.parse(`${off}T00:00:00Z`) - Date.parse(`${on}T00:00:00Z`)) / 86_400_000);
}

/** 한 단계의 입력 검사. 고칠 칸 → 사람 말. 비어 있으면 다음 단계로 갈 수 있다. */
export function stepErrors(step: StepId, d: Draft, choices: OrganizerChoice[], now: Date): Errors {
  const e: Errors = {};
  const org = choices.find((c) => c.value === d.organizer);

  if (step === "kind") {
    if (!org) e.organizer = "누구 이름으로 열지 골라 주세요.";
    else if (d.kind === "series" && !org.series)
      e.organizer = "시즌은 유료 호스트나 클럽 · 공식 주최로만 열 수 있어요.";
  }

  if (step === "basic") {
    if (!d.title.trim()) e.title = "제목을 적어 주세요.";
    else if (d.title.trim().length > TITLE_MAX) e.title = `제목은 ${TITLE_MAX}자까지예요.`;
    if (d.summary.trim().length > SUMMARY_MAX) e.summary = `소개는 ${SUMMARY_MAX}자까지예요.`;
    for (const [key, max] of [
      ["placeName", 40],
      ["area", 40],
      ["addressDetail", 80],
    ] as const) {
      if (d[key].trim().length > max) e[key] = `${max}자까지 적을 수 있어요.`;
    }
    if (d.kind !== "challenge" && d.videoUrl.trim() && !/^https?:\/\//.test(d.videoUrl.trim()))
      e.videoUrl = "링크는 http:// 또는 https://로 시작해야 해요.";
  }

  if (step === "schedule") {
    if (d.kind === "gathering") {
      const start = kstInputToIso(d.startsAt);
      if (!start) e.startsAt = "시작 일시를 골라 주세요.";
      else if (Date.parse(start) < now.getTime()) e.startsAt = "시작이 이미 지났어요.";
      const end = kstInputToIso(d.endsAt);
      if (start && end && Date.parse(end) < Date.parse(start)) e.endsAt = "끝이 시작보다 빨라요.";
    } else if (d.kind === "series") {
      const start = kstInputToIso(d.firstStartsAt);
      if (!start) e.firstStartsAt = "첫 회차 일시를 골라 주세요.";
      else if (Date.parse(start) < now.getTime()) e.firstStartsAt = "첫 회차가 이미 지났어요.";
      if (!isInt(d.sessionCount) || num(d.sessionCount) < 2 || num(d.sessionCount) > 12)
        e.sessionCount = "회차는 2~12개예요.";
      if (!isInt(d.intervalDays) || num(d.intervalDays) < 1)
        e.intervalDays = "간격은 1일 이상이에요.";
      if (!isInt(d.durationMinutes) || num(d.durationMinutes) < 10)
        e.durationMinutes = "회차 길이는 10분 이상이에요.";
    } else {
      const today = kstDateKey(now);
      if (!d.startsOn) e.startsOn = "시작일을 골라 주세요.";
      else if (d.startsOn < today) e.startsOn = "시작일이 이미 지났어요.";
      if (!d.endsOn) e.endsOn = "종료일을 골라 주세요.";
      else if (d.startsOn && d.endsOn < d.startsOn) e.endsOn = "종료일이 시작일보다 빨라요.";
      if (d.certRule !== "daily" && (!isInt(d.certN) || num(d.certN) < 1))
        e.certN = "몇 회인지 1 이상으로 적어 주세요.";
      if (!isInt(d.threshold) || num(d.threshold) < 1)
        e.threshold = "완주 조건(인증 횟수)을 1 이상으로 적어 주세요.";
      else if (
        d.certRule === "daily" &&
        d.startsOn &&
        d.endsOn &&
        d.endsOn >= d.startsOn &&
        num(d.threshold) > daysBetween(d.startsOn, d.endsOn) + 1
      )
        e.threshold = `매일 인증이면 완주 조건은 기간 일수(${daysBetween(d.startsOn, d.endsOn) + 1}일)를 넘을 수 없어요.`;
      if (!d.certText && !d.certLink) e.certText = "인증 방법을 하나 이상 골라 주세요.";
      if (d.mission.trim().length > 60) e.mission = "미션은 60자까지예요.";
    }
  }

  if (step === "seats") {
    if (d.capacity.trim() && (!isInt(d.capacity) || num(d.capacity) < 1))
      e.capacity = "정원은 1명 이상이에요. 제한이 없으면 비워 두세요.";
    if (!isInt(d.price)) e.price = "참가비는 0 이상의 숫자로 적어 주세요.";
    else if (num(d.price) > 0 && org && !org.paid)
      e.price =
        org.kind === "club"
          ? "이 클럽에는 정산받을 유료 호스트가 없어 유료로 열 수 없어요."
          : "유료 활동은 유료 호스트만 열 수 있어요.";
    else if (
      num(d.price) > 0 &&
      org?.kind === "club" &&
      !org.paidHosts.some((h) => h.id === d.payee)
    )
      e.payee = "정산받을 사람을 골라 주세요.";
    if (d.audience === "club_members" && org?.kind !== "club")
      e.audience = "멤버 전용은 클럽 주최 활동에서만 고를 수 있어요.";
    if (d.audience === "entitlement_holders" && !d.requiredActivity)
      e.requiredActivity = "참가 자격이 될 이전 활동을 골라 주세요.";
  }

  return e;
}

/** 확인 전 모든 단계 검사. 처음 걸리는 단계와 그 오류. */
export function firstInvalidStep(
  d: Draft,
  choices: OrganizerChoice[],
  now: Date,
): { step: StepId; errors: Errors } | null {
  for (const { id } of STEPS) {
    const errors = stepErrors(id, d, choices, now);
    if (Object.keys(errors).length > 0) return { step: id, errors };
  }
  return null;
}

/** activity_create(p jsonb)에 넘길 모양. 종류에 맞지 않는 칸은 보내지 않는다. */
export function toCreatePayload(d: Draft): Record<string, unknown> {
  const [organizer, clubId = ""] = d.organizer.split(":");
  const price = d.price.trim() || "0";
  const base: Record<string, unknown> = {
    kind: d.kind,
    organizer,
    club_id: clubId,
    title: d.title.trim(),
    summary: d.summary.trim(),
    capacity: d.capacity.trim(),
    price,
    payee_user_id: organizer === "club" && Number(price) > 0 ? d.payee : "",
    join_mode: d.joinMode,
    audience: d.audience,
    required_activity_id: d.audience === "entitlement_holders" ? d.requiredActivity : "",
    allow_late_join: d.kind !== "gathering" && d.allowLateJoin,
  };
  if (d.kind !== "challenge") {
    Object.assign(base, {
      format: d.format,
      place_name: d.format === "offline" ? d.placeName.trim() : "",
      area: d.format === "offline" ? d.area.trim() : "",
      address_detail: d.format === "offline" ? d.addressDetail.trim() : "",
      video_url: d.format === "online" ? d.videoUrl.trim() : "",
    });
  }
  if (d.kind === "gathering") {
    Object.assign(base, { starts_at: kstInputToIso(d.startsAt), ends_at: kstInputToIso(d.endsAt) });
  } else if (d.kind === "series") {
    Object.assign(base, {
      first_starts_at: kstInputToIso(d.firstStartsAt),
      session_count: d.sessionCount.trim(),
      interval_days: d.intervalDays.trim(),
      duration_minutes: d.durationMinutes.trim(),
    });
  } else {
    Object.assign(base, {
      starts_on: d.startsOn,
      ends_on: d.endsOn,
      cert_rule: d.certRule,
      cert_n: d.certRule === "daily" ? "" : d.certN.trim(),
      cert_formats: [d.certText && "text", d.certLink && "link"].filter(Boolean),
      completion_threshold: d.threshold.trim(),
      mission: d.mission.trim(),
    });
  }
  return base;
}

const DRAFT_KEYS = Object.keys(emptyDraft()) as (keyof Draft)[];

/** 서버 액션이 받은 JSON을 Draft로. 모르는 키는 버리고, 모양이 틀린 값은 빈 값으로. */
export function parseDraft(json: string): Draft | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.kind !== "string") return null;
  const base = emptyDraft();
  const out = { ...base } as Record<string, unknown>;
  for (const k of DRAFT_KEYS) {
    const v = r[k];
    if (typeof base[k] === "boolean") out[k] = v === true;
    else if (typeof v === "string") out[k] = v.slice(0, 500);
  }
  const d = out as Draft;
  if (!["gathering", "series", "challenge"].includes(d.kind)) return null;
  if (!["offline", "online"].includes(d.format)) d.format = "offline";
  if (!["daily", "weekly_n", "total_n"].includes(d.certRule)) d.certRule = "daily";
  if (!["instant", "approval"].includes(d.joinMode)) d.joinMode = "instant";
  if (!["anyone", "club_members", "entitlement_holders"].includes(d.audience))
    d.audience = "anyone";
  return d;
}

// ─────────────────────────────────────────────── 지난 활동에서 가져오기(H04)

export type ImportPart = "intro" | "place" | "capacity" | "price" | "rules";

export const IMPORT_PARTS: { id: ImportPart; label: string; help: string }[] = [
  { id: "intro", label: "소개", help: "제목과 한 줄 소개" },
  { id: "place", label: "장소", help: "진행 방식 · 장소 · 상세 주소 · 화상 링크" },
  { id: "capacity", label: "정원", help: "정원" },
  { id: "price", label: "가격", help: "참가비 · 정산받을 사람" },
  {
    id: "rules",
    label: "진행 방식",
    help: "참가 확정 · 대상 · 중간 합류, 시즌 회차 구성, 챌린지 인증 규칙",
  },
];

/** 주소의 take 값("intro,place")을 읽는다. 없으면 전부, 모르는 값은 버린다. */
export function parseImportParts(value: string | undefined): ImportPart[] {
  if (value === undefined) return IMPORT_PARTS.map((p) => p.id);
  const wanted = new Set(value.split(","));
  return IMPORT_PARTS.map((p) => p.id).filter((id) => wanted.has(id));
}

/**
 * 원본(지난 활동을 Draft 모양으로 읽은 것)에서 고른 항목만 새 초안에 옮긴다.
 * 종류는 늘 원본을 따르고, 주최는 지금도 고를 수 있을 때만 옮긴다. 일정은 옮기지 않는다.
 */
export function applyTemplate(
  base: Draft,
  src: Draft,
  parts: ImportPart[],
  choices: OrganizerChoice[],
): Draft {
  const d: Draft = { ...base, kind: src.kind };
  if (choices.some((c) => c.value === src.organizer)) d.organizer = src.organizer;
  const take = new Set(parts);
  if (take.has("intro")) Object.assign(d, { title: src.title, summary: src.summary });
  if (take.has("place")) {
    Object.assign(d, {
      format: src.format,
      placeName: src.placeName,
      area: src.area,
      addressDetail: src.addressDetail,
      videoUrl: src.videoUrl,
    });
  }
  if (take.has("capacity")) d.capacity = src.capacity;
  if (take.has("price")) Object.assign(d, { price: src.price, payee: src.payee });
  if (take.has("rules")) {
    Object.assign(d, {
      joinMode: src.joinMode,
      audience: src.audience,
      requiredActivity: src.requiredActivity,
      allowLateJoin: src.allowLateJoin,
      sessionCount: src.sessionCount,
      intervalDays: src.intervalDays,
      durationMinutes: src.durationMinutes,
      certRule: src.certRule,
      certN: src.certN,
      threshold: src.threshold,
      mission: src.mission,
      certText: src.certText,
      certLink: src.certLink,
    });
  }
  return d;
}

/** 저장한 양식의 내용을 만들기 입력으로 읽는다. 모양이 틀리면 null(화면은 "열 수 없는 양식"으로). */
export function templateDraft(data: unknown): Draft | null {
  return parseDraft(JSON.stringify(data ?? null));
}

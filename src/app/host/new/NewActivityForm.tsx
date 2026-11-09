"use client";

// 클라이언트 컴포넌트인 이유: 다섯 단계를 오가며 입력을 잃지 않고(useState), 단계마다 바로 검사해 알려 준다.
// 최종 검사와 만들기는 서버 액션 → DB 함수가 다시 한다.
import { useActionState, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import {
  kstInputToIso,
  STEPS,
  stepErrors,
  SUMMARY_MAX,
  TITLE_MAX,
  type Draft,
  type Errors,
  type OrganizerChoice,
  type StepId,
} from "@/lib/platform/activity-draft";
import { clockTime, shortDate } from "@/lib/platform/activity-time";
import { KIND_LABELS, won } from "@/lib/platform/messages";
import type { SavedPlace } from "@/lib/platform/host-saved";
import {
  createAction,
  quickSavePlaceAction,
  saveTemplateAction,
  type CreateState,
} from "./actions";
import s from "./new.module.scss";

const KIND_HELP: Record<Draft["kind"], string> = {
  gathering: "한 번 만나는 자리. 오프라인이나 온라인 화상으로.",
  series: "정해진 회차를 같은 사람들과 이어서. 신청은 시즌 전체로 한 번.",
  challenge: "기간 동안 각자 인증을 올리고, 조건을 채우면 완주.",
};

const CERT_RULES: Record<Draft["certRule"], string> = {
  daily: "매일",
  weekly_n: "주 N회",
  total_n: "기간 중 총 N회",
};

const AUDIENCE: Record<Draft["audience"], string> = {
  anyone: "누구나",
  club_members: "클럽 멤버만",
  entitlement_holders: "이전 활동 참가자만",
};

export function NewActivityForm({
  choices,
  initial,
  previous,
  places: savedPlaces,
}: {
  choices: OrganizerChoice[];
  /** 처음 값(지난 활동 · 양식에서 가져온 것 포함) */
  initial: Draft;
  previous: { id: string; title: string }[];
  /** 내 보관함의 장소 즐겨찾기 */
  places: SavedPlace[];
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [places, setPlaces] = useState(savedPlaces);
  const [placeNote, setPlaceNote] = useState<string | null>(null);
  const [placeSaving, startPlaceSave] = useTransition();
  const [templateName, setTemplateName] = useState("");
  const [templateNote, setTemplateNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [templateSaving, startTemplateSave] = useTransition();
  const [step, setStep] = useState<StepId>("kind");
  const [errors, setErrors] = useState<Errors>({});
  const [state, action, pending] = useActionState<CreateState, FormData>(createAction, {
    error: null,
    step: null,
    errors: {},
  });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // 마지막으로 보여 준 단계. 처음 열 때(개발 모드의 효과 두 번 실행 포함)는 움직이지 않는다.
  const shownStep = useRef(step);

  // 서버가 돌려보낸 검사 오류는 그 단계로 데려가 보여 준다.
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.step) {
      setStep(state.step);
      setErrors(state.errors);
    }
  }

  // 단계를 옮기면 그 단계 제목으로 포커스(화면 읽기 프로그램이 새 단계를 읽는다).
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    // 단계 표시부터 보이게 올리고, 포커스는 새 단계 제목에.
    wrapRef.current?.scrollIntoView({ block: "start" });
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const index = STEPS.findIndex((x) => x.id === step);
  const org = choices.find((c) => c.value === draft.organizer);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  function go(target: StepId) {
    setErrors({});
    setStep(target);
  }

  function next() {
    const e = stepErrors(step, draft, choices, new Date());
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    go(STEPS[index + 1].id);
  }

  const text = (key: keyof Draft, label: string, extra: InputExtra = {}) => (
    <Field id={key} label={label} hint={extra.hint} error={errors[key]}>
      <input
        id={key}
        type={extra.type ?? "text"}
        inputMode={extra.inputMode}
        min={extra.min}
        max={extra.max}
        maxLength={extra.maxLength}
        placeholder={extra.placeholder}
        value={String(draft[key])}
        onChange={(ev) => set(key, ev.target.value as never)}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={describedBy(key, extra.hint, errors[key])}
      />
    </Field>
  );

  return (
    <div className={s.wrap} ref={wrapRef}>
      <ol className={s.steps} aria-label="만들기 단계">
        {STEPS.map((x, i) => (
          <li key={x.id} aria-current={x.id === step ? "step" : undefined} data-done={i < index}>
            <span aria-hidden="true">{i + 1}</span>
            <span className={s.stepLabel}>{x.label}</span>
          </li>
        ))}
      </ol>

      <section className={s.card} aria-labelledby="step-h">
        <h2 id="step-h" ref={headingRef} tabIndex={-1}>
          {index + 1}. {STEPS[index].label}
        </h2>

        {step === "kind" && (
          <>
            <fieldset className={s.choiceGroup}>
              <legend>어떤 활동인가요?</legend>
              {(["gathering", "series", "challenge"] as const).map((k) => (
                <label key={k} className={s.choice} data-kind={k}>
                  <input
                    type="radio"
                    name="kind"
                    checked={draft.kind === k}
                    onChange={() => set("kind", k)}
                  />
                  <span>
                    <strong>{KIND_LABELS[k]}</strong>
                    <small>{KIND_HELP[k]}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <fieldset
              className={s.choiceGroup}
              aria-describedby={errors.organizer ? "organizer-error" : undefined}
            >
              <legend>누구 이름으로 여나요?</legend>
              {choices.map((c) => (
                <label key={c.value} className={s.choice}>
                  <input
                    type="radio"
                    name="organizer"
                    checked={draft.organizer === c.value}
                    onChange={() => {
                      set("organizer", c.value);
                      // 주최가 바뀌면 그 주최에만 있던 선택(정산 대상 · 멤버 전용)은 비운다.
                      set("payee", "");
                      if (c.kind !== "club" && draft.audience === "club_members")
                        set("audience", "anyone");
                    }}
                  />
                  <span>
                    <strong>{c.kind === "club" ? `클럽 · ${c.label}` : c.label}</strong>
                    <small>{organizerHelp(c)}</small>
                  </span>
                </label>
              ))}
              {errors.organizer && (
                <p id="organizer-error" className={s.error}>
                  {errors.organizer}
                </p>
              )}
            </fieldset>
          </>
        )}

        {step === "basic" && (
          <div className={s.fields}>
            {text("title", "제목", {
              maxLength: TITLE_MAX,
              hint: `${draft.title.trim().length}/${TITLE_MAX}자`,
            })}
            <Field
              id="summary"
              label="한 줄 소개 (선택)"
              hint={`목록과 공유 미리보기에 보여요 · ${draft.summary.trim().length}/${SUMMARY_MAX}자`}
              error={errors.summary}
              wide
            >
              <textarea
                id="summary"
                rows={2}
                maxLength={SUMMARY_MAX}
                value={draft.summary}
                onChange={(ev) => set("summary", ev.target.value)}
                aria-invalid={errors.summary ? true : undefined}
                aria-describedby={describedBy("summary", true, errors.summary)}
              />
            </Field>
            {draft.kind !== "challenge" && (
              <>
                <fieldset className={`${s.segmented} ${s.wideField}`}>
                  <legend>진행 방식</legend>
                  {(["offline", "online"] as const).map((f) => (
                    <label key={f}>
                      <input
                        type="radio"
                        name="format"
                        checked={draft.format === f}
                        onChange={() => set("format", f)}
                      />
                      <span>{f === "offline" ? "오프라인" : "온라인"}</span>
                    </label>
                  ))}
                </fieldset>
                {draft.format === "offline" ? (
                  <>
                    {places.length > 0 && (
                      <Field id="savedPlace" label="저장한 장소에서 고르기" wide>
                        <select
                          id="savedPlace"
                          value=""
                          onChange={(ev) => {
                            const p = places.find((x) => x.id === ev.target.value);
                            if (!p) return;
                            set("placeName", p.name);
                            set("area", p.area);
                            set("addressDetail", p.addressDetail);
                            setPlaceNote(`저장한 장소로 채웠어요: ${p.name}`);
                          }}
                        >
                          <option value="">고르기</option>
                          {places.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                              {p.area ? ` · ${p.area}` : ""}
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}
                    {text("placeName", "장소 이름 (선택)", { maxLength: 40 })}
                    {text("area", "지역 (선택)", {
                      maxLength: 40,
                      hint: "목록에 보여요. 예: 서울 마포구",
                    })}
                    {text("addressDetail", "상세 주소 (선택)", {
                      maxLength: 80,
                      hint: "참가가 확정된 사람에게만 보여요.",
                    })}
                    <div className={`${s.inlineAction} ${s.wideField}`}>
                      {draft.placeName.trim() &&
                        !places.some(
                          (p) =>
                            p.name === draft.placeName.trim() &&
                            p.area === draft.area.trim() &&
                            p.addressDetail === draft.addressDetail.trim(),
                        ) && (
                          <button
                            type="button"
                            className={s.ghost}
                            disabled={placeSaving}
                            onClick={() =>
                              startPlaceSave(async () => {
                                const r = await quickSavePlaceAction({
                                  name: draft.placeName,
                                  area: draft.area,
                                  addressDetail: draft.addressDetail,
                                });
                                if ("error" in r) setPlaceNote(r.error);
                                else {
                                  setPlaces((now) => [r.place, ...now]);
                                  setPlaceNote(`장소 즐겨찾기에 저장했어요: ${r.place.name}`);
                                }
                              })
                            }
                          >
                            {placeSaving ? "저장하는 중…" : "이 장소 즐겨찾기에 저장"}
                          </button>
                        )}
                      {placeNote && (
                        <p className={s.hint} role="status">
                          {placeNote}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  text("videoUrl", "화상 링크 (선택)", {
                    type: "url",
                    placeholder: "https://",
                    hint: "확정된 사람에게 시작 30분 전부터 보여요. 나중에 넣어도 돼요.",
                  })
                )}
              </>
            )}
          </div>
        )}

        {step === "schedule" && (
          <div className={s.fields}>
            <p className={s.note}>모든 시각은 한국 시간이에요.</p>
            {draft.kind === "gathering" && (
              <>
                {text("startsAt", "시작", { type: "datetime-local" })}
                {text("endsAt", "끝 (선택)", { type: "datetime-local" })}
              </>
            )}
            {draft.kind === "series" && (
              <>
                {text("firstStartsAt", "첫 회차 시작", { type: "datetime-local" })}
                {text("sessionCount", "회차 수", {
                  type: "number",
                  inputMode: "numeric",
                  min: 2,
                  max: 12,
                  hint: "2~12회",
                })}
                {text("intervalDays", "회차 간격 (일)", {
                  type: "number",
                  inputMode: "numeric",
                  min: 1,
                  hint: "매주면 7",
                })}
                {text("durationMinutes", "회차 길이 (분)", {
                  type: "number",
                  inputMode: "numeric",
                  min: 10,
                })}
              </>
            )}
            {draft.kind === "challenge" && (
              <>
                {text("startsOn", "시작일", { type: "date" })}
                {text("endsOn", "종료일", { type: "date" })}
                <Field id="certRule" label="인증 규칙">
                  <select
                    id="certRule"
                    value={draft.certRule}
                    onChange={(ev) => set("certRule", ev.target.value as Draft["certRule"])}
                  >
                    {Object.entries(CERT_RULES).map(([v, label]) => (
                      <option key={v} value={v}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                {draft.certRule !== "daily" &&
                  text("certN", draft.certRule === "weekly_n" ? "주에 몇 회" : "기간 중 몇 회", {
                    type: "number",
                    inputMode: "numeric",
                    min: 1,
                  })}
                {text("threshold", "완주 조건 (인정된 인증 횟수)", {
                  type: "number",
                  inputMode: "numeric",
                  min: 1,
                })}
                {text("mission", "기본 미션 (선택)", {
                  maxLength: 60,
                  hint: "참가자 화면의 오늘 할 일. 예: 오늘 만든 것 한 줄",
                })}
                <fieldset
                  className={`${s.checks} ${s.wideField}`}
                  aria-describedby={errors.certText ? "certText-error" : undefined}
                >
                  <legend>인증 방법</legend>
                  <label>
                    <input
                      type="checkbox"
                      checked={draft.certText}
                      onChange={(ev) => set("certText", ev.target.checked)}
                    />
                    <span>글</span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={draft.certLink}
                      onChange={(ev) => set("certLink", ev.target.checked)}
                    />
                    <span>링크</span>
                  </label>
                  {errors.certText && (
                    <p id="certText-error" className={s.error}>
                      {errors.certText}
                    </p>
                  )}
                </fieldset>
              </>
            )}
          </div>
        )}

        {step === "seats" && (
          <div className={s.fields}>
            {text("capacity", "정원 (선택)", {
              type: "number",
              inputMode: "numeric",
              min: 1,
              hint: "비우면 제한 없음. 차면 대기 명단으로 받아요.",
            })}
            {text("price", "참가비 (원)", {
              type: "number",
              inputMode: "numeric",
              min: 0,
              hint: org?.paid
                ? "0이면 무료. 유료면 참가자가 입금하고 운영진이 확인해요."
                : "지금 주최로는 무료로만 열 수 있어요.",
            })}
            {org?.kind === "club" && Number(draft.price) > 0 && (
              <Field id="payee" label="정산받을 사람" error={errors.payee}>
                <select
                  id="payee"
                  value={draft.payee}
                  onChange={(ev) => set("payee", ev.target.value)}
                  aria-invalid={errors.payee ? true : undefined}
                  aria-describedby={describedBy("payee", false, errors.payee)}
                >
                  <option value="">고르기</option>
                  {org.paidHosts.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.nickname}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <fieldset className={`${s.segmented} ${s.wideField}`}>
              <legend>참가 확정</legend>
              {(["instant", "approval"] as const).map((m) => (
                <label key={m}>
                  <input
                    type="radio"
                    name="joinMode"
                    checked={draft.joinMode === m}
                    onChange={() => set("joinMode", m)}
                  />
                  <span>{m === "instant" ? "신청하면 바로" : "내가 승인하면"}</span>
                </label>
              ))}
            </fieldset>
            <Field id="audience" label="누가 신청할 수 있나요" error={errors.audience}>
              <select
                id="audience"
                value={draft.audience}
                onChange={(ev) => set("audience", ev.target.value as Draft["audience"])}
                aria-invalid={errors.audience ? true : undefined}
                aria-describedby={describedBy("audience", false, errors.audience)}
              >
                {Object.entries(AUDIENCE)
                  .filter(([v]) => v !== "club_members" || org?.kind === "club")
                  .filter(([v]) => v !== "entitlement_holders" || previous.length > 0)
                  .map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
              </select>
            </Field>
            {draft.audience === "entitlement_holders" && (
              <Field id="requiredActivity" label="이전 활동" error={errors.requiredActivity}>
                <select
                  id="requiredActivity"
                  value={draft.requiredActivity}
                  onChange={(ev) => set("requiredActivity", ev.target.value)}
                  aria-invalid={errors.requiredActivity ? true : undefined}
                  aria-describedby={describedBy("requiredActivity", false, errors.requiredActivity)}
                >
                  <option value="">고르기</option>
                  {previous.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {draft.kind !== "gathering" && (
              <label className={`${s.checkLine} ${s.wideField}`}>
                <input
                  type="checkbox"
                  checked={draft.allowLateJoin}
                  onChange={(ev) => set("allowLateJoin", ev.target.checked)}
                />
                <span>시작한 뒤에도 중간 합류 받기</span>
              </label>
            )}
          </div>
        )}

        {step === "confirm" && (
          <dl className={s.summary}>
            {summaryRows(draft, org, previous).map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
                <button
                  type="button"
                  className={s.link}
                  onClick={() => go(row.step)}
                  aria-label={`${row.label} 고치기`}
                >
                  고치기
                </button>
              </div>
            ))}
          </dl>
        )}

        {step === "confirm" && (
          <div className={s.saveTemplate}>
            <Field
              id="templateName"
              label="양식으로 저장 (선택)"
              hint="다음에 비슷한 활동을 열 때 이 내용으로 시작해요. 일정은 저장하지 않고, 같은 이름이 있으면 새 내용으로 바꿔요."
            >
              <input
                id="templateName"
                maxLength={40}
                placeholder="예: 월례 모각코"
                value={templateName}
                onChange={(ev) => {
                  setTemplateName(ev.target.value);
                  setTemplateNote(null);
                }}
                aria-describedby="templateName-hint"
              />
            </Field>
            <button
              type="button"
              className={s.ghost}
              disabled={templateSaving || !templateName.trim()}
              onClick={() =>
                startTemplateSave(async () => {
                  const name = templateName.trim();
                  const r = await saveTemplateAction(name, JSON.stringify(draft));
                  setTemplateNote(
                    r.error
                      ? { ok: false, text: r.error }
                      : { ok: true, text: `양식을 저장했어요: ${name}` },
                  );
                })
              }
            >
              {templateSaving ? "저장하는 중…" : "양식 저장"}
            </button>
            {templateNote && (
              <p
                className={templateNote.ok ? s.hint : s.error}
                role={templateNote.ok ? "status" : "alert"}
              >
                {templateNote.text}
              </p>
            )}
          </div>
        )}

        {state.error && (
          <p className={s.errorBox} role="alert">
            {state.error}
          </p>
        )}

        <div className={s.nav}>
          {index > 0 ? (
            <button type="button" className={s.ghost} onClick={() => go(STEPS[index - 1].id)}>
              이전
            </button>
          ) : (
            <span />
          )}
          {step === "confirm" ? (
            <form action={action}>
              <input type="hidden" name="draft" value={JSON.stringify(draft)} />
              <button type="submit" className={s.primary} disabled={pending}>
                {pending ? "만드는 중…" : "초안으로 만들기"}
              </button>
            </form>
          ) : (
            <button type="button" className={s.next} onClick={next}>
              다음
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

type InputExtra = {
  type?: string;
  inputMode?: "numeric";
  min?: number;
  max?: number;
  maxLength?: number;
  placeholder?: string;
  hint?: string;
};

function describedBy(id: string, hint: unknown, error: string | undefined): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

function Field({
  id,
  label,
  hint,
  error,
  wide,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`${s.field} ${wide ? s.wideField : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && (
        <small id={`${id}-hint`} className={s.hint}>
          {hint}
        </small>
      )}
      {error && (
        <p id={`${id}-error`} className={s.error}>
          {error}
        </p>
      )}
    </div>
  );
}

function organizerHelp(c: OrganizerChoice): string {
  if (c.kind === "club")
    return c.paid
      ? "클럽 활동으로 열려요. 유료면 정산받을 유료 호스트를 골라요."
      : "클럽 활동으로 열려요. 이 클럽은 무료로만 열 수 있어요.";
  if (c.kind === "official") return "모쏘가 여는 활동이에요.";
  return c.paid ? "내 이름으로 열고 정산은 내가 받아요." : "내 이름으로 무료 모임·챌린지를 열어요.";
}

function when(d: Draft): string {
  // 확인 화면은 다른 화면과 같은 말로: "11.20 (금) · 오후 7:30"
  const local = (v: string) => {
    const iso = kstInputToIso(v);
    return iso ? `${shortDate(new Date(iso))} · ${clockTime(new Date(iso))}` : "";
  };
  const day = (v: string) => (v ? shortDate(new Date(`${v}T00:00:00+09:00`)) : "");
  if (d.kind === "gathering")
    return [local(d.startsAt), local(d.endsAt)].filter(Boolean).join(" ~ ");
  if (d.kind === "series")
    return `${local(d.firstStartsAt)}부터 ${d.intervalDays}일 간격 · ${d.sessionCount}회 · 회차당 ${d.durationMinutes}분`;
  const rule =
    d.certRule === "daily" ? "매일 인증" : `${CERT_RULES[d.certRule].replace("N", d.certN)} 인증`;
  return `${day(d.startsOn)} ~ ${day(d.endsOn)} · ${rule} · ${d.threshold}회 이상이면 완주`;
}

function summaryRows(
  d: Draft,
  org: OrganizerChoice | undefined,
  previous: { id: string; title: string }[],
): { label: string; value: string; step: StepId }[] {
  const place =
    d.kind === "challenge"
      ? null
      : d.format === "online"
        ? `온라인${d.videoUrl ? " · 화상 링크 있음" : " · 화상 링크는 나중에"}`
        : [d.placeName, d.area].filter(Boolean).join(" · ") || "오프라인 · 장소 미정";
  const price = Number(d.price) > 0 ? won(Number(d.price)) : "무료";
  const payee =
    org?.kind === "club" && Number(d.price) > 0
      ? ` · 정산 ${org.paidHosts.find((h) => h.id === d.payee)?.nickname ?? ""}`
      : "";
  const audience =
    d.audience === "entitlement_holders"
      ? `${AUDIENCE[d.audience]} (${previous.find((p) => p.id === d.requiredActivity)?.title ?? ""})`
      : AUDIENCE[d.audience];
  return [
    { label: "종류", value: KIND_LABELS[d.kind], step: "kind" },
    {
      label: "주최",
      value: org ? (org.kind === "club" ? `클럽 · ${org.label}` : org.label) : "",
      step: "kind",
    },
    { label: "제목", value: d.title.trim(), step: "basic" },
    ...(d.summary.trim()
      ? [{ label: "소개", value: d.summary.trim(), step: "basic" as const }]
      : []),
    ...(place ? [{ label: "장소", value: place, step: "basic" as const }] : []),
    { label: "일정", value: when(d), step: "schedule" },
    {
      label: "자리",
      value: d.capacity.trim() ? `정원 ${d.capacity.trim()}명` : "정원 없음",
      step: "seats",
    },
    { label: "참가비", value: price + payee, step: "seats" },
    {
      label: "신청",
      value: `${audience} · ${d.joinMode === "approval" ? "내가 승인하면 확정" : "신청하면 바로 확정"}${
        d.kind !== "gathering" && d.allowLateJoin ? " · 중간 합류 받음" : ""
      }`,
      step: "seats",
    },
  ];
}

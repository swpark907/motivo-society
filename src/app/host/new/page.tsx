import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import {
  applyTemplate,
  emptyDraft,
  IMPORT_PARTS,
  organizerChoices,
  parseImportParts,
} from "@/lib/platform/activity-draft";
import { getCreateOptions, getTemplateSource, listHostActivities } from "@/lib/platform/host";
import { listSaved } from "@/lib/platform/host-saved";
import { hostTabOf, HOST_TABS } from "@/lib/platform/host-view";
import { KIND_LABELS } from "@/lib/platform/messages";
import { requireUser } from "@/lib/platform/session";
import { NewActivityForm } from "./NewActivityForm";
import s from "./new.module.scss";

export const metadata: Metadata = {
  title: "활동 만들기",
  robots: { index: false },
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(",") : v);

export default async function NewActivityPage({ searchParams }: PageProps<"/host/new">) {
  const sp = await searchParams;
  const from = typeof sp.from === "string" && /^[0-9a-f-]{36}$/.test(sp.from) ? sp.from : null;
  const templateId =
    typeof sp.template === "string" && /^[0-9a-f-]{36}$/.test(sp.template) ? sp.template : null;
  const parts = parseImportParts(one(sp.take));
  await requireUser("/host/new");
  const [options, mine, source, saved] = await Promise.all([
    getCreateOptions(),
    listHostActivities(),
    from ? getTemplateSource(from) : Promise.resolve(null),
    listSaved(),
  ]);
  // 양식으로 시작하면 양식의 내용을 전부 가져온다(지난 활동 가져오기와 같은 규칙, 일정은 비움).
  const template = templateId ? saved.templates.find((t) => t.id === templateId) : undefined;
  const templateDraft = template?.draft ?? null;
  const choices = organizerChoices(options);
  const base = emptyDraft(choices.length === 1 ? choices[0].value : "");
  const previous = mine
    .filter((a) => a.status !== "draft" && a.status !== "cancelled")
    .map((a) => ({ id: a.id, title: a.title }));
  const imported = templateDraft
    ? applyTemplate(base, templateDraft, parseImportParts(undefined), choices)
    : source
      ? applyTemplate(base, source.draft, parts, choices)
      : base;
  // 가져온 "이전 활동 참가자만"이 지금 고를 수 없는 활동을 가리키면, 화면 선택과 값이 어긋나지 않게 비운다.
  const initial =
    imported.audience === "entitlement_holders" &&
    !previous.some((p) => p.id === imported.requiredActivity)
      ? {
          ...imported,
          audience: previous.length ? imported.audience : ("anyone" as const),
          requiredActivity: "",
        }
      : imported;
  const organizerDropped =
    (templateDraft !== null && initial.organizer !== templateDraft.organizer) ||
    (!templateDraft && source !== null && initial.organizer !== source.draft.organizer);
  const now = new Date();
  const tabLabel = (a: (typeof mine)[number]) =>
    HOST_TABS.find((t) => t.tab === hostTabOf(a, now))?.label ?? "";

  if (choices.length === 0) {
    return (
      <Page>
        <EmptyState
          title="아직 활동을 열 수 있는 자격이 없어요"
          body="호스트 자격이 있거나, 클럽에서 모임·시즌·챌린지를 여는 역할을 맡으면 여기서 만들 수 있어요."
          action={{ href: "/host", label: "호스트 도구로" }}
        />
      </Page>
    );
  }

  return (
    <Page>
      {saved.templates.some((t) => t.draft) && (
        <nav className={s.templates} aria-label="내 양식으로 시작">
          <span>내 양식으로 시작</span>
          {saved.templates
            .filter((t) => t.draft)
            .map((t) => (
              <Link
                key={t.id}
                href={`/host/new?template=${t.id}`}
                aria-current={t.id === templateId ? "true" : undefined}
              >
                {t.name}
              </Link>
            ))}
          <Link href="/host/saved#templates" className={s.manage}>
            보관함
          </Link>
        </nav>
      )}

      {/* 가져오기에 성공하면 접어 두고(아래 알림이 결과를 말한다), 실패했을 때만 펼친다. */}
      {mine.length > 0 && (
        <details className={s.import} open={from !== null && !source}>
          <summary>지난 활동에서 가져오기</summary>
          <form action="/host/new" className={s.importForm}>
            <div className={s.field}>
              <label htmlFor="from">가져올 활동</label>
              <select id="from" name="from" defaultValue={from ?? ""} required>
                <option value="" disabled>
                  고르기
                </option>
                {mine.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{KIND_LABELS[a.kind]}] {a.title} · {tabLabel(a)}
                  </option>
                ))}
              </select>
            </div>
            <fieldset className={s.importParts}>
              <legend>가져올 항목</legend>
              {/* 아무것도 고르지 않은 것과 "주소에 take 없음(전부)"을 구분한다. */}
              <input type="hidden" name="take" value="" />
              {IMPORT_PARTS.map((p) => (
                <label key={p.id} title={p.help}>
                  <input
                    type="checkbox"
                    name="take"
                    value={p.id}
                    defaultChecked={parts.includes(p.id)}
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </fieldset>
            <p className={s.hint}>종류는 그 활동을 따르고, 일정은 비운 채 시작해요.</p>
            <button type="submit" className={s.ghost}>
              가져오기
            </button>
          </form>
        </details>
      )}

      {templateId && !templateDraft && (
        <p className={s.errorBox} role="alert">
          열 수 없는 양식이에요. 지웠거나 내 보관함에 없는 양식이에요.
        </p>
      )}
      {template && templateDraft && (
        <p className={s.imported} role="status">
          <span>
            양식으로 시작했어요: {template.name}. 일정은 비워 뒀어요.
            {organizerDropped && " 양식의 주최는 지금 고를 수 없어 비워 뒀어요."}
          </span>
          <Link href="/host/new">빈 양식으로 새로</Link>
        </p>
      )}
      {from && !source && (
        <p className={s.errorBox} role="alert">
          가져올 수 없는 활동이에요. 내가 관리하는 활동만 가져올 수 있어요.
        </p>
      )}
      {source && !templateDraft && (
        <p className={s.imported} role="status">
          <span>
            「{source.title}」에서 가져왔어요:{" "}
            {["종류", ...IMPORT_PARTS.filter((p) => parts.includes(p.id)).map((p) => p.label)].join(
              " · ",
            )}
            . 일정은 비워 뒀어요.
            {organizerDropped && " 그때의 주최는 지금 고를 수 없어 비워 뒀어요."}
          </span>
          <Link href="/host/new">가져오기 없이 새로</Link>
        </p>
      )}

      <NewActivityForm
        key={`${templateId ?? ""}|${from ?? ""}|${parts.join(",")}`}
        choices={choices}
        initial={initial}
        previous={previous}
        places={saved.places}
      />
    </Page>
  );
}

function Page({ children }: { children: ReactNode }) {
  return (
    <PlatformPage
      label="HOST · NEW"
      title="활동 만들기"
      lead="만들면 초안으로 저장돼요. 관리 화면에서 확인하고 공개해야 발견에 보여요."
      back={{ href: "/host", label: "호스트 도구" }}
    >
      {children}
    </PlatformPage>
  );
}

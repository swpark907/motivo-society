import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import { SubmitButton } from "@/components/SubmitButton/SubmitButton";
import { shortDate } from "@/lib/platform/activity-time";
import { listSaved, type SavedPlace, type SavedSnippet } from "@/lib/platform/host-saved";
import { errorMessage, KIND_LABELS, noticeMessage } from "@/lib/platform/messages";
import { requireUser } from "@/lib/platform/session";
import { deleteSavedAction, savePlaceAction, saveSnippetAction } from "./actions";
import s from "./saved.module.scss";

export const metadata: Metadata = {
  title: "내 보관함",
  robots: { index: false },
};

export default async function SavedPage({ searchParams }: PageProps<"/host/saved">) {
  const sp = await searchParams;
  await requireUser("/host/saved");
  const saved = await listSaved();
  const notice = typeof sp.notice === "string" ? noticeMessage(sp.notice) : null;
  const errorCode = typeof sp.error === "string" && /^[a-z_]+$/.test(sp.error) ? sp.error : null;

  return (
    <PlatformPage
      label="HOST · SAVED"
      title="내 보관함"
      lead="자주 쓰는 활동 양식, 장소, 공지 문구를 모아 두고 만들 때 골라 써요. 나만 볼 수 있어요."
      back={{ href: "/host", label: "호스트 도구" }}
    >
      {notice && (
        <p className={s.notice} role="status">
          {notice}
        </p>
      )}
      {errorCode && (
        <p className={s.errorBox} role="alert">
          {errorMessage(errorCode)}
        </p>
      )}

      <section className={s.section} id="templates" aria-labelledby="templates-h">
        <h2 id="templates-h">활동 양식</h2>
        <p className={s.hint}>
          활동을 만들 때 마지막 확인 단계에서 &quot;양식으로 저장&quot;하면 여기에 쌓여요. 일정은
          저장하지 않아요.
        </p>
        {saved.templates.length === 0 ? (
          <EmptyState
            title="저장한 양식이 없어요"
            action={{ href: "/host/new", label: "활동 만들기" }}
          />
        ) : (
          <ul className={s.list}>
            {saved.templates.map((t) => (
              <li key={t.id} className={s.row}>
                <div className={s.who}>
                  <strong>{t.name}</strong>
                  <small>
                    {t.draft
                      ? `${KIND_LABELS[t.draft.kind]}${t.draft.title ? ` · ${t.draft.title}` : ""}`
                      : "열 수 없는 양식이에요"}{" "}
                    · {shortDate(new Date(t.updatedAt))} 저장
                  </small>
                </div>
                <div className={s.buttons}>
                  {t.draft && (
                    <Link href={`/host/new?template=${t.id}`} className={s.primarySmall}>
                      이 양식으로 만들기
                    </Link>
                  )}
                  <DeleteButton kind="template" id={t.id} label={t.name} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={s.section} id="places" aria-labelledby="places-h">
        <h2 id="places-h">장소 즐겨찾기</h2>
        <p className={s.hint}>
          오프라인 활동의 기본 정보 단계에서 골라 채워요. 상세 주소는 참가가 확정된 사람에게만
          보여요.
        </p>
        {saved.places.length > 0 && (
          <ul className={s.list}>
            {saved.places.map((p) => (
              <li key={p.id} className={s.row}>
                <div className={s.who}>
                  <strong>{p.name}</strong>
                  <small>
                    {[p.area, p.addressDetail].filter(Boolean).join(" · ") || "주소 없음"}
                  </small>
                </div>
                <div className={s.buttons}>
                  <DeleteButton kind="place" id={p.id} label={p.name} />
                </div>
                <details className={s.edit}>
                  <summary>고치기</summary>
                  <PlaceForm place={p} />
                </details>
              </li>
            ))}
          </ul>
        )}
        <details className={s.add} open={saved.places.length === 0}>
          <summary>새 장소 저장</summary>
          <PlaceForm />
        </details>
      </section>

      <section className={s.section} id="snippets" aria-labelledby="snippets-h">
        <h2 id="snippets-h">공지 문구</h2>
        <p className={s.hint}>
          준비물·입금·리마인드처럼 자주 보내는 말을 적어 둬요. 참가자 공지를 보내는 기능이 생기면
          거기서 골라 써요.
        </p>
        {saved.snippets.length > 0 && (
          <ul className={s.list}>
            {saved.snippets.map((x) => (
              <li key={x.id} className={s.row}>
                <div className={s.who}>
                  <strong>{x.title}</strong>
                  <small className={s.body}>{x.body}</small>
                </div>
                <div className={s.buttons}>
                  <DeleteButton kind="snippet" id={x.id} label={x.title} />
                </div>
                <details className={s.edit}>
                  <summary>고치기</summary>
                  <SnippetForm snippet={x} />
                </details>
              </li>
            ))}
          </ul>
        )}
        <details className={s.add} open={saved.snippets.length === 0}>
          <summary>새 문구 저장</summary>
          <SnippetForm />
        </details>
      </section>
    </PlatformPage>
  );
}

function DeleteButton({
  kind,
  id,
  label,
}: {
  kind: "template" | "place" | "snippet";
  id: string;
  label: string;
}) {
  return (
    <form action={deleteSavedAction} aria-label={`${label} 지우기`}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <SubmitButton className={s.ghostSmall} pendingLabel="지우는 중…">
        지우기
      </SubmitButton>
    </form>
  );
}

function PlaceForm({ place }: { place?: SavedPlace }) {
  return (
    <form action={savePlaceAction} className={s.form}>
      {place && <input type="hidden" name="id" value={place.id} />}
      <label className={s.field}>
        <span>장소 이름</span>
        <input name="name" required maxLength={40} defaultValue={place?.name} />
      </label>
      <label className={s.field}>
        <span>지역 (선택)</span>
        <input name="area" maxLength={40} defaultValue={place?.area} placeholder="서울 마포구" />
      </label>
      <label className={`${s.field} ${s.wide}`}>
        <span>상세 주소 (선택)</span>
        <input name="addressDetail" maxLength={80} defaultValue={place?.addressDetail} />
      </label>
      <SubmitButton className={s.primarySmall} pendingLabel="저장하는 중…">
        {place ? "고친 내용 저장" : "장소 저장"}
      </SubmitButton>
    </form>
  );
}

function SnippetForm({ snippet }: { snippet?: SavedSnippet }) {
  return (
    <form action={saveSnippetAction} className={s.form}>
      {snippet && <input type="hidden" name="id" value={snippet.id} />}
      <label className={`${s.field} ${s.wide}`}>
        <span>제목</span>
        <input
          name="title"
          required
          maxLength={40}
          defaultValue={snippet?.title}
          placeholder="준비물 안내"
        />
      </label>
      <label className={`${s.field} ${s.wide}`}>
        <span>내용</span>
        <textarea name="body" required maxLength={1000} rows={4} defaultValue={snippet?.body} />
      </label>
      <SubmitButton className={s.primarySmall} pendingLabel="저장하는 중…">
        {snippet ? "고친 내용 저장" : "문구 저장"}
      </SubmitButton>
    </form>
  );
}

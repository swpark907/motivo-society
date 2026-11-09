import type { Metadata } from "next";
import Image from "next/image";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import { SubmitButton } from "@/components/SubmitButton/SubmitButton";
import { getCreateOptions } from "@/lib/platform/host";
import { listMedia, type MediaAsset } from "@/lib/platform/host-media";
import { errorMessage, noticeMessage } from "@/lib/platform/messages";
import { requireUser } from "@/lib/platform/session";
import { deleteMediaAction, uploadMediaAction } from "./actions";
import { MediaUploadFields } from "./MediaUploadFields";
import s from "./media.module.scss";

export const metadata: Metadata = {
  title: "이미지 보관함",
  robots: { index: false },
};

export default async function MediaPage({ searchParams }: PageProps<"/host/media">) {
  const sp = await searchParams;
  await requireUser("/host/media");
  const [assets, options] = await Promise.all([listMedia(), getCreateOptions()]);
  const notice = typeof sp.notice === "string" ? noticeMessage(sp.notice) : null;
  const errorCode = typeof sp.error === "string" && /^[a-z_]+$/.test(sp.error) ? sp.error : null;
  const mine = assets.filter((a) => a.clubId === null);

  return (
    <PlatformPage
      label="HOST · IMAGES"
      title="이미지 보관함"
      lead="활동 표지로 쓸 사진을 모아 둬요. 내 보관함은 나만, 클럽 보관함은 그 클럽에서 활동을 여는 사람들이 함께 써요."
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

      <form action={uploadMediaAction} className={s.upload} aria-label="이미지 올리기">
        <MediaUploadFields
          owners={[
            { value: "me", label: "내 보관함" },
            ...options.clubs.map((c) => ({ value: c.id, label: `클럽 · ${c.name}` })),
          ]}
        />
        <SubmitButton className={s.primary} pendingLabel="올리는 중…">
          올리기
        </SubmitButton>
      </form>

      <Library title="내 보관함" id="mine" assets={mine} />
      {options.clubs.map((c) => (
        <Library
          key={c.id}
          title={`클럽 · ${c.name}`}
          id={`club-${c.id}`}
          assets={assets.filter((a) => a.clubId === c.id)}
        />
      ))}
    </PlatformPage>
  );
}

function Library({ title, id, assets }: { title: string; id: string; assets: MediaAsset[] }) {
  return (
    <section className={s.section} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>
        {title} <span>{assets.length}</span>
      </h2>
      {assets.length === 0 ? (
        <EmptyState title="아직 올린 이미지가 없어요" body="위에서 올리면 여기에 모여요." />
      ) : (
        <ul className={s.grid}>
          {assets.map((a) => (
            <li key={a.id} className={s.item}>
              <div className={s.thumb}>
                <Image
                  src={a.url}
                  alt={a.alt}
                  fill
                  unoptimized
                  sizes="(min-width: 768px) 25vw, 50vw"
                />
              </div>
              <p className={s.alt}>{a.alt || "설명 없음"}</p>
              <form action={deleteMediaAction} aria-label={`${a.alt || "이미지"} 지우기`}>
                <input type="hidden" name="id" value={a.id} />
                <SubmitButton className={s.ghostSmall} pendingLabel="지우는 중…">
                  지우기
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

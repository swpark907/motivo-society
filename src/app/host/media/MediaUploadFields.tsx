"use client";

// 클라이언트 컴포넌트인 이유: 고른 사진을 올리기 전에 미리 보여 주고, 5MB·형식을 바로 알려 준다.
// 최종 검사(파일 앞부분으로 형식 확인, 크기, 권한)는 서버 액션과 Storage가 다시 한다.
import { useEffect, useState } from "react";
import { MEDIA_MAX_BYTES } from "@/lib/platform/media";
import s from "./media.module.scss";

const TYPES = ["image/jpeg", "image/png", "image/webp"];

export function MediaUploadFields({
  owners,
  idPrefix = "media",
}: {
  owners: { value: string; label: string }[];
  idPrefix?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  return (
    <div className={s.fields}>
      <div className={s.field}>
        <label htmlFor={`${idPrefix}-file`}>이미지 (JPG · PNG · WebP, 5MB까지)</label>
        <input
          id={`${idPrefix}-file`}
          name="file"
          type="file"
          accept={TYPES.join(",")}
          required
          aria-describedby={problem ? `${idPrefix}-problem` : undefined}
          onChange={(ev) => {
            const f = ev.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
            const p = !f
              ? null
              : f.size > MEDIA_MAX_BYTES
                ? "5MB보다 커요. 줄인 사진을 골라 주세요."
                : !TYPES.includes(f.type)
                  ? "JPG · PNG · WebP 이미지만 올릴 수 있어요."
                  : null;
            setProblem(p);
            // 큰 파일이 서버로 가면 요청 크기 제한에 걸려 오류 화면이 뜬다. 제출 자체를 막는다.
            ev.target.setCustomValidity(p ?? "");
          }}
        />
        {problem && (
          <p id={`${idPrefix}-problem`} className={s.problem} role="alert">
            {problem}
          </p>
        )}
      </div>
      {preview && (
        // 고른 파일의 미리보기(blob 주소)라 next/image를 쓰지 않는다.
        // eslint-disable-next-line @next/next/no-img-element
        <img className={s.preview} src={preview} alt="고른 사진 미리보기" />
      )}
      <div className={s.field}>
        <label htmlFor={`${idPrefix}-alt`}>사진 설명 (선택)</label>
        <input
          id={`${idPrefix}-alt`}
          name="alt"
          maxLength={120}
          placeholder="예: 창가 자리에서 노트북을 펴 놓은 모습"
        />
        <small className={s.hint}>화면을 읽어 주는 프로그램이 이 설명을 읽어요.</small>
      </div>
      {owners.length > 1 ? (
        <div className={s.field}>
          <label htmlFor={`${idPrefix}-owner`}>어디에 둘까요</label>
          <select id={`${idPrefix}-owner`} name="owner" defaultValue={owners[0].value}>
            {owners.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="owner" value={owners[0]?.value ?? "me"} />
      )}
    </div>
  );
}

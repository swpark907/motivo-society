import { useEffect, useRef, useState } from "react";
import { prepareEditorialPhoto } from "@/lib/editorial/photo-upload";
import Image from "next/image";
import type { EditorialPhoto } from "@/lib/editorial/photos";
import styles from "./EditorialPreview.module.scss";
// 로컬 파일은 브라우저에서 축소·재인코딩한 뒤 탭 안에 보관한다.
export function PhotoPicker({
  photos,
  src,
  onChange,
  onUpload,
}: {
  photos: EditorialPhoto[];
  src: string;
  onChange: (src: string) => void;
  onUpload: (photo: EditorialPhoto) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current += 1;
    },
    [],
  );
  return (
    <fieldset className={styles.photoPicker}>
      <legend>사진 선택</legend>
      <p>사진을 고르면 미리보기에 바로 반영됩니다. 아래 사진 설명도 확인해주세요.</p>
      <label className={styles.uploadPhoto}>
        내 컴퓨터에서 사진 추가
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="내 컴퓨터에서 사진 추가"
          disabled={busy}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            const token = ++request.current;
            setBusy(true);
            setError("");
            try {
              const photo = await prepareEditorialPhoto(file);
              if (token !== request.current) return;
              onUpload(photo);
              onChange(photo.src);
            } catch (cause) {
              if (token === request.current)
                setError(cause instanceof Error ? cause.message : "사진을 추가하지 못했어요.");
            } finally {
              if (token === request.current) setBusy(false);
            }
          }}
        />
      </label>
      <p>
        JPEG·PNG·WebP, 10MB 이하. 편집용 JPEG로 줄이며 투명한 부분은 흰색이 됩니다. 사진은 이 탭에
        보관하고, 선택한 사진은 JSON에 함께 담습니다.
      </p>
      {busy && <p role="status">사진을 준비하고 있어요.</p>}
      {error && <p role="alert">{error}</p>}
      <div>
        {photos.map((photo) => (
          <button
            type="button"
            disabled={busy}
            key={photo.src}
            aria-label={`사진 선택: ${photo.title}`}
            aria-pressed={src === photo.src}
            onClick={() => onChange(photo.src)}
          >
            <Image src={photo.src} alt="" width={240} height={160} sizes="240px" />
            <span>{photo.title}</span>
            {src === photo.src && <small>선택됨</small>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

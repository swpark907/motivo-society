import styles from "./Avatar.module.scss";

const TONES = ["gathering", "series", "challenge", "club"] as const;

/** 이름에서 바탕색을 고른다. 활동 종류 색 네 가지 안에서만(장식 색을 늘리지 않는다). */
export function avatarTone(name: string): (typeof TONES)[number] {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

/** 사람 자리. 사진이 생기기 전까지 이름 첫 글자를 둔다. */
export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span
      className={styles.avatar}
      data-tone={avatarTone(name)}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {name.slice(0, 1)}
    </span>
  );
}

import Link from "next/link";
import s from "./club.module.scss";

// 없는 주소 · 닫힌 클럽 · 멤버에게만 보이는 클럽은 모두 여기로 온다.
export default function ClubNotFound() {
  return (
    <main className={`paper ${s.page}`}>
      <div className={s.missing}>
        <p className="label">NOT FOUND</p>
        <h1>이 클럽을 찾을 수 없어요</h1>
        <p>주소가 바뀌었거나, 문을 닫았거나, 멤버에게만 보이는 클럽일 수 있어요.</p>
        <div className={s.missingActions}>
          <Link href="/clubs" className={s.cta}>
            다른 클럽 둘러보기
          </Link>
          <Link href="/explore" className={s.ghostLink}>
            활동 찾기
          </Link>
        </div>
      </div>
    </main>
  );
}

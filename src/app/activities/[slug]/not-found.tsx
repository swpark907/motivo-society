import Link from "next/link";
import s from "./activity.module.scss";

// 없는 주소 · 지워진 활동 · 볼 수 없는(멤버 공개·작성 중) 활동은 모두 여기로 온다.
export default function ActivityNotFound() {
  return (
    <main className={`paper ${s.page}`}>
      <div className={s.missing}>
        <p className="label">NOT FOUND</p>
        <h1>이 활동을 찾을 수 없어요</h1>
        <p>주소가 바뀌었거나, 아직 공개되지 않았거나, 클럽 멤버에게만 보이는 활동일 수 있어요.</p>
        <div className={s.missingActions}>
          <Link href="/explore" className={s.cta}>
            다른 활동 둘러보기
          </Link>
          <Link href="/clubs" className={s.ghost}>
            클럽 보기
          </Link>
        </div>
      </div>
    </main>
  );
}

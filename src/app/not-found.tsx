import Link from "next/link";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import s from "./not-found.module.scss";

// 어느 경로에도 맞지 않는 주소. Next 기본 404(영어 · OS 다크 모드 반응) 대신 플랫폼 화면으로 보여 준다.
export default function NotFound() {
  return (
    <PlatformPage
      label="NOT FOUND"
      title="이 주소의 화면이 없어요"
      lead="주소가 바뀌었거나 잘못 입력됐을 수 있어요. 아래에서 다시 찾아보세요."
    >
      <div className={s.actions}>
        <Link href="/explore" className={s.primary}>
          모임 · 챌린지 둘러보기
        </Link>
        <Link href="/" className={s.secondary}>
          홈으로
        </Link>
      </div>
    </PlatformPage>
  );
}

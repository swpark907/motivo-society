// 이 화면만 감싸는 로딩(상세 화면은 감싸지 않아 없는 주소의 404를 지킨다 — 그래서 폴더 묶음 안에 둔다).
import { PlatformLoading } from "@/components/PlatformLoading/PlatformLoading";

export default function Loading() {
  return <PlatformLoading />;
}

import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";

export const metadata: Metadata = {
  title: "나",
  description: "내 일정, 주문과 환불, 프로필.",
  robots: { index: false },
};

// 로그인(백로그 L02) 전까지는 무엇이 모일지만 알려 준다. 없는 기능을 있는 것처럼 보이지 않는다.
export default function MePage() {
  return (
    <PlatformPage label="ME" title="나" lead="내 일정, 주문과 환불, 프로필이 여기에 모여요.">
      <EmptyState
        title="로그인 기능을 준비하고 있어요"
        body="로그인이 열리면 신청한 활동과 주문을 여기서 볼 수 있어요. 그동안 발견에서 이번 주 활동을 둘러보세요."
        action={{ href: "/explore", label: "발견으로" }}
      />
    </PlatformPage>
  );
}

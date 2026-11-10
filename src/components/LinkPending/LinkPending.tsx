"use client";
// 클라이언트 컴포넌트인 이유: 누른 링크가 다음 화면을 기다리는 동안(useLinkStatus) 그 자리에 로딩을 보여 준다.
// 상세 화면은 loading.tsx를 둘 수 없어서(없는 주소의 404를 지키려고) 누른 카드 위에 대신 띄운다.

import { useLinkStatus } from "next/link";
import { CapyLoading } from "@/components/CapyLoading/CapyLoading";
import styles from "./LinkPending.module.scss";

/** <Link> 안(위치가 relative인 상자 안)에 둔다. 기다리는 동안에만 작은 LOADING을 덮어 보여 준다. */
export function LinkPending({ scene }: { scene?: "walk" | "car" | "plane" }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span className={styles.cover}>
      <CapyLoading compact scene={scene} />
    </span>
  );
}

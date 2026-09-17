"use client";
// 클라이언트인 이유: 현재 경로(usePathname)로 활성 메뉴를 표시해야 함. 그 외 로직 없음.

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export function NavLink({ href, className, ...rest }: Props) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={className} aria-current={active ? "page" : undefined} {...rest} />
  );
}

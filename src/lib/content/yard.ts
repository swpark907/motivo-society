import { z } from "zod";
import { createCollection, type Entry } from "./collection";

// Yard = 상품성 항목 (클래스·오프라인 모임). 신청·결제는 보류 — 지금은 소개까지.
export const yardFrontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  kind: z.enum(["class", "meetup"]),
  status: z.enum(["upcoming", "open", "running", "closed"]),
  startsAt: z.iso.date().optional(),
  endsAt: z.iso.date().optional(),
  // 4:5 표지 이미지 (public/ 기준 경로). 없으면 포스터형 타이포 커버로 대체.
  cover: z.string().optional(),
  tags: z.array(z.string()).default([]),
  order: z.number().default(0),
});

export type YardItem = Entry<z.infer<typeof yardFrontmatterSchema>>;

const collection = createCollection("yard", yardFrontmatterSchema);
// 왼쪽부터 쌓인다: order 오름차순, 같으면 최신 시작일 먼저
const byOrder = (a: YardItem, b: YardItem) =>
  a.order - b.order || (b.startsAt ?? "").localeCompare(a.startsAt ?? "");

export const parseYardItem = collection.parse;
export const getYardSlugs = collection.slugs;
export const getYardItem = collection.get;
export const getAllYardItems = () => collection.all(byOrder);

export const YARD_STATUS_LABEL: Record<YardItem["status"], string> = {
  upcoming: "예정",
  open: "모집 중",
  running: "진행 중",
  closed: "종료",
};

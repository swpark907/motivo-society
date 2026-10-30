import { z } from "zod";

const text = z.string().trim().min(1);
const id = z.string().regex(/^[a-z][a-z0-9-]*$/);
const width = z.enum(["reading", "wide", "full"]).default("reading");
const align = z.enum(["left", "center"]).default("left");
// 브라우저에서 재인코딩한 작은 JPEG만 문서에 직접 보관한다. SVG·외부 주소는 받지 않는다.
export const MAX_EMBEDDED_PHOTO_CHARS = 900_000;
export function isEmbeddedEditorialPhoto(value: string): boolean {
  if (
    value.length > MAX_EMBEDDED_PHOTO_CHARS ||
    !/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(value)
  )
    return false;
  try {
    const data = atob(value.slice(value.indexOf(",") + 1));
    if (data.charCodeAt(data.length - 2) !== 255 || data.charCodeAt(data.length - 1) !== 217)
      return false;
    const word = (index: number) => (data.charCodeAt(index) << 8) | data.charCodeAt(index + 1);
    let offset = 2;
    while (offset + 8 < data.length) {
      if (data.charCodeAt(offset) !== 255) return false;
      const marker = data.charCodeAt(offset + 1);
      if (marker === 218 || marker === 217) return false;
      const length = word(offset + 2);
      if (length < 2 || offset + 2 + length > data.length) return false;
      if ([192, 193, 194].includes(marker)) {
        const height = word(offset + 5),
          width = word(offset + 7);
        return width > 0 && height > 0 && width <= 1600 && height <= 1600;
      }
      offset += length + 2;
    }
  } catch {
    return false;
  }
  return false;
}
const photoSource = z
  .union([
    z.string().regex(/^\/images\/workbook\/notes\/[a-z0-9-]+\.(png|jpe?g|webp)$/),
    z
      .string()
      .max(MAX_EMBEDDED_PHOTO_CHARS)
      .regex(/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/)
      .refine(isEmbeddedEditorialPhoto, "편집용 JPEG 사진을 다시 선택해주세요."),
  ])
  .describe(
    "제공 사진 경로 또는 편집기에서 생성한 1600px 이하·900000자 이하 JPEG 데이터 URL. 업로드는 편집기에서 처리한다.",
  );
const image = z.strictObject({
  src: photoSource,
  alt: text,
  caption: text,
  ratio: z.enum(["wide", "square", "portrait"]).default("wide"),
  focus: z.enum(["left", "center", "right"]).default("center"),
  crop: z.enum(["scene", "detail"]).default("scene"),
});
const paragraph = z.strictObject({
  type: z.literal("text"),
  id,
  text,
  tone: z
    .enum(["body", "lead", "small", "columns", "dropcap"])
    .default("body")
    .describe(
      "body: 기본 설명; lead: 큰 도입; small: 보조; columns: 긴 설명의 잡지 2단; dropcap: 첫 글자 강조",
    ),
  width,
  align,
});
const heading = z.strictObject({ type: z.literal("heading"), id, text });
const quote = z.strictObject({
  type: z.literal("quote"),
  id,
  text,
  label: text.optional(),
  layout: z
    .enum(["rule", "statement", "pull", "margin"])
    .default("rule")
    .describe(
      "실제 인용 또는 명시한 요청 예문. rule: 선; statement: 큰 문장; pull: 큰 따옴표; margin: 좁은 여백 인용",
    ),
  width,
  align,
});
const list = z.strictObject({
  type: z.literal("list"),
  id,
  items: z
    .array(z.strictObject({ title: text, body: text }))
    .min(2)
    .max(8),
  layout: z
    .enum(["rows", "grid", "steps", "timeline", "checklist"])
    .default("rows")
    .describe(
      "rows: 행; grid: 2열; steps: 번호; timeline: 순서가 있는 흐름; checklist: 읽기용 확인 목록",
    ),
  width,
});
const callout = z.strictObject({
  type: z.literal("callout"),
  id,
  text,
  label: text.optional(),
  layout: z
    .enum(["note", "band", "aside"])
    .default("note")
    .describe("작성자의 요약·곁가지. note: 테두리; band: 가로 띠; aside: 옆선 메모"),
  width,
  align,
});
const qa = z.strictObject({
  type: z.literal("qa"),
  id,
  items: z
    .array(z.strictObject({ question: text, answer: text }))
    .min(1)
    .max(8),
  layout: z
    .enum(["interview", "columns", "ruled"])
    .default("interview")
    .describe(
      "질문과 답변. 실제 인터뷰 사실을 만들지 않음. interview: 문답; columns: 좌우; ruled: 구분선",
    ),
  width,
});
const leaf = z.discriminatedUnion("type", [paragraph, heading, quote, list, callout, qa]);
const split = z.strictObject({
  type: z.literal("split"),
  id,
  image,
  content: z.array(leaf).min(1).max(6),
  imageSide: z.enum(["left", "right"]).default("left"),
  proportion: z.enum(["equal", "image-wide", "text-wide"]).default("equal"),
  verticalAlign: z.enum(["start", "center"]).default("center"),
  width: z.enum(["wide", "full"]).default("full"),
});
const comparison = z.strictObject({
  type: z.literal("compare"),
  id,
  items: z
    .array(z.strictObject({ label: text, text }))
    .min(2)
    .max(3),
  layout: z
    .enum(["columns", "stack", "contrast", "table"])
    .default("columns")
    .describe(
      "columns: 나란히; stack: 세로; contrast: 명암 대비; table: 라벨과 설명 대조. 명암이 우열이나 실험을 뜻하지 않음",
    ),
  caption: text,
  width: z.enum(["wide", "full"]).default("full"),
});
const photo = z.strictObject({ type: z.literal("image"), id, image, width });
export const editorialBlockSchema = z.discriminatedUnion("type", [
  paragraph,
  heading,
  quote,
  list,
  split,
  comparison,
  photo,
  callout,
  qa,
]);

// v1은 데이터다. 임의 JSX·HTML·CSS·JavaScript를 컴파일하거나 실행하지 않는다.
export const workbookReadingSchema = z.strictObject({
  version: z.literal(1),
  title: text,
  summary: text,
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  thumbnail: image.shape.src,
  thumbnailAlt: text,
  visualCaption: text,
  tags: z.array(text).min(1),
  sources: z.array(z.url()),
  layout: z.enum(["note", "feature", "guide"]).default("note"),
  cover: z.strictObject({
    layout: z.enum(["title-first", "image-first", "split", "compact"]),
    align,
    focus: image.shape.focus,
  }),
  displayTitle: z.array(text).min(1).max(3).optional(),
  deck: text.optional(),
  nextTry: text,
  related: z.array(z.strictObject({ slug: text, reason: text })).max(2),
  content: z.array(editorialBlockSchema).min(1).max(80),
});
export type EditorialBlock = z.infer<typeof editorialBlockSchema>;
export type EditorialLeaf = z.infer<typeof leaf>;
export type EditorialImage = z.infer<typeof image>;
export type WorkbookReadingDocument = z.infer<typeof workbookReadingSchema>;

export function validateWorkbookReadingReferences(readings: WorkbookReadingDocument[]) {
  const slugs = readings.map((entry) => entry.slug);
  if (new Set(slugs).size !== slugs.length) throw new Error("Duplicate workbook reading slug");
  for (const entry of readings) {
    const ids = new Set<string>([
      "reading-comments",
      "comments-title",
      "comments-scope",
      "comment-name",
      "comment-body",
      "related-title",
    ]);
    const register = (block: EditorialBlock | EditorialLeaf) => {
      if (ids.has(block.id)) throw new Error(`Duplicate block id in ${entry.slug}: ${block.id}`);
      ids.add(block.id);
      if (block.type === "split") block.content.forEach(register);
    };
    entry.content.forEach(register);
    const seen = new Set<string>();
    for (const related of entry.related) {
      if (related.slug === entry.slug || seen.has(related.slug) || !slugs.includes(related.slug)) {
        throw new Error(`Invalid related reading: ${entry.slug} -> ${related.slug}`);
      }
      seen.add(related.slug);
    }
  }
}

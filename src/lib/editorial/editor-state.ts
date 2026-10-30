import { MAX_EDITORIAL_JSON_BYTES } from "./media-limits";
import { getEditorialPhotos } from "./photos";
import {
  isEmbeddedEditorialPhoto,
  editorialBlockSchema,
  workbookReadingSchema,
  validateWorkbookReadingReferences,
  type EditorialBlock,
  type WorkbookReadingDocument,
} from "@/lib/content/workbook-editorial-schema";

export type DraftValidation =
  { ok: true; document: WorkbookReadingDocument } | { ok: false; errors: string[] };
export function validateEditorialDraft(
  value: unknown,
  documents: WorkbookReadingDocument[],
  expectedSlug: string,
  trustedDocuments = documents,
  // 독립 iframe은 스키마·신뢰된 사진을 검증하고 전체 글 연결은 부모에서 검증한다.
  previewOnly = false,
): DraftValidation {
  if (!previewOnly && !documents.some((entry) => entry.slug === expectedSlug))
    return { ok: false, errors: ["선택한 샘플을 찾을 수 없어요."] };
  const result = workbookReadingSchema.safeParse(value);
  if (!result.success)
    return {
      ok: false,
      errors: result.error.issues
        .slice(0, 8)
        .map((issue) => `${issue.path.join(".") || "문서"}: ${issue.message}`),
    };
  if (new TextEncoder().encode(JSON.stringify(result.data)).byteLength > MAX_EDITORIAL_JSON_BYTES)
    return { ok: false, errors: ["사진을 포함한 문서는 16MB 이하로 구성해주세요."] };
  if (!previewOnly && result.data.slug !== expectedSlug)
    return { ok: false, errors: ["이 실험실에서는 샘플의 영구 주소(slug)를 변경할 수 없어요."] };
  const assets = new Set(getEditorialPhotos(trustedDocuments).map((photo) => photo.src));
  const usedAssets = [
    result.data.thumbnail,
    ...result.data.content.flatMap((block) =>
      block.type === "image" || block.type === "split" ? [block.image.src] : [],
    ),
  ];
  if (usedAssets.some((asset) => !assets.has(asset) && !isEmbeddedEditorialPhoto(asset)))
    return {
      ok: false,
      errors: ["이 실험실에서 제공하는 사진만 사용할 수 있어요. 사진 선택 목록을 확인해주세요."],
    };
  try {
    if (!previewOnly)
      validateWorkbookReadingReferences(
        documents.map((entry) => (entry.slug === expectedSlug ? result.data : entry)),
      );
    return { ok: true, document: result.data };
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : "문서 연결을 확인해주세요."],
    };
  }
}
export function moveEditorialBlock(
  document: WorkbookReadingDocument,
  id: string,
  direction: -1 | 1,
): WorkbookReadingDocument {
  const index = document.content.findIndex((block) => block.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= document.content.length) return document;
  const content = [...document.content];
  [content[index], content[target]] = [content[target], content[index]];
  return { ...document, content };
}
export function cloneEditorialBlock(block: EditorialBlock, makeId: () => string): EditorialBlock {
  const clone = structuredClone(block);
  clone.id = makeId();
  if (clone.type === "split")
    clone.content = clone.content.map((item) => ({ ...item, id: makeId() }));
  return clone;
}
export function createEditorialBlock(
  type: EditorialBlock["type"],
  document: WorkbookReadingDocument,
  makeId: () => string,
): EditorialBlock {
  const base = { type, id: makeId() };
  const image = {
    src: document.thumbnail,
    alt: document.thumbnailAlt,
    caption: `${document.visualCaption} · ${document.thumbnail.startsWith("data:") ? "직접 추가한 이미지" : "AI 생성 연출 사진"}`,
  };
  const item = { title: "새 항목", body: "항목의 내용을 적어주세요." };
  switch (type) {
    case "text":
      return editorialBlockSchema.parse({ ...base, text: "새 문단을 적어주세요." });
    case "heading":
      return editorialBlockSchema.parse({ ...base, text: "새 소제목" });
    case "quote":
      return editorialBlockSchema.parse({
        ...base,
        text: "기억할 문장을 적어주세요.",
        layout: "statement",
      });
    case "callout":
      return editorialBlockSchema.parse({
        ...base,
        label: "편집 메모",
        text: "덧붙일 내용을 적어주세요.",
      });
    case "qa":
      return editorialBlockSchema.parse({
        ...base,
        items: [{ question: "질문을 적어주세요.", answer: "답변을 적어주세요." }],
      });
    case "image":
      return editorialBlockSchema.parse({ ...base, image, width: "wide" });
    case "list":
      return editorialBlockSchema.parse({
        ...base,
        items: [item, { ...item, title: "다음 항목" }],
      });
    case "compare":
      return editorialBlockSchema.parse({
        ...base,
        items: [
          { label: "처음의 요청", text: "처음 요청한 내용을 적어주세요." },
          { label: "조건을 더한 요청", text: "조건을 더한 내용을 적어주세요." },
        ],
        caption: "설명용 요청 비교 · 실제 생성 결과의 비교 실험은 아니에요.",
      });
    case "split":
      return editorialBlockSchema.parse({
        ...base,
        image,
        content: [
          {
            type: "quote",
            id: makeId(),
            text: "사진과 함께 읽을 문장을 적어주세요.",
            layout: "statement",
          },
        ],
      });
  }
}
export const EDITORIAL_PREVIEW_DOCUMENT = "motivo.editorial.preview.document.v1";
export const EDITORIAL_PREVIEW_READY = "motivo.editorial.preview.ready.v1";

export const EDITORIAL_PREVIEW_DISMISS = "motivo.editorial.preview.dismiss.v1";

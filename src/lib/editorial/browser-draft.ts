import { z } from "zod";
import {
  editorialBlockSchema,
  workbookReadingSchema,
  type EditorialBlock,
  type WorkbookReadingDocument,
} from "@/lib/content/workbook-editorial-schema";
import { validateEditorialDraft } from "./editor-state";
type StructuredBlock = Extract<EditorialBlock, { type: "compare" | "list" | "qa" }>;
const value = z.string().max(1_000_000);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const selection = z.strictObject({ slug, id: z.string().max(500) });
const photo = z.strictObject({
  src: workbookReadingSchema.shape.thumbnail,
  alt: value,
  caption: value,
});
function draftBlock(value: unknown): value is EditorialBlock {
  try {
    return editorialBlockSchema.safeParse(
      JSON.parse(
        JSON.stringify(value, (_key, item) =>
          typeof item === "string" && !item.trim() ? "내용" : item,
        ),
      ),
    ).success;
  } catch {
    return false;
  }
}
const block = z.custom<EditorialBlock>(draftBlock);
const structured = z.custom<StructuredBlock>(
  (value) => draftBlock(value) && ["compare", "list", "qa"].includes(value.type),
);
export const canvasDraftSchema = z.strictObject({
  version: z.literal(1),
  texts: z.array(z.tuple([value, value])).max(1000),
  blocks: z.array(z.tuple([value, block])).max(1000),
  covers: z.array(z.tuple([slug, photo])).max(100),
  photos: z.array(photo.extend({ title: value })).max(100),
  selection: selection.nullable(),
  editing: selection.nullable(),
  text: value.nullable(),
  contentEdit: selection.extend({ block }).nullable(),
  coverPhoto: z.strictObject({ slug, value: photo }).nullable(),
  conversion: selection
    .extend({
      type: z.enum([
        "text",
        "heading",
        "quote",
        "list",
        "compare",
        "image",
        "split",
        "callout",
        "qa",
      ]),
      input: value.optional(),
      override: structured.optional(),
    })
    .nullable(),
});
export type CanvasDraft = z.infer<typeof canvasDraftSchema>;
const metadataDraftSchema = workbookReadingSchema.extend({
  slug: value,
  title: value,
  summary: value,
  thumbnailAlt: value,
  visualCaption: value,
  nextTry: value,
  tags: z.array(value).max(100),
  sources: z.array(value).max(100),
  displayTitle: z.array(value).max(100).optional(),
  deck: value.optional(),
  related: z.array(z.strictObject({ slug: value, reason: value })).max(2),
});
export const dialogDraftSchema = z.strictObject({
  mode: z.enum(["new", "import", "info"]),
  draft: metadataDraftSchema,
  loaded: z.boolean(),
});
export type DialogDraft = z.infer<typeof dialogDraftSchema>;
const workspaceSchema = z.strictObject({
  version: z.literal(1),
  knownSeeds: z.array(slug).max(100).optional(),
  slug,
  mobile: z.boolean(),
  sessions: z
    .array(
      z.strictObject({
        document: workbookReadingSchema,
        raw: z.string().max(16 * 1024 * 1024),
        updatedAt: z.number().finite().nonnegative().optional(),
      }),
    )
    .max(100),
  canvas: canvasDraftSchema.nullable(),
  dialog: dialogDraftSchema.nullable(),
});
export type BrowserWorkspace = z.infer<typeof workspaceSchema>;
export function parseBrowserWorkspace(
  value: unknown,
  trusted: WorkbookReadingDocument[],
): BrowserWorkspace {
  const parsed = workspaceSchema.parse(value);
  const catalog = [
    ...new Map(
      [...trusted, ...parsed.sessions.map((entry) => entry.document)].map((doc) => [doc.slug, doc]),
    ).values(),
  ];
  if (
    new Set(parsed.sessions.map((entry) => entry.document.slug)).size !== parsed.sessions.length ||
    !catalog.some((doc) => doc.slug === parsed.slug)
  )
    throw new Error("저장한 글 목록을 확인해주세요.");
  for (const entry of parsed.sessions)
    if (!validateEditorialDraft(entry.document, catalog, entry.document.slug, trusted).ok)
      throw new Error("저장한 글의 형식이 맞지 않아요.");
  return parsed;
}
export const BROWSER_DRAFT_DB = "motivo-editorial-drafts";
export const BROWSER_DRAFT_KEY = "workspace-v1";
export class DraftConflictError extends Error {}
type StoredRecord = { revision: number; data: unknown; savedAt: number };
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BROWSER_DRAFT_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("브라우저 저장소를 다른 창에서 사용 중이에요."));
  });
}
export function createBrowserDraftStore() {
  let revision = 0;
  let queue: Promise<unknown> = Promise.resolve();
  return {
    async read(): Promise<StoredRecord | undefined> {
      const db = await openDatabase();
      try {
        const record = await new Promise<StoredRecord | undefined>((resolve, reject) => {
          const transaction = db.transaction("drafts", "readonly");
          const request = transaction.objectStore("drafts").get(BROWSER_DRAFT_KEY);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        if (
          record &&
          (!Number.isSafeInteger(record.revision) ||
            record.revision < 1 ||
            !Number.isFinite(record.savedAt))
        )
          throw new Error("저장본 정보를 확인할 수 없어요.");
        revision = record?.revision ?? 0;
        return record;
      } finally {
        db.close();
      }
    },
    save(data: BrowserWorkspace): Promise<number> {
      const save = async () => {
        const db = await openDatabase();
        try {
          return await new Promise<number>((resolve, reject) => {
            const transaction = db.transaction("drafts", "readwrite", { durability: "strict" });
            const store = transaction.objectStore("drafts");
            let conflict = false;
            let writeError: unknown = null;
            let nextRevision = revision;
            const savedAt = Date.now();
            const read = store.get(BROWSER_DRAFT_KEY);
            read.onsuccess = () => {
              try {
                const current = read.result as StoredRecord | undefined;
                if (current && JSON.stringify(current.data) === JSON.stringify(data)) {
                  nextRevision = current.revision;
                  return;
                }
                if ((current?.revision ?? 0) !== revision) {
                  conflict = true;
                  transaction.abort();
                  return;
                }
                nextRevision = revision + 1;
                store.put({ revision: nextRevision, savedAt, data }, BROWSER_DRAFT_KEY);
              } catch (error) {
                writeError = error;
                transaction.abort();
              }
            };
            transaction.oncomplete = () => {
              revision = nextRevision;
              resolve(savedAt);
            };
            transaction.onabort = () =>
              reject(
                conflict
                  ? new DraftConflictError("다른 탭에서 저장한 내용이 있어요.")
                  : (writeError ?? transaction.error ?? new Error("임시 저장에 실패했어요.")),
              );
            transaction.onerror = () => {};
          });
        } finally {
          db.close();
        }
      };
      const result = queue.then(save);
      queue = result.catch(() => {});
      return result;
    },
  };
}

// 목록 추적 도입 전 제공한 다섯 문서. 사용자가 삭제한 기존 샘플은 복구하지 않는다.
export const LEGACY_EDITORIAL_SEEDS = [
  "describe-the-result",
  "show-the-screen",
  "leave-a-handoff",
  "report-the-error",
  "check-the-source",
];

export function getNewEditorialSeeds(
  saved: BrowserWorkspace,
  documents: WorkbookReadingDocument[],
) {
  return documents.filter(
    (doc) =>
      !(saved.knownSeeds ?? LEGACY_EDITORIAL_SEEDS).includes(doc.slug) &&
      !saved.sessions.some((entry) => entry.document.slug === doc.slug),
  );
}

import { z } from "zod";

const image = z
  .string()
  .max(7 * 1024 * 1024)
  .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/)
  .nullable();
const pair = z.object({ before: image, after: image });
const mark = z
  .object({
    id: z.string().min(1).max(100),
    note: z.string().max(240),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().positive().max(1),
    height: z.number().positive().max(1),
  })
  .refine((area) => area.x + area.width <= 1.000001 && area.y + area.height <= 1.000001);
const annotations = z.object({ before: z.array(mark), after: z.array(mark) });
export const resultDraftSchema = z.object({
  screens: z.object({ project: pair, experience: pair }),
  annotations,
});
export type ResultDraft = z.infer<typeof resultDraftSchema>;
export class ResultDraftConflict extends Error {}
const DB = "motivo-workbook-results";
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("blocked"));
    request.onsuccess = () => resolve(request.result);
  });
}
const slots = ["project:before", "project:after", "experience:before", "experience:after"] as const;
function pictures(data: ResultDraft) {
  return [
    data.screens.project.before,
    data.screens.project.after,
    data.screens.experience.before,
    data.screens.experience.after,
  ];
}
export function createResultDraftStore(scope: string) {
  let revision = 0;
  let previous: ResultDraft | null = null;
  let queue: Promise<unknown> = Promise.resolve();
  return {
    async read(): Promise<ResultDraft | null> {
      const db = await open();
      try {
        const records = await new Promise<unknown[]>((resolve, reject) => {
          const tx = db.transaction("drafts", "readonly");
          const requests = [scope, ...slots.map((slot) => `${scope}:${slot}`)].map((key) =>
            tx.objectStore("drafts").get(key),
          );
          tx.oncomplete = () => resolve(requests.map((request) => request.result));
          tx.onabort = tx.onerror = () => reject(tx.error);
        });
        if (records[0] === undefined) return null;
        const meta = z
          .object({ version: z.literal(1), revision: z.number().int().positive(), annotations })
          .parse(records[0]);
        const data = resultDraftSchema.parse({
          annotations: meta.annotations,
          screens: {
            project: { before: records[1] ?? null, after: records[2] ?? null },
            experience: { before: records[3] ?? null, after: records[4] ?? null },
          },
        });
        revision = meta.revision;
        previous = data;
        return data;
      } finally {
        db.close();
      }
    },
    save(data: ResultDraft): Promise<void> {
      const save = async () => {
        if (
          previous &&
          pictures(data).every((value, index) => value === pictures(previous!)[index]) &&
          JSON.stringify(data.annotations) === JSON.stringify(previous.annotations)
        )
          return;
        const db = await open();
        try {
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction("drafts", "readwrite", { durability: "strict" });
            const store = tx.objectStore("drafts");
            let conflict = false;
            let writeError: unknown = null;
            const request = store.get(scope);
            request.onsuccess = () => {
              try {
                if ((request.result?.revision ?? 0) !== revision) {
                  conflict = true;
                  tx.abort();
                  return;
                }
                const next = pictures(data),
                  last = previous ? pictures(previous) : [];
                slots.forEach((slot, index) => {
                  if (next[index] !== last[index]) store.put(next[index], `${scope}:${slot}`);
                });
                store.put(
                  { version: 1, revision: revision + 1, annotations: data.annotations },
                  scope,
                );
              } catch (error) {
                writeError = error;
                tx.abort();
              }
            };
            tx.oncomplete = () => {
              revision++;
              previous = data;
              resolve();
            };
            tx.onabort = tx.onerror = () =>
              reject(
                conflict
                  ? new ResultDraftConflict()
                  : (writeError ?? tx.error ?? new Error("save")),
              );
          });
        } finally {
          db.close();
        }
      };
      const result = queue.then(save, save);
      queue = result.catch(() => {});
      return result;
    },
  };
}

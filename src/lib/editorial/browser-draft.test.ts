import { expect, it } from "vitest";
import { getWorkbookReadings } from "@/lib/content/workbook-readings";
import {
  canvasDraftSchema,
  getNewEditorialSeeds,
  parseBrowserWorkspace,
  type BrowserWorkspace,
} from "./browser-draft";
async function workspace() {
  const documents = await getWorkbookReadings();
  return {
    documents,
    value: {
      version: 1,
      slug: documents[0].slug,
      mobile: false,
      sessions: documents.map((document) => ({ document, raw: JSON.stringify(document, null, 2) })),
      canvas: null,
      dialog: null,
    } satisfies BrowserWorkspace,
  };
}
it("restores raw invalid JSON separately from the last valid document", async () => {
  const { documents, value } = await workspace();
  value.sessions[0].raw = "{unfinished";
  expect(parseBrowserWorkspace(value, documents).sessions[0].raw).toBe("{unfinished");
  expect(parseBrowserWorkspace(value, documents).sessions[0].document).toEqual(documents[0]);
  expect(() => parseBrowserWorkspace({ ...value, version: 2 }, documents)).toThrow();
  expect(() => parseBrowserWorkspace({ ...value, slug: "missing" }, documents)).toThrow();
});
it("preserves incomplete structured fields but rejects corrupted block shapes and executable images", async () => {
  const { documents, value } = await workspace();
  const block = documents[0].content.find((block) => block.type === "compare")!;
  const draft = {
    ...block,
    items: block.items.map((item, index) => (index === 0 ? { ...item, label: "" } : item)),
  };
  const canvas = {
    version: 1,
    texts: [],
    blocks: [[`${documents[0].slug}:${draft.id}`, draft]],
    covers: [],
    photos: [],
    selection: { slug: documents[0].slug, id: draft.id },
    editing: { slug: documents[0].slug, id: draft.id },
    text: null,
    contentEdit: { slug: documents[0].slug, id: draft.id, block: draft },
    coverPhoto: null,
    conversion: null,
  };
  const parsed = canvasDraftSchema.parse(canvas);
  expect(parsed.blocks[0][1]).toEqual(draft);
  expect(parseBrowserWorkspace({ ...value, canvas }, documents).canvas?.contentEdit?.block).toEqual(
    draft,
  );
  expect(
    canvasDraftSchema.safeParse({
      ...canvas,
      contentEdit: { ...canvas.contentEdit, block: { ...draft, items: 7 } },
    }).success,
  ).toBe(false);
  expect(
    canvasDraftSchema.safeParse({
      ...canvas,
      photos: [
        {
          src: "data:image/svg+xml;base64,PHN2Zz4=",
          title: "unsafe",
          alt: "test",
          caption: "test",
        },
      ],
    }).success,
  ).toBe(false);
});
it("rejects changed document identities, broken references and unknown photo files", async () => {
  const { documents, value } = await workspace();
  expect(() =>
    parseBrowserWorkspace(
      { ...value, sessions: [...value.sessions, value.sessions[0]] },
      documents,
    ),
  ).toThrow();
  expect(() =>
    parseBrowserWorkspace(
      {
        ...value,
        sessions: [
          {
            document: { ...documents[0], thumbnail: "/images/workbook/notes/missing.png" },
            raw: "",
          },
        ],
      },
      documents,
    ),
  ).toThrow();
  expect(() =>
    parseBrowserWorkspace(
      {
        ...value,
        sessions: [
          {
            document: { ...documents[0], related: [{ slug: "missing", reason: "test" }] },
            raw: "",
          },
        ],
      },
      documents,
    ),
  ).toThrow();
  expect(
    parseBrowserWorkspace(
      {
        ...value,
        dialog: {
          mode: "new",
          draft: { ...documents[0], title: "", slug: "", displayTitle: ["", "", "", ""] },
          loaded: true,
        },
      },
      documents,
    ).dialog?.draft.title,
  ).toBe("");
});

it("preserves an empty workspace after deleting every draft", async () => {
  const { documents, value } = await workspace();
  const empty = { ...value, sessions: [], canvas: null, dialog: null };
  expect(parseBrowserWorkspace(empty, documents).sessions).toEqual([]);
});

it("adds newly provided samples without reviving previously deleted drafts", async () => {
  const { documents, value } = await workspace();
  const legacy = { ...value, sessions: [] };
  expect(getNewEditorialSeeds(legacy, documents).map((doc) => doc.slug)).toEqual([
    "test-the-awkward-cases",
  ]);
  expect(
    getNewEditorialSeeds({ ...legacy, knownSeeds: documents.map((doc) => doc.slug) }, documents),
  ).toEqual([]);
});

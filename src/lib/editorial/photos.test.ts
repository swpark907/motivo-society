import { expect, it } from "vitest";
import { getWorkbookReadings } from "@/lib/content/workbook-readings";
import { getEditorialPhoto, getEditorialPhotos, applyEditorialPhoto } from "./photos";
import { validateEditorialDraft } from "./editor-state";
it("deduplicates supplied photos and changes cover metadata without changing layout or body", async () => {
  const documents = await getWorkbookReadings();
  const photos = getEditorialPhotos(documents);
  expect(new Set(photos.map((photo) => photo.src)).size).toBe(photos.length);
  const original = structuredClone(documents[0]);
  const photo = { src: documents[1].thumbnail, alt: "새 표지 설명", caption: "새 표지 캡션" };
  const changed = applyEditorialPhoto(documents[0], "@cover", photo);
  expect(getEditorialPhoto(changed, "@cover")).toEqual(photo);
  expect(changed.content).toEqual(original.content);
  expect(changed.cover).toEqual(original.cover);
  expect(changed.title).toBe(original.title);
  expect(documents[0]).toEqual(original);
  expect(validateEditorialDraft(changed, documents, changed.slug).ok).toBe(true);
});
it("changes a split photo while preserving its text, identity, crop and placement and rejects unavailable assets", async () => {
  const documents = await getWorkbookReadings();
  const original = documents[1];
  const split = original.content.find((block) => block.type === "split")!;
  const photo = { src: documents[0].thumbnail, alt: "다른 사진", caption: "연출 사진" };
  const changed = applyEditorialPhoto(original, split.id, photo);
  const after = changed.content.find((block) => block.id === split.id)!;
  expect(after).toEqual({ ...split, image: { ...split.image, ...photo } });
  expect(getEditorialPhoto(original, original.content[0].id)).toBeNull();
  expect(() => applyEditorialPhoto(original, "missing", photo)).toThrow("사진 구간");
  expect(validateEditorialDraft(changed, documents, original.slug).ok).toBe(true);
  const invalid = applyEditorialPhoto(original, split.id, {
    ...photo,
    src: "/images/workbook/notes/not-provided.png",
  });
  expect(validateEditorialDraft(invalid, documents, original.slug).ok).toBe(false);
});

it("rejects executable, external, malformed and oversized embedded image sources", async () => {
  const documents = await getWorkbookReadings();
  const invalid = [
    "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
    "https://example.com/photo.jpg",
    "blob:http://localhost/photo",
    "data:image/jpeg;base64,/9j/AAAA",
    "data:image/jpeg;base64,/9j/" + "A".repeat(900_000),
  ];
  for (const src of invalid)
    expect(
      validateEditorialDraft({ ...documents[0], thumbnail: src }, documents, documents[0].slug).ok,
    ).toBe(false);
});

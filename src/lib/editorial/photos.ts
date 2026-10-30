import type { WorkbookReadingDocument } from "@/lib/content/workbook-editorial-schema";
import { findEditorialBlock } from "./selection";
export type PhotoSelection = { src: string; alt: string; caption: string };
export type EditorialPhoto = PhotoSelection & { title: string };
export function getEditorialPhotos(documents: WorkbookReadingDocument[]): EditorialPhoto[] {
  const photos = new Map<string, EditorialPhoto>();
  for (const document of documents) {
    if (!photos.has(document.thumbnail))
      photos.set(document.thumbnail, {
        src: document.thumbnail,
        alt: document.thumbnailAlt,
        caption: document.visualCaption,
        title: document.title,
      });
    for (const block of document.content)
      if ((block.type === "image" || block.type === "split") && !photos.has(block.image.src))
        photos.set(block.image.src, { ...block.image, title: document.title });
  }
  return [...photos.values()];
}
export function getEditorialPhoto(
  document: WorkbookReadingDocument,
  id: string,
): PhotoSelection | null {
  if (id === "@cover")
    return { src: document.thumbnail, alt: document.thumbnailAlt, caption: document.visualCaption };
  const block = findEditorialBlock(document, id);
  return block && (block.type === "image" || block.type === "split")
    ? { src: block.image.src, alt: block.image.alt, caption: block.image.caption }
    : null;
}
export function applyEditorialPhoto(
  document: WorkbookReadingDocument,
  id: string,
  photo: PhotoSelection,
): WorkbookReadingDocument {
  const copy = structuredClone(document);
  if (id === "@cover")
    return { ...copy, thumbnail: photo.src, thumbnailAlt: photo.alt, visualCaption: photo.caption };
  const block = findEditorialBlock(copy, id);
  if (!block || (block.type !== "image" && block.type !== "split"))
    throw new Error("사진 구간을 선택해주세요.");
  block.image = { ...block.image, ...photo };
  return copy;
}

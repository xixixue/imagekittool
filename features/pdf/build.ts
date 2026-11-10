import { PDFDocument } from "pdf-lib";

/**
 * Image → PDF (SPEC V2 §4.2 P0). Generates a PDF entirely in the browser with
 * pdf-lib: one image per page, sized to a chosen page size with margins and
 * orientation. The images are never uploaded.
 *
 * `computePageLayout` is the pure layout logic (page size, orientation,
 * contain-fit, centering) and is unit-tested; `buildPdfFromImages` is the thin
 * pdf-lib wrapper.
 */

export type PageSize = "a4" | "letter";
export type Orientation = "auto" | "portrait" | "landscape";
export type MarginPreset = "none" | "small" | "medium" | "large";

export interface ImageToPdfOptions {
  pageSize: PageSize;
  orientation: Orientation;
  margin: MarginPreset;
}

export interface PdfImageInput {
  bytes: Uint8Array;
  format: "jpeg" | "png";
}

export interface PageLayout {
  pageW: number;
  pageH: number;
  drawW: number;
  drawH: number;
  x: number;
  y: number;
}

// Page sizes in PDF points (1pt = 1/72 inch).
const PAGE_SIZES: Record<PageSize, readonly [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

const MARGINS: Record<MarginPreset, number> = {
  none: 0,
  small: 18, // 0.25 in
  medium: 36, // 0.5 in
  large: 72, // 1 in
};

/** Contain-fit an image into a box, preserving aspect ratio. */
function containScale(imgW: number, imgH: number, maxW: number, maxH: number): number {
  return Math.min(maxW / imgW, maxH / imgH);
}

/**
 * Compute the page size + draw rectangle for one image given the options.
 * Pure — no DOM, no pdf-lib — so it is fully unit-testable.
 */
export function computePageLayout(imgW: number, imgH: number, opts: ImageToPdfOptions): PageLayout {
  const [pw, ph] = PAGE_SIZES[opts.pageSize];
  const margin = MARGINS[opts.margin];
  let pageW = pw;
  let pageH = ph;
  const imgLandscape = imgW >= imgH;
  if (opts.orientation === "landscape" || (opts.orientation === "auto" && imgLandscape)) {
    pageW = ph;
    pageH = pw;
  }
  const maxW = pageW - 2 * margin;
  const maxH = pageH - 2 * margin;
  const scale = containScale(imgW, imgH, maxW, maxH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  return {
    pageW,
    pageH,
    drawW,
    drawH,
    x: (pageW - drawW) / 2,
    y: (pageH - drawH) / 2,
  };
}

/**
 * Build a PDF from the given images, one per page. Each image is embedded as
 * JPG or PNG and drawn contain-fit within the page minus margins.
 */
export async function buildPdfFromImages(
  images: PdfImageInput[],
  opts: ImageToPdfOptions,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const img of images) {
    const embedded =
      img.format === "jpeg"
        ? await doc.embedJpg(img.bytes)
        : await doc.embedPng(img.bytes);
    const layout = computePageLayout(embedded.width, embedded.height, opts);
    const page = doc.addPage([layout.pageW, layout.pageH]);
    page.drawImage(embedded, {
      x: layout.x,
      y: layout.y,
      width: layout.drawW,
      height: layout.drawH,
    });
  }
  return doc.save();
}

export const PDF_PAGE_SIZES = PAGE_SIZES;

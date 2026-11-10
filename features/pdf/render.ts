import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { canvasToBlob, fillBackgroundForFormat } from "@/features/image-processing/canvas";
import type { ImageFormat } from "@/features/image-processing/types";

/**
 * PDF → image renderer (SPEC V2 §4.2 P0). Renders PDF pages to PNG or JPG
 * entirely in the browser with pdf.js — no upload. The worker is loaded locally
 * (no CDN) so the file never leaves the device.
 *
 * This module is imported dynamically by the client so the large pdfjs-dist
 * bundle stays in its own chunk, loaded only when the tool renders pages.
 */

export interface RenderOptions {
  format: "png" | "jpeg";
  /** Render resolution. PDF native size is 72 DPI; 150/300 give sharper output. */
  dpi: number;
  /** JPEG quality 0..1 (ignored for PNG). */
  quality?: number;
}

export interface RenderedPage {
  pageNumber: number;
  blob: Blob;
  width: number;
  height: number;
}

let workerReady = false;
function configureWorker(): void {
  if (workerReady) return;
  // Local worker via webpack's URL asset reference (self-contained, no CDN).
  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).href;
  workerReady = true;
}

/**
 * Render the given 1-based page numbers of a PDF to image blobs.
 * `data` is the raw PDF bytes. Throws if pdf.js cannot read the document.
 */
export async function renderPdfPages(
  data: Uint8Array,
  pages: number[],
  opts: RenderOptions,
): Promise<RenderedPage[]> {
  configureWorker();
  const loadingTask = getDocument({ data: data as unknown as ArrayBuffer });
  const doc = await loadingTask.promise;
  const scale = opts.dpi / 72;
  const format = opts.format as ImageFormat;
  const results: RenderedPage[] = [];
  try {
    for (const n of pages) {
      const page = await doc.getPage(n);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get a 2D canvas context.");
      // JPEG has no alpha — fill white so transparent PDF areas don't turn black.
      fillBackgroundForFormat(ctx, canvas.width, canvas.height, format);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      const blob = await canvasToBlob(canvas, format, opts.quality);
      results.push({ pageNumber: n, blob, width: canvas.width, height: canvas.height });
      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }
  return results;
}

/** Count the pages in a PDF without rendering. */
export async function countPdfPages(data: Uint8Array): Promise<number> {
  configureWorker();
  const loadingTask = getDocument({ data: data as unknown as ArrayBuffer });
  const doc = await loadingTask.promise;
  const total = doc.numPages;
  await loadingTask.destroy();
  return total;
}

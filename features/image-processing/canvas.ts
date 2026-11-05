import { buildOutputFilename, formatToExt, formatToMime } from "./format";
import type { DecodedImage, ImageFormat, ProcessResult } from "./types";

/**
 * Canvas helpers. Phase 1 uses DOM HTMLCanvasElement for maximum compatibility
 * (Chrome/Edge/Firefox/Safari). OffscreenCanvas support is detected and reserved
 * for a future optimization (SPEC §5: "按需使用 OffscreenCanvas").
 */
export function supportsOffscreenCanvas(): boolean {
  return typeof OffscreenCanvas !== "undefined";
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function get2DContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get a 2D canvas context.");
  return ctx;
}

/**
 * Draw a bitmap into a fresh canvas at the given size. When `background` is set,
 * it is painted first — used to fill transparency for formats without alpha.
 */
export function drawBitmap(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  background?: string,
): HTMLCanvasElement {
  const canvas = createCanvas(width, height);
  const ctx = get2DContext(canvas);
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

/** Clamp quality to a safe 0.05..0.95 range. */
export function clampQuality(quality: number): number {
  if (!Number.isFinite(quality)) return 0.9;
  return Math.min(0.95, Math.max(0.05, quality));
}

/** Encode a canvas to a Blob. PNG ignores quality (lossless). */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality?: number,
): Promise<Blob> {
  const mime = formatToMime(format);
  const q = format === "png" ? undefined : quality;
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, q));
  if (!blob) throw new Error("Failed to encode the image.");
  return blob;
}

/** Build a ProcessResult from the encoded blob and final dimensions. */
export function makeProcessResult(
  blob: Blob,
  image: DecodedImage,
  format: ImageFormat,
  width: number,
  height: number,
): ProcessResult {
  return {
    blob,
    format,
    mimeType: formatToMime(format),
    extension: formatToExt(format),
    filename: buildOutputFilename(image.name, format),
    width,
    height,
    sizeBytes: blob.size,
  };
}

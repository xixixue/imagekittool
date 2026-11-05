import { canvasToBlob, clampQuality, createCanvas, get2DContext, makeProcessResult } from "./canvas";
import type { DecodedImage, ProcessResult, RotateOptions } from "./types";

/** Output dimensions after a 90°-step rotation (width/height swap for 90/270). */
export function rotatedSize(
  width: number,
  height: number,
  angle: 0 | 90 | 180 | 270,
): { width: number; height: number } {
  return angle === 90 || angle === 270
    ? { width: height, height: width }
    : { width, height };
}

/**
 * Draw a 90°-step rotation (with optional flips) of `bitmap` into `ctx`, which
 * must back a canvas already sized to the rotated output dimensions. Drawing is
 * resolution-independent (the bitmap is scaled to fit the canvas), so the same
 * function powers both the full-size export and the scaled live preview.
 */
export function composeRotate(
  ctx: CanvasRenderingContext2D,
  bitmap: CanvasImageSource,
  outW: number,
  outH: number,
  opts: RotateOptions,
): void {
  const angle = opts.angle;
  // Unrotated image footprint that exactly fills the rotated canvas.
  const logicalW = angle === 90 || angle === 270 ? outH : outW;
  const logicalH = angle === 90 || angle === 270 ? outW : outH;
  ctx.save();
  ctx.translate(outW / 2, outH / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.scale(opts.flipH ? -1 : 1, opts.flipV ? -1 : 1);
  ctx.drawImage(bitmap, -logicalW / 2, -logicalH / 2, logicalW, logicalH);
  ctx.restore();
}

/**
 * Rotate an image by 90° steps with optional horizontal/vertical mirroring.
 * Output format defaults to the source format; JPEG fills transparency white.
 */
export async function rotateImage(
  image: DecodedImage,
  opts: RotateOptions,
): Promise<ProcessResult> {
  const format = opts.format ?? image.format;
  const { width, height } = rotatedSize(image.width, image.height, opts.angle);
  const canvas = createCanvas(width, height);
  const ctx = get2DContext(canvas);
  composeRotate(ctx, image.bitmap, width, height, opts);
  const blob = await canvasToBlob(canvas, format, format === "png" ? undefined : clampQuality(0.92));
  return makeProcessResult(blob, image, format, width, height);
}

import { canvasToBlob, clampQuality, drawBitmapToFormat, makeProcessResult } from "./canvas";
import { computeResizeDimensions } from "./dimensions";
import type { DecodedImage, ProcessResult, ResizeOptions } from "./types";

/**
 * Resize an image (SPEC §4.2). Dimensions are computed with pure math
 * (dimensions.ts); the bitmap is then drawn at the target size.
 */
export async function resizeImage(
  image: DecodedImage,
  opts: ResizeOptions,
): Promise<ProcessResult> {
  const { width, height } = computeResizeDimensions({
    srcWidth: image.width,
    srcHeight: image.height,
    targetWidth: opts.targetWidth,
    targetHeight: opts.targetHeight,
    lockAspect: opts.lockAspect,
    percent: opts.percent,
  });
  const format = opts.format ?? image.format;
  const canvas = drawBitmapToFormat(image.bitmap, width, height, format);
  const quality = format === "png" ? undefined : clampQuality(0.92);
  const blob = await canvasToBlob(canvas, format, quality);
  return makeProcessResult(blob, image, format, width, height);
}

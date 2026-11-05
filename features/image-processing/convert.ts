import { canvasToBlob, clampQuality, drawBitmap, makeProcessResult } from "./canvas";
import type { ConvertOptions, DecodedImage, ProcessResult } from "./types";

/**
 * Convert an image between JPG, PNG, and WebP (SPEC §4.3).
 * JPEG has no alpha channel: when the target is JPEG, transparency is filled
 * with the chosen background (default white). The output extension always
 * matches the real MIME type (handled by buildOutputFilename).
 */
export async function convertImage(
  image: DecodedImage,
  opts: ConvertOptions,
): Promise<ProcessResult> {
  const format = opts.format;
  const background = format === "jpeg" ? (opts.background ?? "#ffffff") : undefined;
  const canvas = drawBitmap(image.bitmap, image.width, image.height, background);
  const quality = format === "png" ? undefined : clampQuality(0.92);
  const blob = await canvasToBlob(canvas, format, quality);
  return makeProcessResult(blob, image, format, image.width, image.height);
}

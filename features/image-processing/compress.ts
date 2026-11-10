import { canvasToBlob, clampQuality, drawBitmapToFormat, makeProcessResult } from "./canvas";
import type { CompressOptions, DecodedImage, ProcessResult } from "./types";

/**
 * Compress an image (SPEC §4.1).
 * - JPEG/WebP: encode at the supplied quality.
 * - PNG: re-encode losslessly (canvas PNG, metadata stripped). Quality is ignored.
 *   PNG is never silently converted to a lossy format.
 * Output format defaults to the source format unless overridden.
 */
export async function compressImage(
  image: DecodedImage,
  opts: CompressOptions,
): Promise<ProcessResult> {
  const format = opts.format ?? image.format;
  const canvas = drawBitmapToFormat(image.bitmap, image.width, image.height, format);
  const quality = format === "png" ? undefined : clampQuality(opts.quality);
  const blob = await canvasToBlob(canvas, format, quality);
  return makeProcessResult(blob, image, format, image.width, image.height);
}

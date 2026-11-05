import { canvasToBlob, clampQuality, drawBitmap, makeProcessResult } from "./canvas";
import { findQualityForTargetSize } from "./search";
import type { CompressToKbOptions, CompressToKbResult, DecodedImage, ImageFormat } from "./types";

const DEFAULT_MAX_ITERATIONS = 12;
const DEFAULT_TIME_BUDGET_MS = 4000;

/** Bounded quality search for a single (lossy) format. */
async function searchFormat(
  image: DecodedImage,
  format: ImageFormat,
  opts: CompressToKbOptions,
): Promise<{ blob: Blob; met: boolean; iterations: number }> {
  const canvas = drawBitmap(image.bitmap, image.width, image.height);
  const encode = async (quality: number) => {
    const blob = await canvasToBlob(canvas, format, quality);
    return { bytes: blob.size };
  };
  const result = await findQualityForTargetSize(encode, {
    targetBytes: opts.targetBytes,
    maxIterations: opts.maxIterations ?? DEFAULT_MAX_ITERATIONS,
    timeBudgetMs: opts.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS,
  });
  const blob = await canvasToBlob(canvas, format, clampQuality(result.quality));
  return { blob, met: result.met, iterations: result.iterations };
}

/**
 * Compress an image toward a target byte size (SPEC §4.5 — the differentiated tool).
 *
 * - JPEG/WebP: bounded binary search over quality (capped iterations + time budget).
 * - PNG: lossless and cannot be quality-searched. By default it is re-encoded as
 *   WebP (lossy) to attempt the target, with an explicit warning that transparency
 *   may be lost. If `allowFormatChange` is false, PNG is re-encoded losslessly and
 *   the result reports honestly whether the target was met.
 *
 * Never loops forever. When the target cannot be met, returns the closest result.
 */
export async function compressImageToKb(
  image: DecodedImage,
  opts: CompressToKbOptions,
): Promise<CompressToKbResult> {
  const target = opts.targetBytes;

  if (image.format === "png") {
    if (opts.allowFormatChange !== false) {
      const { blob, met, iterations } = await searchFormat(image, "webp", opts);
      const base = makeProcessResult(blob, image, "webp", image.width, image.height);
      return {
        ...base,
        metTarget: met,
        iterations,
        note: met
          ? "Reached the target by converting PNG → WebP (lossy). Transparency may be lost."
          : "Could not reach the target even as WebP. Closest result returned; transparency may be lost.",
      };
    }
    const canvas = drawBitmap(image.bitmap, image.width, image.height);
    const blob = await canvasToBlob(canvas, "png");
    const base = makeProcessResult(blob, image, "png", image.width, image.height);
    const met = blob.size <= target;
    return {
      ...base,
      metTarget: met,
      iterations: 1,
      note: met
        ? undefined
        : "PNG is lossless. The target cannot be reached without converting to a lossy format.",
    };
  }

  const { blob, met, iterations } = await searchFormat(image, image.format, opts);
  const base = makeProcessResult(blob, image, image.format, image.width, image.height);
  return {
    ...base,
    metTarget: met,
    iterations,
    note: met ? undefined : "Could not reach the target size. The closest result is returned.",
  };
}

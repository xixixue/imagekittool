/**
 * Social Media Resizer render (SPEC V2 §7, Phase 4).
 *
 * Composes the existing image-processing canvas primitives — decode, fill bg,
 * drawImage, canvasToBlob — around the pure computeFit geometry. No resize/crop
 * algorithm is duplicated (§5/§7); this is composition only.
 */
import {
  buildOutputFilename,
  canvasToBlob,
  createCanvas,
  decodeToImage,
  detectFormat,
  fillBackgroundForFormat,
  formatToExt,
  formatToMime,
  get2DContext,
  releaseImage,
  type ImageFormat,
  type ProcessResult,
} from "@/features/image-processing";
import { computeFit, type FitMode } from "./fit";

export interface ResizeToTargetOptions {
  targetWidth: number;
  targetHeight: number;
  mode: FitMode;
  format: ImageFormat;
  /** Background color for letterboxed areas (contain mode, non-alpha formats). */
  background?: string;
}

/** Render one image to an exact target box with the given fit mode. */
export async function resizeToTarget(
  file: File,
  opts: ResizeToTargetOptions,
): Promise<ProcessResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const srcFormat: ImageFormat = detectFormat(bytes) ?? "jpeg";
  const image = await decodeToImage(file, srcFormat);
  try {
    const fit = computeFit(
      image.width,
      image.height,
      opts.targetWidth,
      opts.targetHeight,
      opts.mode,
    );
    const canvas = createCanvas(opts.targetWidth, opts.targetHeight);
    const ctx = get2DContext(canvas);
    fillBackgroundForFormat(ctx, opts.targetWidth, opts.targetHeight, opts.format, opts.background);
    ctx.drawImage(image.bitmap, fit.drawX, fit.drawY, fit.drawW, fit.drawH);
    const quality = opts.format === "png" ? undefined : 0.92;
    const blob = await canvasToBlob(canvas, opts.format, quality);
    return {
      blob,
      filename: buildOutputFilename(image.name, opts.format),
      mimeType: formatToMime(opts.format),
      extension: formatToExt(opts.format),
      format: opts.format,
      width: opts.targetWidth,
      height: opts.targetHeight,
      sizeBytes: blob.size,
    };
  } finally {
    releaseImage(image);
  }
}

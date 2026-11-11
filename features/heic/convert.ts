/**
 * HEIC → raster image conversion (SPEC V2 Phase 5, §8.3 "Convert HEIC to JPG").
 *
 * heic2any decodes HEIC/HEIF → a raster blob in the browser (WASM, dynamic
 * import → separate chunk, not in page First Load). We decode to a lossless PNG
 * intermediate, then re-encode to the requested format via the existing canvas
 * helpers — so JPG, PNG, and WebP are all supported, and no encode algorithm is
 * duplicated (§5 reuse rule).
 *
 * Dependency (rule 6): heic2any 0.0.4, MIT, ~1.3MB (libheif WASM), dynamically
 * imported. Maintenance: the de-facto browser HEIC decoder; releases are
 * infrequent. Accepted for the HEIC tool because there is no lighter
 * cross-browser alternative (@jsquash/heic does not exist on npm).
 */
import {
  buildOutputFilename,
  canvasToBlob,
  createCanvas,
  formatToExt,
  formatToMime,
  get2DContext,
  type ImageFormat,
  type ProcessResult,
} from "@/features/image-processing";

/** PNG is lossless, so quality is ignored; JPG/WebP use the given quality. */
export function qualityForFormat(
  format: ImageFormat,
  quality: number,
): number | undefined {
  return format === "png" ? undefined : quality;
}

export interface ConvertHeicOptions {
  format: ImageFormat;
  quality: number;
}

/** Convert one HEIC/HEIF file to JPG, PNG, or WebP. Runs entirely in-browser. */
export async function convertHeic(
  file: File,
  opts: ConvertHeicOptions,
): Promise<ProcessResult> {
  const { default: heic2any } = await import("heic2any");
  // Decode HEIC → lossless PNG intermediate (heic2any does not output WebP).
  const out = await heic2any({ blob: file, toType: "image/png" });
  const pngBlob = Array.isArray(out) ? out[0] : out;
  // PNG → bitmap → canvas → target format (reuses canvas primitives).
  const bmp = await createImageBitmap(pngBlob);
  const width = bmp.width;
  const height = bmp.height;
  const canvas = createCanvas(width, height);
  const ctx = get2DContext(canvas);
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  const blob = await canvasToBlob(canvas, opts.format, qualityForFormat(opts.format, opts.quality));
  return {
    blob,
    filename: buildOutputFilename(file.name, opts.format),
    mimeType: formatToMime(opts.format),
    extension: formatToExt(opts.format),
    format: opts.format,
    width,
    height,
    sizeBytes: blob.size,
  };
}

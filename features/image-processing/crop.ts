import {
  canvasToBlob,
  clampQuality,
  createCanvas,
  fillBackgroundForFormat,
  get2DContext,
  makeProcessResult,
} from "./canvas";
import { clampCropRect } from "./dimensions";
import type { CropOptions, DecodedImage, ProcessResult } from "./types";

/** Bounding box of an image rotated by `rotation` degrees. */
function rotatedBoundingBox(
  width: number,
  height: number,
  rotation: number,
): { width: number; height: number } {
  const rot = ((rotation % 360) + 360) % 360;
  if (rot === 0 || rot === 180) return { width, height };
  if (rot === 90 || rot === 270) return { width: height, height: width };
  const rad = (rotation * Math.PI) / 180;
  return {
    width: Math.round(Math.abs(Math.sin(rad)) * height + Math.abs(Math.cos(rad)) * width),
    height: Math.round(Math.abs(Math.sin(rad)) * width + Math.abs(Math.cos(rad)) * height),
  };
}

/**
 * Crop an image with optional 90°-step rotation (SPEC §4.4).
 * `cropRect` is expressed in the rotated image's pixel space, matching the
 * `croppedAreaPixels` value produced by react-easy-crop.
 */
export async function cropImage(image: DecodedImage, opts: CropOptions): Promise<ProcessResult> {
  const format = opts.format ?? image.format;
  const rotation = opts.rotation;

  // Build the rotated working canvas (bounding box; source drawn centered).
  const box = rotatedBoundingBox(image.width, image.height, rotation);
  const work = createCanvas(box.width, box.height);
  const wctx = get2DContext(work);
  wctx.translate(box.width / 2, box.height / 2);
  wctx.rotate((rotation * Math.PI) / 180);
  wctx.translate(-image.width / 2, -image.height / 2);
  wctx.drawImage(image.bitmap, 0, 0);

  const rect = clampCropRect(
    { x: opts.cropX, y: opts.cropY, width: opts.cropWidth, height: opts.cropHeight },
    box.width,
    box.height,
  );

  const out = createCanvas(rect.width, rect.height);
  const octx = get2DContext(out);
  fillBackgroundForFormat(octx, rect.width, rect.height, format);
  octx.drawImage(work, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);

  const quality = format === "png" ? undefined : clampQuality(0.92);
  const blob = await canvasToBlob(out, format, quality);
  return makeProcessResult(blob, image, format, rect.width, rect.height);
}

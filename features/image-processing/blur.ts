import { canvasToBlob, clampQuality, createCanvas, fillBackgroundForFormat, get2DContext, makeProcessResult } from "./canvas";
import { clampCropRect } from "./dimensions";
import type { BlurOptions, BlurRegion, DecodedImage, ProcessResult } from "./types";

/** Clamp every blur region to image bounds with a 1px minimum size. */
export function clampRegions(
  regions: BlurRegion[],
  width: number,
  height: number,
): BlurRegion[] {
  return regions.map((r) => clampCropRect(r, width, height));
}

function blurRegion(
  ctx: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  region: BlurRegion,
  opts: BlurOptions,
): void {
  if (opts.mosaic > 0) {
    // Pixelate: downscale the region into a tiny canvas, then upscale with
    // smoothing disabled so each source tile becomes one blocky pixel.
    const tw = Math.max(1, Math.round(region.width / opts.mosaic));
    const th = Math.max(1, Math.round(region.height / opts.mosaic));
    const tmp = createCanvas(tw, th);
    const tctx = get2DContext(tmp);
    tctx.imageSmoothingEnabled = true;
    tctx.drawImage(bitmap, region.x, region.y, region.width, region.height, 0, 0, tw, th);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, tw, th, region.x, region.y, region.width, region.height);
    ctx.restore();
  } else {
    // Gaussian blur via a CSS filter on a region-sized temp canvas.
    const tmp = createCanvas(region.width, region.height);
    const tctx = get2DContext(tmp);
    tctx.drawImage(bitmap, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
    ctx.save();
    ctx.filter = `blur(${Math.max(1, opts.radius)}px)`;
    ctx.drawImage(tmp, 0, 0, region.width, region.height, region.x, region.y, region.width, region.height);
    ctx.restore();
  }
}

/**
 * Draw the image with every region blurred/mosaiced. Shared by the live preview
 * and the export path. Selection rectangles are drawn by the UI on top.
 */
export function composeBlurred(
  ctx: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  width: number,
  height: number,
  opts: BlurOptions,
): void {
  ctx.drawImage(bitmap, 0, 0, width, height);
  const regions = clampRegions(opts.regions, width, height);
  for (const r of regions) blurRegion(ctx, bitmap, r, opts);
}

/** Render the blurred image and encode the result. Output format defaults to source. */
export async function blurImage(image: DecodedImage, opts: BlurOptions): Promise<ProcessResult> {
  const format = opts.format ?? image.format;
  const width = image.width;
  const height = image.height;
  const canvas = createCanvas(width, height);
  const ctx = get2DContext(canvas);
  fillBackgroundForFormat(ctx, width, height, format);
  composeBlurred(ctx, image.bitmap, width, height, opts);
  const blob = await canvasToBlob(canvas, format, format === "png" ? undefined : clampQuality(0.92));
  return makeProcessResult(blob, image, format, width, height);
}

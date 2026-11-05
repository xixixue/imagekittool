import { canvasToBlob, clampQuality, createCanvas, get2DContext, makeProcessResult } from "./canvas";
import type { DecodedImage, ProcessResult, WatermarkAnchor, WatermarkOptions } from "./types";

/** Nine-grid anchors in visual reading order (used by the position picker UI). */
export const WATERMARK_ANCHORS: WatermarkAnchor[] = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "middle-center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

/** Horizontal text alignment for an anchor. */
export function anchorAlign(anchor: WatermarkAnchor): CanvasTextAlign {
  const h = anchor.split("-")[1];
  return h === "left" ? "left" : h === "right" ? "right" : "center";
}

/** Vertical text baseline for an anchor. */
export function anchorBaseline(anchor: WatermarkAnchor): CanvasTextBaseline {
  const v = anchor.split("-")[0];
  return v === "top" ? "top" : v === "bottom" ? "bottom" : "middle";
}

/** Pixel anchor point for an anchor (with margin). */
export function anchorOffset(
  anchor: WatermarkAnchor,
  width: number,
  height: number,
  margin: number,
): { x: number; y: number } {
  const [v, h] = anchor.split("-");
  const x = h === "left" ? margin : h === "right" ? width - margin : width / 2;
  const y = v === "top" ? margin : v === "bottom" ? height - margin : height / 2;
  return { x, y };
}

/**
 * Diagonal grid of points covering the canvas, used when the watermark repeats.
 * Every other row is offset by half a step for an even diagonal distribution.
 */
export function tilePoints(
  width: number,
  height: number,
  margin: number,
  step: number,
): { x: number; y: number }[] {
  const safeStep = Math.max(16, step);
  const points: { x: number; y: number }[] = [];
  let row = 0;
  for (let y = margin; y <= height - margin; y += safeStep) {
    const offset = row % 2 === 1 ? safeStep / 2 : 0;
    for (let x = margin + offset; x <= width - margin; x += safeStep) {
      points.push({ x, y });
    }
    row++;
  }
  return points;
}

function clampAlpha(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

function drawRotatedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  angle: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/**
 * Draw the watermarked image into `ctx` (canvas already sized w×h). Resolution-
 * independent: callers scale `fontSize`/`margin` with the canvas for a faithful
 * preview. Used by both the export and the live preview.
 */
export function composeWatermark(
  ctx: CanvasRenderingContext2D,
  bitmap: CanvasImageSource,
  width: number,
  height: number,
  opts: WatermarkOptions,
): void {
  ctx.drawImage(bitmap, 0, 0, width, height);

  const text = opts.text.trim();
  if (!text) return;
  ctx.font = `bold ${opts.fontSize}px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = opts.color;
  ctx.globalAlpha = clampAlpha(opts.opacity);
  if (opts.repeat) {
    const step = Math.max(opts.fontSize * 4, 80);
    const points = tilePoints(width, height, opts.margin, step);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const p of points) drawRotatedText(ctx, text, p.x, p.y, opts.angle);
  } else {
    const off = anchorOffset(opts.position, width, height, opts.margin);
    ctx.textAlign = anchorAlign(opts.position);
    ctx.textBaseline = anchorBaseline(opts.position);
    drawRotatedText(ctx, text, off.x, off.y, opts.angle);
  }
  ctx.globalAlpha = 1;
}

/**
 * Add a text watermark. Supports a single 9-grid position or a repeating
 * diagonal tile. Output format defaults to the source format.
 */
export async function watermarkImage(
  image: DecodedImage,
  opts: WatermarkOptions,
): Promise<ProcessResult> {
  const format = opts.format ?? image.format;
  const width = image.width;
  const height = image.height;
  const canvas = createCanvas(width, height);
  const ctx = get2DContext(canvas);
  composeWatermark(ctx, image.bitmap, width, height, opts);
  const blob = await canvasToBlob(canvas, format, format === "png" ? undefined : clampQuality(0.92));
  return makeProcessResult(blob, image, format, width, height);
}

import { canvasToBlob, clampQuality, createCanvas, get2DContext, makeProcessResult } from "./canvas";
import type {
  AdjustFilter,
  DecodedImage,
  EditTextOverlay,
  EditStickerOverlay,
  PhotoEditOptions,
  ProcessResult,
} from "./types";

export const ADJUST_FILTERS: AdjustFilter[] = ["none", "grayscale", "sepia", "invert", "vintage"];

/**
 * Compose a CSS `filter` string from numeric adjustments (0..200, 100 = normal)
 * and an optional preset. The string is applied to the canvas draw context.
 */
export function buildFilterString(
  brightness: number,
  contrast: number,
  saturation: number,
  filter: AdjustFilter,
): string {
  const parts: string[] = [
    `brightness(${brightness / 100})`,
    `contrast(${contrast / 100})`,
    `saturate(${saturation / 100})`,
  ];
  switch (filter) {
    case "grayscale":
      parts.push("grayscale(1)");
      break;
    case "sepia":
      parts.push("sepia(1)");
      break;
    case "invert":
      parts.push("invert(1)");
      break;
    case "vintage":
      parts.push("sepia(0.5)", "contrast(1.1)", "brightness(1.05)", "saturate(1.2)");
      break;
    case "none":
    default:
      break;
  }
  return parts.join(" ");
}

function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  t: EditTextOverlay,
  width: number,
  height: number,
): void {
  const size = Math.round(t.fontSize * height);
  ctx.save();
  ctx.font = `bold ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, size / 12);
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.fillStyle = t.color;
  const x = t.x * width;
  const y = t.y * height;
  ctx.strokeText(t.text, x, y);
  ctx.fillText(t.text, x, y);
  ctx.restore();
}

function drawStickerOverlay(
  ctx: CanvasRenderingContext2D,
  s: EditStickerOverlay,
  width: number,
  height: number,
): void {
  const size = Math.round(s.fontSize * height);
  ctx.save();
  ctx.font = `${size}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(s.emoji, s.x * width, s.y * height);
  ctx.restore();
}

/**
 * Draw the edited composition onto an already-prepared context: the image with
 * the adjustment filter applied, then text and sticker overlays on top. Shared
 * by the live preview canvas and the export path so they always match.
 */
export function composePhotoEdit(
  ctx: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  width: number,
  height: number,
  opts: PhotoEditOptions,
): void {
  ctx.save();
  ctx.filter = buildFilterString(
    opts.brightness,
    opts.contrast,
    opts.saturation,
    opts.filter,
  );
  ctx.drawImage(bitmap, 0, 0, width, height);
  ctx.restore();
  for (const t of opts.texts) drawTextOverlay(ctx, t, width, height);
  for (const s of opts.stickers) drawStickerOverlay(ctx, s, width, height);
}

/** Render the photo edit and encode the result. Output format defaults to source. */
export async function photoEditImage(
  image: DecodedImage,
  opts: PhotoEditOptions,
): Promise<ProcessResult> {
  const format = opts.format ?? image.format;
  const width = image.width;
  const height = image.height;
  const canvas = createCanvas(width, height);
  const ctx = get2DContext(canvas);
  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  composePhotoEdit(ctx, image.bitmap, width, height, opts);
  const blob = await canvasToBlob(canvas, format, format === "png" ? undefined : clampQuality(0.92));
  return makeProcessResult(blob, image, format, width, height);
}

import { canvasToBlob, clampQuality, createCanvas, fillBackgroundForFormat, get2DContext, makeProcessResult } from "./canvas";
import type { DecodedImage, MemeOptions, ProcessResult } from "./types";

/**
 * Word-wrap text into lines that each fit within `maxWidth`, using a caller
 * supplied `measure` function (so the helper stays canvas-free and testable).
 */
export function wrapText(
  text: string,
  maxWidth: number,
  measure: (line: string) => number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const candidate = `${line} ${words[i]}`;
    if (measure(candidate) <= maxWidth) {
      line = candidate;
    } else {
      lines.push(line);
      line = words[i];
    }
  }
  lines.push(line);
  return lines;
}

/**
 * Draw a classic top/bottom meme into `ctx` (canvas already sized w×h).
 * Resolution-independent: scale `fontSize` with the canvas for a faithful
 * preview. Used by both the export and the live preview.
 */
export function composeMeme(
  ctx: CanvasRenderingContext2D,
  bitmap: CanvasImageSource,
  width: number,
  height: number,
  opts: MemeOptions,
): void {
  ctx.drawImage(bitmap, 0, 0, width, height);

  const fontSize = opts.fontSize;
  const lineHeight = fontSize * 1.1;
  const maxWidth = width - fontSize;
  ctx.font = `bold ${fontSize}px Impact, "Arial Black", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineWidth = Math.max(2, fontSize / 12);
  ctx.strokeStyle = opts.strokeColor;
  ctx.fillStyle = opts.color;
  ctx.lineJoin = "round";

  const measure = (s: string) => ctx.measureText(s).width;
  const strokeLine = (line: string, x: number, y: number) => {
    ctx.strokeText(line, x, y);
    ctx.fillText(line, x, y);
  };

  const topLines = wrapText(opts.topText.toUpperCase(), maxWidth, measure);
  topLines.forEach((line, i) => strokeLine(line, width / 2, 20 + (i + 1) * lineHeight));

  const bottomLines = wrapText(opts.bottomText.toUpperCase(), maxWidth, measure);
  bottomLines
    .slice()
    .reverse()
    .forEach((line, i) => strokeLine(line, width / 2, height - 20 - i * lineHeight));
}

/**
 * Render a classic top/bottom text meme. Text is uppercased, drawn in a heavy
 * Impact-style font with a contrasting stroke for legibility over any image.
 */
export async function memeImage(image: DecodedImage, opts: MemeOptions): Promise<ProcessResult> {
  const format = opts.format ?? image.format;
  const width = image.width;
  const height = image.height;
  const canvas = createCanvas(width, height);
  const ctx = get2DContext(canvas);
  fillBackgroundForFormat(ctx, width, height, format);
  composeMeme(ctx, image.bitmap, width, height, opts);
  const blob = await canvasToBlob(canvas, format, format === "png" ? undefined : clampQuality(0.92));
  return makeProcessResult(blob, image, format, width, height);
}

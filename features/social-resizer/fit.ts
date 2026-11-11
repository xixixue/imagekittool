/**
 * Fit geometry for the Social Media Resizer (SPEC V2 §7, Phase 4).
 *
 * Pure rectangle math: given a source image and a target box, compute the draw
 * rectangle for 'contain' (fit inside, may letterbox) or 'cover' (fill the box,
 * may overflow and be cropped by the canvas bounds). No DOM — unit-testable.
 *
 * The render module consumes this + the existing canvas helpers (drawImage,
 * fillBackgroundForFormat, canvasToBlob) — it composes primitives, it does not
 * duplicate resize/crop algorithms (§5/§7).
 */

export type FitMode = "contain" | "cover";

export interface FitRect {
  drawW: number;
  drawH: number;
  /** Top-left offset within the target canvas (may be negative for cover overflow). */
  drawX: number;
  drawY: number;
}

/**
 * Compute the centered draw rectangle for `mode`.
 * - contain: the whole source fits inside the target (letterboxed).
 * - cover: the source fills the target (overflow cropped by the canvas).
 */
export function computeFit(
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
  mode: FitMode,
): FitRect {
  const srcRatio = srcW / srcH;
  const targetRatio = targetW / targetH;
  let drawW: number;
  let drawH: number;
  if (mode === "contain") {
    if (srcRatio > targetRatio) {
      drawW = targetW;
      drawH = targetW / srcRatio;
    } else {
      drawH = targetH;
      drawW = targetH * srcRatio;
    }
  } else {
    // cover: fill the target — scale by the LARGER axis.
    if (srcRatio > targetRatio) {
      drawH = targetH;
      drawW = targetH * srcRatio;
    } else {
      drawW = targetW;
      drawH = targetW / srcRatio;
    }
  }
  const drawX = (targetW - drawW) / 2;
  const drawY = (targetH - drawH) / 2;
  return { drawW, drawH, drawX, drawY };
}

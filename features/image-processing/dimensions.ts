/** Pure dimension math for resize and crop (no canvas, fully testable). */

export interface ResizeInput {
  srcWidth: number;
  srcHeight: number;
  targetWidth?: number;
  targetHeight?: number;
  /** Preserve aspect ratio when both dimensions are supplied (contain fit). */
  lockAspect: boolean;
  /** 1..100; when provided, scales both dimensions by this percentage. */
  percent?: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

function roundDims(w: number, h: number): Dimensions {
  return {
    width: Math.max(1, Math.round(w)),
    height: Math.max(1, Math.round(h)),
  };
}

/** Fit source inside a box preserving aspect ratio (contain). */
function contain(sw: number, sh: number, bw: number, bh: number): Dimensions {
  const r = Math.min(bw / sw, bh / sh);
  return roundDims(sw * r, sh * r);
}

/**
 * Compute output dimensions for a resize operation.
 * - percent (if > 0) overrides explicit target dimensions.
 * - with lockAspect + both dims: contain fit inside the target box.
 * - with lockAspect + one dim: derive the other from the source aspect ratio.
 */
export function computeResizeDimensions(input: ResizeInput): Dimensions {
  const { srcWidth, srcHeight, lockAspect, percent } = input;
  if (srcWidth <= 0 || srcHeight <= 0) {
    return { width: srcWidth, height: srcHeight };
  }
  if (percent != null && percent > 0) {
    const f = percent / 100;
    return roundDims(srcWidth * f, srcHeight * f);
  }
  const tw = input.targetWidth;
  const th = input.targetHeight;
  if (tw && th) {
    return lockAspect ? contain(srcWidth, srcHeight, tw, th) : roundDims(tw, th);
  }
  if (tw && !th) {
    return lockAspect
      ? { width: Math.round(tw), height: Math.max(1, Math.round((srcHeight / srcWidth) * tw)) }
      : { width: Math.round(tw), height: srcHeight };
  }
  if (th && !tw) {
    return lockAspect
      ? { height: Math.round(th), width: Math.max(1, Math.round((srcWidth / srcHeight) * th)) }
      : { width: srcWidth, height: Math.round(th) };
  }
  return { width: srcWidth, height: srcHeight };
}

export interface Preset {
  label: string;
  width: number;
  height: number;
}

export const RESIZE_PRESETS: Preset[] = [
  { label: "1920 × 1080 (Full HD)", width: 1920, height: 1080 },
  { label: "1280 × 720 (HD)", width: 1280, height: 720 },
  { label: "800 × 600", width: 800, height: 600 },
  { label: "500 × 500", width: 500, height: 500 },
];

export interface AspectRatio {
  label: string;
  /** width/height, or undefined for free crop. */
  value: number | undefined;
}

export const CROP_ASPECT_RATIOS: AspectRatio[] = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
];

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Clamp a crop rectangle to source bounds with a minimum size of 1px. */
export function clampCropRect(rect: CropRect, srcWidth: number, srcHeight: number): CropRect {
  const x = Math.max(0, Math.min(rect.x, srcWidth - 1));
  const y = Math.max(0, Math.min(rect.y, srcHeight - 1));
  const width = Math.max(1, Math.min(rect.width, srcWidth - x));
  const height = Math.max(1, Math.min(rect.height, srcHeight - y));
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Shared types for the browser-local image processing pipeline.
 * UI components and tool pages consume these; processing functions are pure-ish
 * (canvas-coupled) and kept in features/image-processing.
 */

export type ImageFormat = "jpeg" | "png" | "webp";

export type ToolType =
  | "image-compressor"
  | "image-resizer"
  | "image-converter"
  | "image-cropper"
  | "compress-image-to-kb"
  | "rotate-image"
  | "watermark-image"
  | "meme-generator"
  | "photo-editor"
  | "blur-image";

/** A decoded source image ready for canvas-based processing. */
export interface DecodedImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  format: ImageFormat;
  /** Original file name, used to build the output filename. */
  name: string;
}

/** Result of processing one image. */
export interface ProcessResult {
  blob: Blob;
  filename: string;
  mimeType: string;
  extension: string;
  format: ImageFormat;
  width: number;
  height: number;
  sizeBytes: number;
}

/** Per-file processing status for the workspace UI. */
export type FileStatus = "pending" | "invalid" | "processing" | "done" | "error";

export interface CompressOptions {
  /** 0..1 quality for JPEG/WebP. Ignored for PNG (lossless). */
  quality: number;
  /** Output format; defaults to the source format. */
  format?: ImageFormat;
}

export interface ResizeOptions {
  targetWidth?: number;
  targetHeight?: number;
  /** Preserve aspect ratio when both dimensions are supplied (contain fit). */
  lockAspect: boolean;
  /** 1..100; when provided, scales both dimensions by this percentage. */
  percent?: number;
  format?: ImageFormat;
}

export interface ConvertOptions {
  format: ImageFormat;
  /** CSS color used to fill transparency when the target format has no alpha (e.g. PNG/WebP → JPEG). */
  background?: string;
}

export interface CropOptions {
  /** Crop rectangle in source pixels (already accounting for rotation). */
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  rotation: 0 | 90 | 180 | 270;
  format?: ImageFormat;
}

export interface CompressToKbOptions {
  targetBytes: number;
  maxIterations?: number;
  timeBudgetMs?: number;
  /**
   * PNG is lossless and cannot be quality-searched. When true (default), reaching the
   * target may re-encode PNG input as WebP (lossy). The UI must warn that transparency
   * may be lost when this happens.
   */
  allowFormatChange?: boolean;
}

export interface CompressToKbResult extends ProcessResult {
  metTarget: boolean;
  iterations: number;
  /** Human-readable note when the target could not be reached. */
  note?: string;
}

/** Rotate by 90° steps with optional mirroring (SPEC §4 — rotate tool). */
export interface RotateOptions {
  angle: 0 | 90 | 180 | 270;
  flipH?: boolean;
  flipV?: boolean;
  format?: ImageFormat;
}

/** Nine-grid anchor for placing a watermark. */
export type WatermarkAnchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

/** Text watermark options (SPEC §4 — watermark tool). */
export interface WatermarkOptions {
  text: string;
  /** Font size in pixels (relative to the source image height when scaled). */
  fontSize: number;
  color: string;
  /** 0..1 alpha. */
  opacity: number;
  position: WatermarkAnchor;
  /** Rotation in degrees. */
  angle: number;
  /** Repeat the text in a diagonal tile across the whole image. */
  repeat: boolean;
  /** Pixel margin from edges / spacing between tiles. */
  margin: number;
  format?: ImageFormat;
}

/** Classic top/bottom text meme (SPEC §4 — meme generator). */
export interface MemeOptions {
  topText: string;
  bottomText: string;
  fontSize: number;
  color: string;
  strokeColor: string;
  format?: ImageFormat;
}

/** Photo-editor filter presets applied on top of numeric adjustments. */
export type AdjustFilter = "none" | "grayscale" | "sepia" | "invert" | "vintage";

/** A draggable text layer on the photo editor canvas. */
export interface EditTextOverlay {
  text: string;
  /** Font size as a fraction of the image height (0..1) — scales with the canvas. */
  fontSize: number;
  color: string;
  /** Normalized 0..1 center position (relative to image size). */
  x: number;
  y: number;
}

/** A draggable emoji sticker on the photo editor canvas. */
export interface EditStickerOverlay {
  emoji: string;
  /** Font size as a fraction of the image height (0..1) — scales with the canvas. */
  fontSize: number;
  /** Normalized 0..1 center position (relative to image size). */
  x: number;
  y: number;
}

/** Photo editor adjustments + overlays (SPEC §4 — photo editor). */
export interface PhotoEditOptions {
  /** 0..200, 100 = unchanged. */
  brightness: number;
  contrast: number;
  saturation: number;
  filter: AdjustFilter;
  texts: EditTextOverlay[];
  stickers: EditStickerOverlay[];
  format?: ImageFormat;
}

/** A rectangle to blur/mosaic, in source pixels. */
export interface BlurRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Manual region blur/mosaic options (SPEC §4 — blur tool). */
export interface BlurOptions {
  regions: BlurRegion[];
  /** Gaussian blur radius in pixels (used when mosaic === 0). */
  radius: number;
  /** Mosaic tile size in pixels (0 = gaussian blur instead of pixelation). */
  mosaic: number;
  format?: ImageFormat;
}

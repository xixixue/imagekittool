/**
 * Batch processing steps (SPEC V2 §5.3/§5.4, Phase 3).
 *
 * Step type definitions, parameter validation, the rename pattern, and a
 * pipeline runner that CHAINS steps by re-decoding the intermediate result
 * between pixel ops. The pipeline reuses the existing image-processing
 * functions directly (§5: '工作流底层复用现有图像处理函数，不得复制多套算法实现')
 * — no algorithm is duplicated here.
 *
 * First batch steps (§5.3): Resize, Convert Format, Compress, Watermark,
 * Rename, Rotate/Flip.
 */
import {
  compressImage,
  convertImage,
  decodeToImage,
  detectFormat,
  formatToExt,
  formatToMime,
  releaseImage,
  resizeImage,
  rotateImage,
  watermarkImage,
  SUPPORTED_FORMATS,
  type DecodedImage,
  type ImageFormat,
  type ProcessResult,
  type WatermarkAnchor,
} from "@/features/image-processing";

export type BatchStepType =
  | "resize"
  | "convert"
  | "compress"
  | "watermark"
  | "rotate"
  | "rename";

export interface ResizeStepParams {
  targetWidth?: number;
  targetHeight?: number;
  /** Preserve aspect ratio when both dimensions are supplied (contain fit). */
  lockAspect: boolean;
  /** 1..100; scales both dimensions by this percentage. */
  percent?: number;
}
export interface ConvertStepParams {
  format: ImageFormat;
  /** CSS color to fill transparency when the target has no alpha. */
  background?: string;
}
export interface CompressStepParams {
  /** 0..1 quality for JPEG/WebP (ignored for PNG). */
  quality: number;
  format?: ImageFormat;
}
export interface WatermarkStepParams {
  text: string;
  fontSize: number;
  color: string;
  /** 0..1 alpha. */
  opacity: number;
  position: WatermarkAnchor;
  /** Rotation in degrees. */
  angle: number;
  repeat: boolean;
  /** Pixel margin from edges / spacing between tiles. */
  margin: number;
}
export interface RotateStepParams {
  angle: 0 | 90 | 180 | 270;
  flipH?: boolean;
  flipV?: boolean;
}
export interface RenameStepParams {
  /** Filename pattern: {n}=sequence, {name}=original stem, {ext}=extension. */
  pattern: string;
}

export type BatchStep =
  | { type: "resize"; params: ResizeStepParams }
  | { type: "convert"; params: ConvertStepParams }
  | { type: "compress"; params: CompressStepParams }
  | { type: "watermark"; params: WatermarkStepParams }
  | { type: "rotate"; params: RotateStepParams }
  | { type: "rename"; params: RenameStepParams };

/** Ordered batch steps + the 1-based index of the file in the batch (for {n}). */
export interface BatchPipeline {
  steps: BatchStep[];
  index: number;
}

/**
 * Validate a step's params. Returns a list of human-readable issue strings
 * (empty = valid). Pure — unit-testable.
 */
export function validateStepParams(step: BatchStep): string[] {
  const errors: string[] = [];
  switch (step.type) {
    case "resize": {
      const p = step.params;
      const hasDims = p.targetWidth != null || p.targetHeight != null;
      if (!hasDims && p.percent == null) errors.push("resize needs width, height, or percent");
      if (p.targetWidth != null && (!Number.isInteger(p.targetWidth) || p.targetWidth < 1))
        errors.push("width must be a positive integer");
      if (p.targetHeight != null && (!Number.isInteger(p.targetHeight) || p.targetHeight < 1))
        errors.push("height must be a positive integer");
      if (p.percent != null && (p.percent < 1 || p.percent > 100))
        errors.push("percent must be 1..100");
      break;
    }
    case "compress": {
      const q = step.params.quality;
      if (typeof q !== "number" || q < 0 || q > 1) errors.push("quality must be 0..1");
      break;
    }
    case "convert":
      if (!SUPPORTED_FORMATS.includes(step.params.format)) errors.push("unsupported format");
      break;
    case "watermark": {
      const p = step.params;
      if (!p.text?.trim()) errors.push("watermark text required");
      if (p.opacity < 0 || p.opacity > 1) errors.push("opacity must be 0..1");
      if (p.fontSize < 1) errors.push("fontSize must be positive");
      break;
    }
    case "rotate":
      if (![0, 90, 180, 270].includes(step.params.angle))
        errors.push("angle must be 0/90/180/270");
      break;
    case "rename":
      if (!step.params.pattern?.trim()) errors.push("rename pattern required");
      break;
  }
  return errors;
}

/** Validate every step in a pipeline; returns the first failing step's errors. */
export function validatePipeline(steps: BatchStep[]): string[] {
  if (steps.length === 0) return ["pipeline needs at least one step"];
  for (const step of steps) {
    const errs = validateStepParams(step);
    if (errs.length) return errs;
  }
  return [];
}

/**
 * Apply a rename pattern to produce a full filename.
 * {n} → zero-padded 1-based sequence; {name} → original stem; {ext} → extension.
 * If the pattern omits {ext}, the original extension is appended.
 * Pure — unit-testable.
 */
export function applyRename(
  params: RenameStepParams,
  stem: string,
  ext: string,
  index: number,
): string {
  const n = String(index + 1).padStart(3, "0");
  const hasExtToken = /\{ext\}/.test(params.pattern);
  let out = params.pattern.replace(/\{n\}/g, n).replace(/\{name\}/g, stem);
  if (hasExtToken) {
    out = out.replace(/\{ext\}/g, ext);
  } else if (ext) {
    out = `${out}.${ext}`;
  }
  return out;
}

/** Apply a single (non-rename) pixel step to a decoded image. Canvas-coupled. */
export async function applyStep(
  image: DecodedImage,
  step: BatchStep,
): Promise<ProcessResult> {
  switch (step.type) {
    case "resize":
      return resizeImage(image, { ...step.params, format: image.format });
    case "convert":
      return convertImage(image, step.params);
    case "compress":
      return compressImage(image, step.params);
    case "watermark":
      return watermarkImage(image, { ...step.params, format: image.format });
    case "rotate":
      return rotateImage(image, { ...step.params, format: image.format });
    case "rename":
      throw new Error("rename is metadata-only; use applyRename, not applyStep");
  }
}

function abortError(): Error {
  const e = new Error("aborted");
  e.name = "AbortError";
  return e;
}

export interface ApplyStepsOptions {
  signal?: AbortSignal;
  /** 1-based sequence index for the rename {n} token. */
  index?: number;
}

/**
 * Run the full pipeline on one file: decode → chain pixel steps (re-decoding
 * the intermediate blob between steps) → apply rename → return the result.
 * Intermediate ImageBitmaps are released between steps (§5.4 resource release).
 * Canvas-coupled (decode/createImageBitmap); the pure logic above is unit-tested.
 */
export async function applySteps(
  file: File,
  steps: BatchStep[],
  opts: ApplyStepsOptions = {},
): Promise<ProcessResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const format: ImageFormat = detectFormat(bytes) ?? "jpeg";

  let image = await decodeToImage(file, format);
  const pixelSteps = steps.filter((s) => s.type !== "rename");
  const renameStep = steps.find((s) => s.type === "rename") as
    | { type: "rename"; params: RenameStepParams }
    | undefined;

  let result: ProcessResult | null = null;
  try {
    for (let i = 0; i < pixelSteps.length; i++) {
      if (opts.signal?.aborted) throw abortError();
      result = await applyStep(image, pixelSteps[i]);
      // Release the previous bitmap; re-decode the intermediate for the next step.
      releaseImage(image);
      if (i < pixelSteps.length - 1) {
        const intermediate = new File([result.blob], result.filename, {
          type: result.mimeType,
        });
        image = await decodeToImage(intermediate, result.format);
      }
    }
  } finally {
    releaseImage(image);
  }

  // No pixel steps (e.g. rename-only batch) → pass the original through unchanged.
  if (!result) {
    result = {
      blob: file,
      filename: file.name,
      mimeType: file.type || formatToMime(format),
      extension: formatToExt(format),
      format,
      width: image.width,
      height: image.height,
      sizeBytes: file.size,
    };
  }

  if (renameStep) {
    const dot = result.filename.lastIndexOf(".");
    const stem = dot > 0 ? result.filename.slice(0, dot) : result.filename;
    const ext = dot > 0 ? result.filename.slice(dot + 1) : result.extension;
    result = { ...result, filename: applyRename(renameStep.params, stem, ext, opts.index ?? 0) };
  }

  return result;
}

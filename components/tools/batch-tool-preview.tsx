"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { decodeToImage, releaseImage, type DecodedImage, type ImageFormat } from "@/features/image-processing";

/** Long-side cap for the live preview canvas (bounds memory on huge images). */
const PREVIEW_CAP = 1000;

interface BatchToolPreviewProps<O> {
  file: File;
  format: ImageFormat;
  options: O;
  /**
   * Draw the processed result into `ctx` (canvas already sized w×h). The same
   * function is used by the export path, so the preview matches the output.
   */
  compose: (
    ctx: CanvasRenderingContext2D,
    bitmap: CanvasImageSource,
    width: number,
    height: number,
    options: O,
  ) => void;
  /** Output size for given source dims + options (e.g. rotated size). Defaults to source size. */
  previewSize?: (srcW: number, srcH: number, options: O) => { width: number; height: number };
  /** Scale size-dependent option fields (fontSize, margin, …) with the canvas so the preview stays faithful. */
  scaleOptions?: (options: O, scale: number) => O;
}

/**
 * Live, in-browser preview of the first loaded image rendered with the current
 * options. Decodes the first file once and re-composes (debounced) whenever the
 * options change. Nothing is uploaded.
 */
export function BatchToolPreview<O>({
  file,
  format,
  options,
  compose,
  previewSize,
  scaleOptions,
}: BatchToolPreviewProps<O>) {
  const t = useTranslations("Controls");
  const [decoded, setDecoded] = useState<DecodedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const decodedRef = useRef<DecodedImage | null>(null);

  // Keep latest callbacks in refs so the render effect only depends on data.
  const composeRef = useRef(compose);
  composeRef.current = compose;
  const previewSizeRef = useRef(previewSize);
  previewSizeRef.current = previewSize;
  const scaleOptionsRef = useRef(scaleOptions);
  scaleOptionsRef.current = scaleOptions;

  // Decode the first file once (re-decode when the file changes).
  useEffect(() => {
    let cancelled = false;
    if (decodedRef.current) {
      releaseImage(decodedRef.current);
      decodedRef.current = null;
    }
    setDecoded(null);
    setError(null);
    decodeToImage(file, format)
      .then((dec) => {
        if (cancelled) {
          releaseImage(dec);
          return;
        }
        decodedRef.current = dec;
        setDecoded(dec);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : t("failedLoad"));
      });
    return () => {
      cancelled = true;
    };
  }, [file, format, t]);

  // Release the bitmap on unmount.
  useEffect(() => {
    return () => {
      if (decodedRef.current) {
        releaseImage(decodedRef.current);
        decodedRef.current = null;
      }
    };
  }, []);

  // Re-compose the preview (debounced) whenever options or the decoded image change.
  useEffect(() => {
    if (!decoded || !canvasRef.current) return;
    const id = window.setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const target = previewSizeRef.current
        ? previewSizeRef.current(decoded.width, decoded.height, options)
        : { width: decoded.width, height: decoded.height };
      const scale = Math.min(1, PREVIEW_CAP / Math.max(target.width, target.height));
      const cw = Math.max(1, Math.round(target.width * scale));
      const ch = Math.max(1, Math.round(target.height * scale));
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
      const scaledOpts = scaleOptionsRef.current ? scaleOptionsRef.current(options, scale) : options;
      composeRef.current(ctx, decoded.bitmap, cw, ch, scaledOpts);
    }, 120);
    return () => window.clearTimeout(id);
  }, [decoded, options]);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{t("previewLabel")}</span>
        <span className="text-xs text-muted-foreground">{t("previewHint")}</span>
      </div>
      {decoded ? (
        <canvas ref={canvasRef} className="mx-auto max-h-[60vh] w-auto max-w-full rounded-lg" />
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">{t("loadingPreview")}</p>
      )}
    </div>
  );
}

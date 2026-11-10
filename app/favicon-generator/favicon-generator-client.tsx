"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DropZone } from "@/components/upload/drop-zone";
import {
  decodeToImage,
  releaseImage,
  validateImageFile,
  type ImageFormat,
} from "@/features/image-processing";
import { generateFaviconSet, type FaviconResult } from "@/features/favicon";
import { triggerDownload } from "@/lib/download";

const PREVIEW_SIZES = [16, 32, 64, 180];

/**
 * Favicon Generator (SPEC V2 §4.2 P0). Generates a multi-size favicon package
 * (PNGs + multi-size ICO + web manifest + HTML snippet) entirely in the
 * browser, with a live preview at several sizes. The source image is never
 * uploaded.
 */
export function FaviconGeneratorClient() {
  const tC = useTranslations("Controls");
  const [result, setResult] = useState<FaviconResult | null>(null);
  const [previewUrls, setPreviewUrls] = useState<{ size: number; url: string }[]>([]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const urlsRef = useRef<string[]>([]);
  urlsRef.current = previewUrls.map((p) => p.url);

  useEffect(
    () => () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  const reset = useCallback(() => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    setPreviewUrls([]);
    setResult(null);
    setError(null);
    setCopied(false);
  }, []);

  const onFiles = useCallback(
    async (files: FileList | File[]) => {
      const f = Array.from(files)[0];
      if (!f) return;
      reset();
      const v = await validateImageFile(f);
      if (!v.ok || !v.format) {
        setError(v.error ?? tC("unsupportedFile"));
        return;
      }
      setWorking(true);
      try {
        const dec = await decodeToImage(f, v.format as ImageFormat);
        const res = await generateFaviconSet(dec.bitmap);
        releaseImage(dec);
        const urls = PREVIEW_SIZES.map((size) => ({
          size,
          url: URL.createObjectURL(res.previews.get(size)!),
        }));
        setPreviewUrls(urls);
        setResult(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : tC("failedLoad"));
      } finally {
        setWorking(false);
      }
    },
    [reset, tC],
  );

  const onDownloadZip = useCallback(async () => {
    if (!result) return;
    const { zipSync } = await import("fflate");
    const zipped = zipSync(result.zipFiles);
    const blob = new Blob([zipped], { type: "application/zip" });
    triggerDownload(blob, "favicon.zip");
  }, [result]);

  const onCopySnippet = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be unavailable; the snippet is still visible to copy manually */
    }
  }, [result]);

  return (
    <div className="space-y-6">
      {!result && !working && <DropZone onFiles={onFiles} multiple={false} />}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {working && <p className="text-sm text-muted-foreground">{tC("faviconWorking")}</p>}

      {result && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              {tC("exifReplace")}
            </button>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">{tC("faviconPreview")}</h3>
            <div className="mt-4 flex flex-wrap items-end gap-6">
              {previewUrls.map((p) => (
                <div key={p.size} className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={`${p.size}px`}
                    width={p.size}
                    height={p.size}
                    className="rounded border border-border bg-white"
                    style={{ imageRendering: p.size <= 32 ? "pixelated" : "auto" }}
                  />
                  <span className="text-xs text-muted-foreground">{p.size}px</span>
                </div>
              ))}
            </div>
          </div>

          {/* Snippet */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{tC("faviconSnippet")}</h3>
              <button
                type="button"
                onClick={onCopySnippet}
                className="rounded-md border border-border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
              >
                {copied ? tC("faviconCopied") : tC("faviconCopy")}
              </button>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed">
              <code>{result.snippet}</code>
            </pre>
          </div>

          <button
            type="button"
            onClick={onDownloadZip}
            className="w-full rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {tC("faviconDownload")}
          </button>
        </div>
      )}
    </div>
  );
}

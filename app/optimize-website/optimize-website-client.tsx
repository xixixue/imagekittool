"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { DropZone } from "@/components/upload/drop-zone";
import { applySteps, type BatchStep } from "@/features/batch-engine/steps";
import { triggerDownload } from "@/lib/download";

interface ResultState {
  blob: Blob;
  url: string;
  filename: string;
  size: number;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Optimize for Website (SPEC V2 §6.1, Phase 4). A Quick Workflow that converts
 * to WebP and compresses in one pass, showing the size savings. Runs the
 * batch-engine pipeline locally; nothing is uploaded.
 */
export function OptimizeWebsiteClient() {
  const tC = useTranslations("Controls");
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(0.72);
  const [resizeWidth, setResizeWidth] = useState<string>("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);

  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result.url);
    },
    [result],
  );

  const onFiles = (files: FileList | File[]) => {
    const f = Array.from(files)[0];
    if (!f) return;
    if (!IMAGE_TYPES.includes(f.type)) {
      setError(tC("unsupportedFile"));
      return;
    }
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setError(null);
    setFile(f);
  };

  const onOptimize = async () => {
    if (!file) return;
    setWorking(true);
    setError(null);
    if (result) {
      URL.revokeObjectURL(result.url);
      setResult(null);
    }
    try {
      const steps: BatchStep[] = [];
      const w = resizeWidth ? Number(resizeWidth) : undefined;
      if (w && w > 0) {
        steps.push({ type: "resize", params: { targetWidth: w, lockAspect: true } });
      }
      steps.push({ type: "convert", params: { format: "webp" } });
      steps.push({ type: "compress", params: { quality } });
      const res = await applySteps(file, steps, { index: 0 });
      setResult({
        blob: res.blob,
        url: URL.createObjectURL(res.blob),
        filename: res.filename,
        size: res.blob.size,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : tC("exportFailed"));
    } finally {
      setWorking(false);
    }
  };

  const savings =
    result && file && file.size > 0
      ? Math.max(0, Math.round((1 - result.size / file.size) * 100))
      : null;

  return (
    <div className="space-y-6">
      {!file && <DropZone onFiles={onFiles} multiple={false} />}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {file && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="truncate text-sm font-medium">{file.name}</span>
            <button
              type="button"
              onClick={() => {
                if (result) URL.revokeObjectURL(result.url);
                setFile(null);
                setResult(null);
                setError(null);
              }}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              {tC("exifReplace")}
            </button>
          </div>

          <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2">
            <label className="text-sm">
              <span className="block font-medium">{tC("owQuality")}</span>
              <input
                type="range"
                min={0.4}
                max={0.95}
                step={0.01}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="mt-2 w-full"
              />
              <span className="text-xs text-muted-foreground">{Math.round(quality * 100)}%</span>
            </label>
            <label className="text-sm">
              <span className="block font-medium">{tC("owResize")}</span>
              <input
                type="number"
                value={resizeWidth}
                onChange={(e) => setResizeWidth(e.target.value)}
                placeholder="auto"
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={onOptimize}
            disabled={working}
            className="w-full rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {working ? tC("owOptimizing") : tC("owOptimize")}
          </button>

          {result && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.url} alt="Result" className="mx-auto max-h-64 rounded-lg border border-border object-contain" />
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">
                  {tC("owOriginal")} {(file.size / 1024).toFixed(0)} KB → {tC("owResult")}{" "}
                  {(result.size / 1024).toFixed(0)} KB
                  {savings != null ? ` · ${tC("owSavings", { percent: savings })}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => triggerDownload(result.blob, result.filename)}
                  className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
                >
                  {tC("download")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

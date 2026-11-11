"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { DropZone } from "@/components/upload/drop-zone";
import { convertHeic } from "@/features/heic";
import type { ImageFormat } from "@/features/image-processing";
import { triggerDownload } from "@/lib/download";

interface ResultState {
  blob: Blob;
  url: string;
  filename: string;
  size: number;
  width: number;
  height: number;
}

/** Accept HEIC/HEIF by MIME or extension (some browsers report no MIME). */
function isHeic(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t === "image/heic" || t === "image/heif" || t === "image/heic-sequence") return true;
  const n = file.name.toLowerCase();
  return n.endsWith(".heic") || n.endsWith(".heif");
}

/**
 * HEIC to JPG (and PNG/WebP) converter (SPEC V2 Phase 5, §8.3). Decodes HEIC/HEIF
 * in the browser via heic2any and re-encodes to the chosen format. Nothing is
 * uploaded.
 */
export function HeicToJpgClient() {
  const tC = useTranslations("Controls");
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ImageFormat>("jpeg");
  const [quality, setQuality] = useState(0.9);
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
    if (!isHeic(f)) {
      setError(tC("heicNotHeic"));
      return;
    }
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setError(null);
    setFile(f);
  };

  const onConvert = async () => {
    if (!file) return;
    setWorking(true);
    setError(null);
    if (result) {
      URL.revokeObjectURL(result.url);
      setResult(null);
    }
    try {
      const res = await convertHeic(file, { format, quality });
      setResult({
        blob: res.blob,
        url: URL.createObjectURL(res.blob),
        filename: res.filename,
        size: res.blob.size,
        width: res.width,
        height: res.height,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : tC("exportFailed"));
    } finally {
      setWorking(false);
    }
  };

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
              <span className="block font-medium">{tC("heicFormat")}</span>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ImageFormat)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"
              >
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="block font-medium">{tC("heicQuality")}</span>
              <input
                type="range"
                min={0.4}
                max={0.95}
                step={0.01}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                disabled={format === "png"}
                className="mt-2 w-full disabled:opacity-40"
              />
              <span className="text-xs text-muted-foreground">{Math.round(quality * 100)}%</span>
            </label>
          </div>

          <button
            type="button"
            onClick={onConvert}
            disabled={working}
            className="w-full rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {working ? tC("heicConverting") : tC("heicConvert")}
          </button>

          {result && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.url} alt="Result" className="mx-auto max-h-64 rounded-lg border border-border object-contain" />
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">
                  {result.width}×{result.height} · {(result.size / 1024).toFixed(0)} KB
                  {file.size > 0
                    ? ` · ${Math.max(0, Math.round((1 - result.size / file.size) * 100))}% smaller`
                    : ""}
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

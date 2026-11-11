"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { DropZone } from "@/components/upload/drop-zone";
import { resizeToTarget, type FitMode } from "@/features/social-resizer";
import {
  PLATFORMS,
  PLATFORM_LABELS,
  getPreset,
  presetsByPlatform,
  type SocialPlatform,
} from "@/lib/data/social-presets";
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

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Social Media Image Resizer (SPEC V2 §7, Phase 4). Resize one image to a
 * platform/scene preset (or custom size) with Contain / Cover fit. Runs locally;
 * nothing is uploaded. Presets are centrally managed in lib/data/social-presets.
 */
export function SocialMediaResizerClient() {
  const tC = useTranslations("Controls");
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [presetId, setPresetId] = useState("ig-post");
  const [mode, setMode] = useState<FitMode>("cover");
  const [format, setFormat] = useState<ImageFormat>("jpeg");
  const [customW, setCustomW] = useState<string>("");
  const [customH, setCustomH] = useState<string>("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);

  useEffect(
    () => () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (result) URL.revokeObjectURL(result.url);
    },
    [originalUrl, result],
  );

  const preset = getPreset(presetId);
  const presets = presetsByPlatform(platform);
  const targetW = customW ? Number(customW) : preset?.width ?? 1080;
  const targetH = customH ? Number(customH) : preset?.height ?? 1080;

  const onFiles = (files: FileList | File[]) => {
    const f = Array.from(files)[0];
    if (!f) return;
    if (!IMAGE_TYPES.includes(f.type)) {
      setError(tC("unsupportedFile"));
      return;
    }
    if (result) URL.revokeObjectURL(result.url);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setResult(null);
    setError(null);
    setFile(f);
    setOriginalUrl(URL.createObjectURL(f));
  };

  const onPlatformChange = (p: SocialPlatform) => {
    setPlatform(p);
    const first = presetsByPlatform(p)[0];
    if (first) setPresetId(first.id);
  };

  const onProcess = async () => {
    if (!file) return;
    setWorking(true);
    setError(null);
    if (result) {
      URL.revokeObjectURL(result.url);
      setResult(null);
    }
    try {
      const res = await resizeToTarget(file, {
        targetWidth: targetW,
        targetHeight: targetH,
        mode,
        format,
      });
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
                if (originalUrl) URL.revokeObjectURL(originalUrl);
                if (result) URL.revokeObjectURL(result.url);
                setFile(null);
                setOriginalUrl(null);
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
              <span className="block font-medium">{tC("socialPlatform")}</span>
              <select
                value={platform}
                onChange={(e) => onPlatformChange(e.target.value as SocialPlatform)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="block font-medium">{tC("socialPreset")}</span>
              <select
                value={presetId}
                onChange={(e) => setPresetId(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.width}×{p.height}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="block font-medium">{tC("socialFit")}</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as FitMode)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"
              >
                <option value="cover">Cover (crop)</option>
                <option value="contain">Contain (letterbox)</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="block font-medium">{tC("socialFormat")}</span>
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
              <span className="block font-medium">{tC("socialWidth")}</span>
              <input
                type="number"
                value={customW}
                onChange={(e) => setCustomW(e.target.value)}
                placeholder={String(preset?.width ?? 1080)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"
              />
            </label>
            <label className="text-sm">
              <span className="block font-medium">{tC("socialHeight")}</span>
              <input
                type="number"
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                placeholder={String(preset?.height ?? 1080)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"
              />
            </label>
          </div>

          {preset && (
            <p className="text-xs text-muted-foreground">
              {preset.description} · {preset.ratio} · {tC("socialRecommendedNote")}
            </p>
          )}

          <button
            type="button"
            onClick={onProcess}
            disabled={working}
            className="w-full rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {working ? tC("socialProcessing") : tC("socialProcess")}
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

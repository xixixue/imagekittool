"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { useTranslations } from "next-intl";
import { DropZone } from "@/components/upload/drop-zone";
import {
  CROP_ASPECT_RATIOS,
  cropImage,
  decodeToImage,
  releaseImage,
  validateImageFile,
  type CropOptions,
  type DecodedImage,
  type ImageFormat,
  type ProcessResult,
} from "@/features/image-processing";
import { triggerDownload } from "@/lib/download";
import { cn } from "@/lib/utils";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function CropperClient() {
  const tC = useTranslations("Controls");
  const tWork = useTranslations("Workspace");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<DecodedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [aspectIndex, setAspectIndex] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [format, setFormat] = useState<"auto" | ImageFormat>("auto");
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const resourcesRef = useRef<{ decoded?: DecodedImage; imageSrc?: string; resultUrl?: string }>(
    {},
  );
  resourcesRef.current = {
    decoded: decoded ?? undefined,
    imageSrc: imageSrc ?? undefined,
    resultUrl: resultUrl ?? undefined,
  };

  // Release all resources on unmount only.
  useEffect(
    () => () => {
      const r = resourcesRef.current;
      if (r.decoded) releaseImage(r.decoded);
      if (r.imageSrc) URL.revokeObjectURL(r.imageSrc);
      if (r.resultUrl) URL.revokeObjectURL(r.resultUrl);
    },
    [],
  );

  const onFiles = useCallback(
    async (files: FileList | File[]) => {
      const f = Array.from(files)[0];
      if (!f) return;
      setError(null);
      const v = await validateImageFile(f);
      if (!v.ok || !v.format) {
        setError(v.error ?? tC("unsupportedFile"));
        return;
      }
      try {
        const dec = await decodeToImage(f, v.format);
        setDecoded((prev) => {
          if (prev) releaseImage(prev);
          return dec;
        });
        setImageSrc((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(f);
        });
        setResult(null);
        setResultUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setCroppedAreaPixels(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : tC("failedLoad"));
      }
    },
    [tC],
  );

  const onCropComplete = useCallback((_: CropArea, area: CropArea) => {
    setCroppedAreaPixels(area);
  }, []);

  const doCrop = useCallback(async () => {
    if (!decoded || !croppedAreaPixels) return;
    setWorking(true);
    setError(null);
    try {
      const outFormat: ImageFormat = format === "auto" ? decoded.format : format;
      const opts: CropOptions = {
        cropX: croppedAreaPixels.x,
        cropY: croppedAreaPixels.y,
        cropWidth: croppedAreaPixels.width,
        cropHeight: croppedAreaPixels.height,
        rotation,
        format: outFormat,
      };
      const r = await cropImage(decoded, opts);
      setResult(r);
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(r.blob);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : tC("cropFailed"));
    } finally {
      setWorking(false);
    }
  }, [decoded, croppedAreaPixels, rotation, format, tC]);

  const reset = useCallback(() => {
    setDecoded((prev) => {
      if (prev) releaseImage(prev);
      return null;
    });
    setImageSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setResult(null);
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCroppedAreaPixels(null);
    setError(null);
  }, []);

  return (
    <div className="space-y-6">
      {!imageSrc && <DropZone onFiles={onFiles} multiple={false} />}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {imageSrc && (
        <div className="relative h-80 w-full overflow-hidden rounded-lg bg-neutral-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={CROP_ASPECT_RATIOS[aspectIndex].value}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
      )}

      {imageSrc && (
        <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">{tC("aspectRatio")}</span>
            <select
              value={aspectIndex}
              onChange={(e) => setAspectIndex(Number(e.target.value))}
              className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {CROP_ASPECT_RATIOS.map((a, i) => (
                <option key={a.label} value={i}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">{tC("outputFormat")}</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as "auto" | ImageFormat)}
              className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="auto">{tC("keepOriginal")}</option>
              <option value="jpeg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">
              {tC("zoom", { value: zoom.toFixed(1) })}
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
          </label>
          <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
            <span className="text-sm font-medium">{tC("rotation")}</span>
            {[0, 90, 180, 270].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRotation(r as 0 | 90 | 180 | 270)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  rotation === r
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted",
                )}
              >
                {r}°
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button
              onClick={doCrop}
              disabled={!croppedAreaPixels || working}
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {working ? tC("cropping") : tC("cropPreview")}
            </button>
            <button
              onClick={reset}
              className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
            >
              {tC("chooseAnother")}
            </button>
          </div>
        </div>
      )}

      {result && resultUrl && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium">
            {tC("result", { w: result.width, h: result.height, filename: result.filename })}
          </p>
          {/* Local blob preview; next/image is not appropriate for object URLs. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resultUrl}
            alt={tC("croppedAlt")}
            className="mt-3 max-h-64 rounded border border-border"
          />
          <button
            onClick={() => triggerDownload(result.blob, result.filename)}
            className="mt-3 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {tWork("download")}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DropZone } from "@/components/upload/drop-zone";
import {
  blurImage,
  composeBlurred,
  decodeToImage,
  releaseImage,
  validateImageFile,
  type BlurRegion,
  type DecodedImage,
} from "@/features/image-processing";
import { triggerDownload } from "@/lib/download";
import { cn } from "@/lib/utils";

interface Region extends BlurRegion {
  id: number;
}

type Mode = "gaussian" | "mosaic";

export function BlurClient() {
  const tC = useTranslations("Controls");
  const [decoded, setDecoded] = useState<DecodedImage | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [mode, setMode] = useState<Mode>("mosaic");
  const [intensity, setIntensity] = useState(16);
  const [working, setWorking] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const idRef = useRef(1);
  const drawRef = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null);

  const resourcesRef = useRef<{ decoded?: DecodedImage; imageSrc?: string }>({});
  resourcesRef.current = { decoded: decoded ?? undefined, imageSrc: imageSrc ?? undefined };

  useEffect(
    () => () => {
      const r = resourcesRef.current;
      if (r.decoded) releaseImage(r.decoded);
      if (r.imageSrc) URL.revokeObjectURL(r.imageSrc);
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
        setRegions([]);
      } catch (e) {
        setError(e instanceof Error ? e.message : tC("failedLoad"));
      }
    },
    [tC],
  );

  const previewDims = decoded
    ? (() => {
        const max = 1000;
        const scale = Math.min(1, max / Math.max(decoded.width, decoded.height));
        return {
          w: Math.round(decoded.width * scale),
          h: Math.round(decoded.height * scale),
          scale,
        };
      })()
    : null;

  useEffect(() => {
    if (!decoded || !previewDims || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const { w, h, scale } = previewDims;
    const previewRegions = regions.map((r) => ({
      x: r.x * scale,
      y: r.y * scale,
      width: r.width * scale,
      height: r.height * scale,
    }));
    composeBlurred(ctx, decoded.bitmap, w, h, {
      regions: previewRegions,
      radius: mode === "gaussian" ? intensity * scale : 0,
      mosaic: mode === "mosaic" ? Math.max(2, Math.round(intensity * scale)) : 0,
    });
    // Outlines for committed regions.
    ctx.save();
    ctx.strokeStyle = "rgba(99,102,241,0.9)";
    ctx.lineWidth = 1.5;
    for (const r of previewRegions) {
      ctx.strokeRect(r.x, r.y, r.width, r.height);
    }
    // In-progress rectangle.
    const d = drawRef.current;
    if (d) {
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = "#6366f1";
      ctx.strokeRect(
        Math.min(d.sx, d.cx),
        Math.min(d.sy, d.cy),
        Math.abs(d.cx - d.sx),
        Math.abs(d.cy - d.sy),
      );
    }
    ctx.restore();
  }, [decoded, previewDims, regions, mode, intensity]);

  const toPreviewPixels = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !previewDims) return null;
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * previewDims.w;
    const py = ((e.clientY - rect.top) / rect.height) * previewDims.h;
    return { px, py };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!decoded) return;
    const p = toPreviewPixels(e);
    if (!p) return;
    drawRef.current = { sx: p.px, sy: p.py, cx: p.px, cy: p.py };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawRef.current || !previewDims) return;
    const p = toPreviewPixels(e);
    if (!p) return;
    drawRef.current.cx = p.px;
    drawRef.current.cy = p.py;
    // Trigger a preview re-render by toggling a dummy state-free redraw.
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && decoded) {
      const { w, h, scale } = previewDims;
      const previewRegions = regions.map((r) => ({
        x: r.x * scale,
        y: r.y * scale,
        width: r.width * scale,
        height: r.height * scale,
      }));
      composeBlurred(ctx, decoded.bitmap, w, h, {
        regions: previewRegions,
        radius: mode === "gaussian" ? intensity * scale : 0,
        mosaic: mode === "mosaic" ? Math.max(2, Math.round(intensity * scale)) : 0,
      });
      ctx.save();
      ctx.strokeStyle = "rgba(99,102,241,0.9)";
      ctx.lineWidth = 1.5;
      for (const r of previewRegions) ctx.strokeRect(r.x, r.y, r.width, r.height);
      const d = drawRef.current;
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = "#6366f1";
      ctx.strokeRect(
        Math.min(d.sx, d.cx),
        Math.min(d.sy, d.cy),
        Math.abs(d.cx - d.sx),
        Math.abs(d.cy - d.sy),
      );
      ctx.restore();
    }
  };

  const endDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drawRef.current;
    if (d && previewDims && decoded) {
      const x = Math.min(d.sx, d.cx);
      const y = Math.min(d.sy, d.cy);
      const w = Math.abs(d.cx - d.sx);
      const h = Math.abs(d.cy - d.sy);
      if (w >= 4 && h >= 4) {
        const { scale } = previewDims;
        const id = idRef.current++;
        setRegions((prev) => [
          ...prev,
          {
            id,
            x: Math.round(x / scale),
            y: Math.round(y / scale),
            width: Math.round(w / scale),
            height: Math.round(h / scale),
          },
        ]);
      }
    }
    drawRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const clearRegions = () => setRegions([]);

  const onExport = async () => {
    if (!decoded) return;
    setWorking(true);
    setError(null);
    try {
      const result = await blurImage(decoded, {
        regions,
        radius: mode === "gaussian" ? intensity : 0,
        mosaic: mode === "mosaic" ? Math.max(2, intensity) : 0,
      });
      triggerDownload(result.blob, result.filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : tC("exportFailed"));
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-6">
      {!imageSrc && <DropZone onFiles={onFiles} multiple={false} />}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {imageSrc && decoded && previewDims && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <canvas
              ref={canvasRef}
              width={previewDims.w}
              height={previewDims.h}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDraw}
              onPointerCancel={endDraw}
              className="max-h-[70vh] w-full touch-none cursor-crosshair rounded-lg"
            />
            <p className="mt-2 text-xs text-muted-foreground">{tC("drawHint")}</p>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div>
              <span className="text-sm font-medium">{tC("blurMode")}</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["mosaic", "gaussian"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm transition-colors",
                      mode === m
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    {m === "mosaic" ? tC("blurMosaic") : tC("blurGaussian")}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-xs text-muted-foreground">
                {mode === "mosaic"
                  ? tC("mosaicSize", { value: intensity })
                  : tC("radius", { value: intensity })}
              </span>
              <input
                type="range"
                min={2}
                max={50}
                step={1}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="mt-1 w-full accent-primary"
              />
            </label>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {regions.length} {tC("regionsLabel")}
              </span>
              <button
                type="button"
                onClick={clearRegions}
                disabled={regions.length === 0}
                className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-muted disabled:opacity-50"
              >
                {tC("clearRegions")}
              </button>
            </div>

            <button
              type="button"
              onClick={onExport}
              disabled={working}
              className="w-full rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {working ? tC("exporting") : tC("export")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DropZone } from "@/components/upload/drop-zone";
import {
  decodeToImage,
  formatToMime,
  releaseImage,
  validateImageFile,
  type ImageFormat,
} from "@/features/image-processing";
import {
  printSizeInches,
  readImageDpi,
  setImageDpi,
  type DpiFormat,
} from "@/features/dpi";
import { triggerDownload } from "@/lib/download";

interface Loaded {
  bytes: Uint8Array;
  format: DpiFormat;
  width: number;
  height: number;
  currentDpi: number | null;
  name: string;
}

const PRESETS = [72, 96, 300, 600];

function dpiFilename(name: string, dpi: number): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  return `${base}-${dpi}dpi${ext}`;
}

function fmtIn(px: number, dpi: number): string {
  return printSizeInches(px, dpi).toFixed(1);
}

/**
 * DPI Changer (SPEC V2 §4.2 P0, §6.3). Losslessly edits the DPI/PPI metadata
 * (JPEG JFIF density / PNG pHYs) in place — pixels and EXIF are preserved. The
 * UI is explicit that changing DPI does NOT add pixels or improve clarity.
 */
export function DpiChangerClient() {
  const tC = useTranslations("Controls");
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [target, setTarget] = useState(300);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadedRef = useRef<Loaded | null>(null);
  loadedRef.current = loaded;

  useEffect(() => () => setLoaded(null), []);

  const onFiles = useCallback(
    async (files: FileList | File[]) => {
      const f = Array.from(files)[0];
      if (!f) return;
      setError(null);
      setLoaded(null);
      const v = await validateImageFile(f);
      if (!v.ok || !v.format) {
        setError(v.error ?? tC("unsupportedFile"));
        return;
      }
      if (v.format === "webp") {
        setError(tC("dpiUnsupported"));
        return;
      }
      try {
        const dec = await decodeToImage(f, v.format as ImageFormat);
        const bytes = new Uint8Array(await f.arrayBuffer());
        const currentDpi = readImageDpi(bytes, v.format as DpiFormat);
        setLoaded({
          bytes,
          format: v.format as DpiFormat,
          width: dec.width,
          height: dec.height,
          currentDpi,
          name: f.name,
        });
        releaseImage(dec); // only dimensions were needed
      } catch (e) {
        setError(e instanceof Error ? e.message : tC("failedLoad"));
      }
    },
    [tC],
  );

  const effectiveTarget = custom.trim() ? Number(custom) : target;

  const onApply = useCallback(() => {
    if (!loaded) return;
    try {
      const out = setImageDpi(loaded.bytes, loaded.format, effectiveTarget);
      const blob = new Blob([out as unknown as BlobPart], { type: formatToMime(loaded.format as ImageFormat) });
      triggerDownload(blob, dpiFilename(loaded.name, effectiveTarget));
    } catch (e) {
      setError(e instanceof Error ? e.message : tC("exportFailed"));
    }
  }, [loaded, effectiveTarget, tC]);

  return (
    <div className="space-y-6">
      {!loaded && <DropZone onFiles={onFiles} multiple={false} />}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loaded && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <span className="font-medium break-all">{loaded.name}</span>
              <span className="ml-2 text-muted-foreground">
                {tC("dpiPixels", { w: loaded.width, h: loaded.height })}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setLoaded(null);
                setError(null);
                setCustom("");
              }}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              {tC("exifReplace")}
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{tC("dpiCurrent")}</p>
            <p className="mt-1 text-lg font-semibold">
              {loaded.currentDpi ? `${loaded.currentDpi} DPI` : tC("dpiNone")}
            </p>
            {loaded.currentDpi && (
              <p className="mt-1 text-sm text-muted-foreground">
                {tC("dpiPrintSize", { dpi: loaded.currentDpi })}:{" "}
                {fmtIn(loaded.width, loaded.currentDpi)} × {fmtIn(loaded.height, loaded.currentDpi)} in
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold">{tC("dpiTarget")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setTarget(p);
                    setCustom("");
                  }}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    !custom && target === p
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="dpi-custom">
                {tC("dpiCustom")}
              </label>
              <input
                id="dpi-custom"
                type="number"
                min={1}
                max={4000}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="300"
                className="w-28 rounded-md border border-border bg-background px-2 py-1 text-sm"
              />
              <span className="text-sm text-muted-foreground">DPI</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {tC("dpiPrintSize", { dpi: effectiveTarget || 0 })}:{" "}
              {fmtIn(loaded.width, effectiveTarget || 1)} × {fmtIn(loaded.height, effectiveTarget || 1)} in
            </p>
          </div>

          <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {tC("dpiNote")}
          </p>

          <button
            type="button"
            onClick={onApply}
            disabled={!effectiveTarget || effectiveTarget < 1}
            className="w-full rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {tC("dpiApply")}
          </button>
        </div>
      )}
    </div>
  );
}

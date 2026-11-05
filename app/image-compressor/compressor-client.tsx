"use client";

import { useTranslations } from "next-intl";
import { ImageToolWorkspace } from "@/components/tools/image-tool-workspace";
import { compressImage, type CompressOptions, type ImageFormat } from "@/features/image-processing";

export function CompressorClient() {
  const tC = useTranslations("Controls");
  const tTool = useTranslations("Tool");
  return (
    <ImageToolWorkspace<CompressOptions>
      processFn={compressImage}
      operation="compress"
      defaultOptions={{ quality: 0.8 }}
      processLabel={tTool("image-compressor.action")}
      zipName="compressed-images.zip"
      renderParams={(options, setOptions, disabled) => (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <label className="block">
            <span className="text-sm font-medium">
              {tC("quality", { percent: Math.round(options.quality * 100) })}
            </span>
            <input
              type="range"
              min={0.4}
              max={0.95}
              step={0.05}
              value={options.quality}
              disabled={disabled}
              onChange={(e) => setOptions({ ...options, quality: Number(e.target.value) })}
              className="mt-2 w-full accent-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">{tC("qualityHint")}</p>
          </label>
          <label className="block">
            <span className="text-sm font-medium">{tC("outputFormat")}</span>
            <select
              value={options.format ?? "auto"}
              disabled={disabled}
              onChange={(e) =>
                setOptions({
                  ...options,
                  format: e.target.value === "auto" ? undefined : (e.target.value as ImageFormat),
                })
              }
              className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="auto">{tC("keepOriginal")}</option>
              <option value="jpeg">JPG</option>
              <option value="png">{tC("pngLabel")}</option>
              <option value="webp">WebP</option>
            </select>
            {options.format === "png" && (
              <p className="mt-1 text-xs text-muted-foreground">{tC("pngLossless")}</p>
            )}
          </label>
        </div>
      )}
    />
  );
}

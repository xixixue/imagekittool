"use client";

import { useTranslations } from "next-intl";
import { ImageToolWorkspace } from "@/components/tools/image-tool-workspace";
import {
  WATERMARK_ANCHORS,
  composeWatermark,
  watermarkImage,
  type ImageFormat,
  type WatermarkAnchor,
  type WatermarkOptions,
} from "@/features/image-processing";
import { cn } from "@/lib/utils";

export function WatermarkClient() {
  const tC = useTranslations("Controls");
  const tTool = useTranslations("Tool");
  return (
    <ImageToolWorkspace<WatermarkOptions>
      processFn={watermarkImage}
      operation="watermark"
      defaultOptions={{
        text: "© Your Name",
        fontSize: 36,
        color: "#ffffff",
        opacity: 0.6,
        position: "bottom-right",
        angle: 0,
        repeat: false,
        margin: 24,
      }}
      processLabel={tTool("watermark-image.action")}
      zipName="watermarked-images.zip"
      composePreview={composeWatermark}
      scalePreviewOptions={(opts, s) => ({
        ...opts,
        fontSize: opts.fontSize * s,
        margin: opts.margin * s,
      })}
      renderParams={(options, setOptions, disabled) => (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <label className="block">
            <span className="text-sm font-medium">{tC("watermarkText")}</span>
            <input
              type="text"
              value={options.text}
              disabled={disabled}
              onChange={(e) => setOptions({ ...options, text: e.target.value })}
              className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">
                {tC("fontSize")}: {options.fontSize}
              </span>
              <input
                type="range"
                min={10}
                max={140}
                step={1}
                value={options.fontSize}
                disabled={disabled}
                onChange={(e) => setOptions({ ...options, fontSize: Number(e.target.value) })}
                className="mt-2 w-full accent-primary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">{tC("color")}</span>
              <input
                type="color"
                value={options.color}
                disabled={disabled}
                onChange={(e) => setOptions({ ...options, color: e.target.value })}
                className="mt-2 block h-9 w-16 rounded border border-border bg-background"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">
                {tC("opacity", { percent: Math.round(options.opacity * 100) })}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={options.opacity}
                disabled={disabled}
                onChange={(e) => setOptions({ ...options, opacity: Number(e.target.value) })}
                className="mt-2 w-full accent-primary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">{tC("angle", { value: options.angle })}</span>
              <input
                type="range"
                min={-45}
                max={45}
                step={1}
                value={options.angle}
                disabled={disabled}
                onChange={(e) => setOptions({ ...options, angle: Number(e.target.value) })}
                className="mt-2 w-full accent-primary"
              />
            </label>
          </div>
          <div>
            <span className="text-sm font-medium">{tC("position")}</span>
            <div className="mt-2 grid w-40 grid-cols-3 gap-1">
              {WATERMARK_ANCHORS.map((a) => (
                <button
                  key={a}
                  type="button"
                  disabled={disabled}
                  aria-label={a}
                  onClick={() => setOptions({ ...options, position: a as WatermarkAnchor })}
                  className={cn(
                    "h-8 rounded border transition-colors",
                    options.position === a
                      ? "border-primary bg-primary/15"
                      : "border-border hover:bg-muted",
                  )}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options.repeat}
              disabled={disabled}
              onChange={(e) => setOptions({ ...options, repeat: e.target.checked })}
              className="accent-primary"
            />
            <span className="text-sm">{tC("repeat")}</span>
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
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </label>
        </div>
      )}
    />
  );
}

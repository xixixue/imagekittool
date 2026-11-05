"use client";

import { useTranslations } from "next-intl";
import { ImageToolWorkspace } from "@/components/tools/image-tool-workspace";
import {
  RESIZE_PRESETS,
  resizeImage,
  type DecodedImage,
  type ImageFormat,
  type ProcessResult,
  type ResizeOptions,
} from "@/features/image-processing";

type ResizerOptions = ResizeOptions & { mode: "pixels" | "percent" | "preset" };

const process = (image: DecodedImage, opts: ResizerOptions): Promise<ProcessResult> =>
  resizeImage(image, opts);

export function ResizerClient() {
  const tC = useTranslations("Controls");
  const tTool = useTranslations("Tool");
  return (
    <ImageToolWorkspace<ResizerOptions>
      processFn={process}
      operation="resize"
      defaultOptions={{ mode: "pixels", lockAspect: true, targetWidth: 1280, targetHeight: 720 }}
      processLabel={tTool("image-resizer.action")}
      zipName="resized-images.zip"
      renderParams={(options, setOptions, disabled) => (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <label className="block">
            <span className="text-sm font-medium">{tC("mode")}</span>
            <select
              value={options.mode}
              disabled={disabled}
              onChange={(e) => {
                const mode = e.target.value as ResizerOptions["mode"];
                if (mode === "percent") {
                  setOptions({
                    mode,
                    lockAspect: true,
                    percent: 50,
                    targetWidth: undefined,
                    targetHeight: undefined,
                  });
                } else if (mode === "preset") {
                  setOptions({
                    mode,
                    lockAspect: true,
                    targetWidth: RESIZE_PRESETS[0].width,
                    targetHeight: RESIZE_PRESETS[0].height,
                    percent: undefined,
                  });
                } else {
                  setOptions({
                    mode,
                    lockAspect: true,
                    targetWidth: 1280,
                    targetHeight: 720,
                    percent: undefined,
                  });
                }
              }}
              className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="pixels">{tC("byPixels")}</option>
              <option value="percent">{tC("byPercent")}</option>
              <option value="preset">{tC("preset")}</option>
            </select>
          </label>

          {options.mode === "pixels" && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium">{tC("width")}</span>
                <input
                  type="number"
                  min={1}
                  value={options.targetWidth ?? ""}
                  disabled={disabled}
                  onChange={(e) =>
                    setOptions({ ...options, targetWidth: Number(e.target.value) || undefined })
                  }
                  className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">{tC("height")}</span>
                <input
                  type="number"
                  min={1}
                  value={options.targetHeight ?? ""}
                  disabled={disabled}
                  onChange={(e) =>
                    setOptions({ ...options, targetHeight: Number(e.target.value) || undefined })
                  }
                  className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.lockAspect}
                  disabled={disabled}
                  onChange={(e) => setOptions({ ...options, lockAspect: e.target.checked })}
                  className="accent-primary"
                />
                <span className="text-sm">{tC("lockAspect")}</span>
              </label>
            </div>
          )}

          {options.mode === "percent" && (
            <label className="block">
              <span className="text-sm font-medium">
                {tC("scale", { percent: options.percent ?? 100 })}
              </span>
              <input
                type="range"
                min={1}
                max={200}
                step={1}
                value={options.percent ?? 100}
                disabled={disabled}
                onChange={(e) => setOptions({ ...options, percent: Number(e.target.value) })}
                className="mt-2 w-full accent-primary"
              />
            </label>
          )}

          {options.mode === "preset" && (
            <label className="block">
              <span className="text-sm font-medium">{tC("preset")}</span>
              <select
                value={`${options.targetWidth}x${options.targetHeight}`}
                disabled={disabled}
                onChange={(e) => {
                  const p =
                    RESIZE_PRESETS.find((pr) => `${pr.width}x${pr.height}` === e.target.value) ??
                    RESIZE_PRESETS[0];
                  setOptions({ ...options, targetWidth: p.width, targetHeight: p.height });
                }}
                className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {RESIZE_PRESETS.map((p) => (
                  <option key={p.label} value={`${p.width}x${p.height}`}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          )}

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

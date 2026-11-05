"use client";

import { useTranslations } from "next-intl";
import { ImageToolWorkspace } from "@/components/tools/image-tool-workspace";
import { composeRotate, rotateImage, rotatedSize, type ImageFormat, type RotateOptions } from "@/features/image-processing";
import { cn } from "@/lib/utils";

const ANGLES = [0, 90, 180, 270] as const;

export function RotateClient() {
  const tC = useTranslations("Controls");
  const tTool = useTranslations("Tool");
  return (
    <ImageToolWorkspace<RotateOptions>
      processFn={rotateImage}
      operation="rotate"
      defaultOptions={{ angle: 0, flipH: false, flipV: false }}
      processLabel={tTool("rotate-image.action")}
      zipName="rotated-images.zip"
      composePreview={composeRotate}
      previewSize={(w, h, opts) => rotatedSize(w, h, opts.angle)}
      renderParams={(options, setOptions, disabled) => (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div>
            <span className="text-sm font-medium">{tC("rotation")}</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {ANGLES.map((a) => (
                <button
                  key={a}
                  type="button"
                  disabled={disabled}
                  onClick={() => setOptions({ ...options, angle: a })}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm transition-colors",
                    options.angle === a
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {a}°
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.flipH}
                disabled={disabled}
                onChange={(e) => setOptions({ ...options, flipH: e.target.checked })}
                className="accent-primary"
              />
              <span className="text-sm">{tC("flipH")}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.flipV}
                disabled={disabled}
                onChange={(e) => setOptions({ ...options, flipV: e.target.checked })}
                className="accent-primary"
              />
              <span className="text-sm">{tC("flipV")}</span>
            </label>
          </div>
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

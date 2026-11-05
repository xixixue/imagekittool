"use client";

import { useTranslations } from "next-intl";
import { ImageToolWorkspace } from "@/components/tools/image-tool-workspace";
import { composeMeme, memeImage, type ImageFormat, type MemeOptions } from "@/features/image-processing";

export function MemeClient() {
  const tC = useTranslations("Controls");
  const tTool = useTranslations("Tool");
  return (
    <ImageToolWorkspace<MemeOptions>
      processFn={memeImage}
      defaultOptions={{
        topText: "",
        bottomText: "",
        fontSize: 64,
        color: "#ffffff",
        strokeColor: "#000000",
      }}
      processLabel={tTool("meme-generator.action")}
      zipName="memes.zip"
      composePreview={composeMeme}
      scalePreviewOptions={(opts, s) => ({ ...opts, fontSize: opts.fontSize * s })}
      renderParams={(options, setOptions, disabled) => (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <label className="block">
            <span className="text-sm font-medium">{tC("topText")}</span>
            <input
              type="text"
              value={options.topText}
              disabled={disabled}
              onChange={(e) => setOptions({ ...options, topText: e.target.value })}
              className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">{tC("bottomText")}</span>
            <input
              type="text"
              value={options.bottomText}
              disabled={disabled}
              onChange={(e) => setOptions({ ...options, bottomText: e.target.value })}
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
                min={16}
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
              <span className="text-sm font-medium">{tC("strokeColor")}</span>
              <input
                type="color"
                value={options.strokeColor}
                disabled={disabled}
                onChange={(e) => setOptions({ ...options, strokeColor: e.target.value })}
                className="mt-2 block h-9 w-16 rounded border border-border bg-background"
              />
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

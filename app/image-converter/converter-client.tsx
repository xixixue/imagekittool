"use client";

import { useTranslations } from "next-intl";
import { ImageToolWorkspace } from "@/components/tools/image-tool-workspace";
import {
  SUPPORTED_FORMATS,
  convertImage,
  type ConvertOptions,
  type ImageFormat,
} from "@/features/image-processing";

export function ConverterClient() {
  const tC = useTranslations("Controls");
  const tTool = useTranslations("Tool");
  return (
    <ImageToolWorkspace<ConvertOptions>
      processFn={convertImage}
      defaultOptions={{ format: "webp", background: "#ffffff" }}
      processLabel={tTool("image-converter.action")}
      zipName="converted-images.zip"
      renderParams={(options, setOptions, disabled) => (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <label className="block">
            <span className="text-sm font-medium">{tC("outputFormat")}</span>
            <select
              value={options.format}
              disabled={disabled}
              onChange={(e) => setOptions({ ...options, format: e.target.value as ImageFormat })}
              className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {SUPPORTED_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f === "jpeg" ? "JPG" : f.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          {options.format === "jpeg" && (
            <label className="block">
              <span className="text-sm font-medium">{tC("background")}</span>
              <input
                type="color"
                value={options.background ?? "#ffffff"}
                disabled={disabled}
                onChange={(e) => setOptions({ ...options, background: e.target.value })}
                className="mt-2 block h-9 w-16 rounded border border-border bg-background"
              />
              <p className="mt-1 text-xs text-muted-foreground">{tC("bgHint")}</p>
            </label>
          )}
        </div>
      )}
    />
  );
}

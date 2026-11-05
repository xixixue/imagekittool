"use client";

import { useTranslations } from "next-intl";
import { ImageToolWorkspace } from "@/components/tools/image-tool-workspace";
import { compressImageToKb, type CompressToKbOptions } from "@/features/image-processing";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "50 KB", bytes: 50 * 1024 },
  { label: "100 KB", bytes: 100 * 1024 },
  { label: "200 KB", bytes: 200 * 1024 },
  { label: "500 KB", bytes: 500 * 1024 },
  { label: "1 MB", bytes: 1024 * 1024 },
];

export function CompressToKbClient() {
  const tC = useTranslations("Controls");
  const tTool = useTranslations("Tool");
  return (
    <ImageToolWorkspace<CompressToKbOptions>
      processFn={compressImageToKb}
      operation="compress"
      defaultOptions={{ targetBytes: 100 * 1024, allowFormatChange: true }}
      processLabel={tTool("compress-image-to-kb.action")}
      zipName="compressed-to-kb.zip"
      renderParams={(options, setOptions, disabled) => (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div>
            <span className="text-sm font-medium">{tC("targetSize")}</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  disabled={disabled}
                  onClick={() => setOptions({ ...options, targetBytes: p.bytes })}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm transition-colors",
                    options.targetBytes === p.bytes
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-medium">{tC("customTarget")}</span>
            <input
              type="number"
              min={1}
              value={Math.round(options.targetBytes / 1024)}
              disabled={disabled}
              onChange={(e) =>
                setOptions({
                  ...options,
                  targetBytes: Math.max(1, Number(e.target.value) || 1) * 1024,
                })
              }
              className="mt-2 block w-40 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options.allowFormatChange !== false}
              disabled={disabled}
              onChange={(e) => setOptions({ ...options, allowFormatChange: e.target.checked })}
              className="accent-primary"
            />
            <span className="text-sm">{tC("allowFormatChange")}</span>
          </label>
          <p className="text-xs text-muted-foreground">{tC("boundedSearchNote")}</p>
        </div>
      )}
    />
  );
}

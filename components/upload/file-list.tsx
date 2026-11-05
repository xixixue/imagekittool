"use client";

import { useTranslations } from "next-intl";
import { SaveToCloudButton } from "@/components/cloud/save-to-cloud-button";
import { useCloudStatus } from "@/hooks/use-cloud-status";
import { formatBytes } from "@/features/image-processing";
import type { WorkspaceItem } from "@/hooks/use-image-tool-workspace";
import { cn } from "@/lib/utils";

interface FileListProps {
  items: WorkspaceItem[];
  onDownload: (id: string) => void;
  onRemove: (id: string) => void;
}

export function FileList({ items, onDownload, onRemove }: FileListProps) {
  const tFile = useTranslations("FileList");
  const tWork = useTranslations("Workspace");
  const { status } = useCloudStatus();
  const cloudReady = status === "ready";
  if (items.length === 0) return null;
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {items.map((it) => {
        const saved =
          it.result && it.originalSize > it.result.sizeBytes
            ? Math.round((1 - it.result.sizeBytes / it.originalSize) * 100)
            : null;
        return (
          <li key={it.id} className="flex items-center gap-3 p-3.5">
            {it.previewUrl ? (
              // Local blob preview; next/image is not appropriate for object URLs.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={it.previewUrl}
                alt={it.file.name}
                className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover"
              />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-lg border border-border bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{it.file.name}</p>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {it.status === "invalid" || it.status === "error" ? (
                  <span className="text-destructive">{it.error ?? tFile("error")}</span>
                ) : it.status === "done" && it.result ? (
                  <span>
                    {formatBytes(it.originalSize)} → {formatBytes(it.result.sizeBytes)}
                    {saved !== null && saved > 0 ? (
                      <span className="ml-1 font-medium text-emerald-600 dark:text-emerald-400">
                        · {tFile("saved", { percent: saved })}
                      </span>
                    ) : null}
                    {it.result.width ? ` · ${it.result.width}×${it.result.height}` : ""}
                  </span>
                ) : it.status === "processing" ? (
                  <span>{tFile("processing")}</span>
                ) : (
                  <span>{formatBytes(it.originalSize)}</span>
                )}
              </div>
              {it.note && (
                <p
                  className={cn(
                    "mt-1 text-xs",
                    it.metTarget ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {it.note}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {cloudReady && (
                <SaveToCloudButton
                  blob={it.file}
                  fileName={it.file.name}
                  mimeType={it.file.type}
                  category="ORIGINAL"
                />
              )}
              {cloudReady && it.status === "done" && it.result && (
                <SaveToCloudButton
                  blob={it.result.blob}
                  fileName={it.result.filename}
                  mimeType={it.result.blob.type}
                  category="PROCESSED"
                />
              )}
              {it.status === "done" && it.result && (
                <button
                  onClick={() => onDownload(it.id)}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  {tWork("download")}
                </button>
              )}
              <button
                onClick={() => onRemove(it.id)}
                aria-label={tWork("remove")}
                className="rounded-lg px-1.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
              >
                ✕
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

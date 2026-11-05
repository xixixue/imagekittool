"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCloudStatus } from "@/hooks/use-cloud-status";
import { formatBytes } from "@/features/image-processing";
import type { OperationType } from "@/features/cloud-storage/types";
import { AccountSubNav } from "./account-subnav";

interface CloudFile {
  id: string;
  originalName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  category: string;
  operationType: OperationType | null;
  status: string;
  createdAt: string;
  thumbnailUrl?: string;
}

export function CloudFilesClient() {
  const t = useTranslations("Cloud");
  const { status, refresh } = useCloudStatus();
  const [files, setFiles] = useState<CloudFile[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadFiles = useCallback(async () => {
    const r = await fetch("/api/cloud/files", { cache: "no-store" });
    if (r.ok) {
      const data = await r.json();
      setFiles(data.files as CloudFile[]);
    } else {
      setFiles([]);
    }
  }, []);

  useEffect(() => {
    if (status === "ready") loadFiles();
  }, [status, loadFiles]);

  const onDownload = async (f: CloudFile) => {
    setBusyId(f.id);
    setError("");
    try {
      const r = await fetch(`/api/cloud/files/${f.id}/download-url`, { method: "POST" });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setError(data.error ?? "Download failed.");
        return;
      }
      const { url } = await r.json();
      const a = document.createElement("a");
      a.href = url;
      a.download = f.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (f: CloudFile) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setBusyId(f.id);
    setError("");
    try {
      const r = await fetch(`/api/cloud/files/${f.id}`, { method: "DELETE" });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setError(data.error ?? "Delete failed.");
        return;
      }
      await loadFiles();
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  const categoryLabel = (c: string) =>
    c === "ORIGINAL" ? t("original") : c === "PROCESSED" ? t("processed") : c;

  // Operation-type label (which tool produced a PROCESSED file). Falls back to
  // null for originals / legacy rows, in which case the category label is shown.
  const operationLabel = (op: OperationType | null): string | null => {
    if (!op) return null;
    const labels: Record<OperationType, string> = {
      compress: t("opCompress"),
      resize: t("opResize"),
      convert: t("opConvert"),
      rotate: t("opRotate"),
      watermark: t("opWatermark"),
      meme: t("opMeme"),
      other: t("opOther"),
    };
    return labels[op];
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <AccountSubNav />
      <h1 className="text-2xl font-bold tracking-tight">{t("filesTitle")}</h1>

      {status !== "ready" && (
        <p className="text-sm text-muted-foreground">
          {status === "disabled" ? t("unavailable") : t("loading")}
        </p>
      )}

      {status === "ready" && files === null && (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      )}

      {status === "ready" && files !== null && files.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}

      {status === "ready" && files !== null && files.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 p-3.5">
              {f.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- presigned object-storage URL; no Next/Image optimizer for private bucket objects
                <img
                  src={f.thumbnailUrl}
                  alt={f.originalName}
                  loading="lazy"
                  className="h-11 w-11 shrink-0 rounded-lg border border-border object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-[10px] font-semibold uppercase text-muted-foreground">
                  {f.extension || "file"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{f.originalName}</p>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {operationLabel(f.operationType) ?? categoryLabel(f.category)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatBytes(f.sizeBytes)} · {new Date(f.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDownload(f)}
                  disabled={busyId === f.id}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
                >
                  {busyId === f.id ? t("downloading") : t("download")}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(f)}
                  disabled={busyId === f.id}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-60"
                >
                  {busyId === f.id ? t("deleting") : t("delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCloudStatus } from "@/hooks/use-cloud-status";
import { formatBytes } from "@/features/image-processing";
import { AccountSubNav } from "./account-subnav";

interface CloudFile {
  id: string;
  originalName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  category: string;
  status: string;
  createdAt: string;
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
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.originalName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatBytes(f.sizeBytes)} · {categoryLabel(f.category)} ·{" "}
                  {new Date(f.createdAt).toLocaleDateString()}
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

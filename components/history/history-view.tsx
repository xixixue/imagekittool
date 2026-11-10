"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  clearLocalHistory,
  loadLocalHistory,
  removeLocalHistory,
  type CloudHistoryEntry,
  type HistoryEntry,
} from "@/features/history";
import { cn } from "@/lib/utils";

/** Render a tool slug as a friendly label without an i18n lookup (avoids
 * MISSING_MESSAGE throws for unknown slugs). Tool names are brand-like and
 * locale-stable enough for a utility page. */
function prettifyTool(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function MetaSummary({ entry }: { entry: { inputMeta: HistoryEntry["inputMeta"]; outputMeta: HistoryEntry["outputMeta"] } }) {
  const i = entry.inputMeta;
  const o = entry.outputMeta;
  return (
    <span className="text-sm text-muted-foreground">
      {i.formats.join(", ")} · {i.sizeBuckets.join(", ")}
      {" → "}
      {o.formats.join(", ")} · {o.sizeBuckets.join(", ")}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function HistoryView() {
  const t = useTranslations("History");
  const [tab, setTab] = useState<"local" | "cloud">("local");

  const [local, setLocal] = useState<HistoryEntry[]>([]);
  const [cloud, setCloud] = useState<CloudHistoryEntry[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  const refreshLocal = useCallback(() => {
    setLocal(loadLocalHistory());
  }, []);

  const refreshCloud = useCallback(async () => {
    setCloudLoading(true);
    setCloudError(null);
    try {
      const res = await fetch("/api/history", { cache: "no-store" });
      if (!res.ok) {
        setCloudError(t("errorCloud"));
        setCloud([]);
        return;
      }
      const data = (await res.json()) as { entries: CloudHistoryEntry[] };
      setCloud(data.entries ?? []);
    } catch {
      setCloudError(t("errorCloud"));
      setCloud([]);
    } finally {
      setCloudLoading(false);
      setCloudLoaded(true);
    }
  }, [t]);

  useEffect(() => {
    refreshLocal();
  }, [refreshLocal]);

  useEffect(() => {
    if (tab === "cloud" && !cloudLoaded && !cloudLoading) {
      void refreshCloud();
    }
  }, [tab, cloudLoaded, cloudLoading, refreshCloud]);

  const saveToCloud = useCallback(async (entry: HistoryEntry) => {
    setSavingId(entry.id);
    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolType: entry.toolType,
          inputMeta: entry.inputMeta,
          outputMeta: entry.outputMeta,
          parameters: entry.parameters,
        }),
      });
      if (res.ok) {
        setSavedIds((prev) => new Set(prev).add(entry.id));
      }
    } finally {
      setSavingId(null);
    }
  }, []);

  const deleteLocal = useCallback(
    (id: string) => {
      removeLocalHistory(id);
      refreshLocal();
    },
    [refreshLocal],
  );

  const deleteCloud = useCallback(
    async (id: string) => {
      if (!window.confirm(t("confirmDelete"))) return;
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCloud((prev) => prev.filter((e) => e.cloudId !== id));
      }
    },
    [t],
  );

  const clearAllLocal = useCallback(() => {
    clearLocalHistory();
    refreshLocal();
  }, [refreshLocal]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <TabButton active={tab === "local"} onClick={() => setTab("local")}>
          {t("tabLocal")}
        </TabButton>
        <TabButton active={tab === "cloud"} onClick={() => setTab("cloud")}>
          {t("tabCloud")}
        </TabButton>
      </div>

      {tab === "local" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{t("localNote")}</p>
            {local.length > 0 && (
              <button
                onClick={clearAllLocal}
                className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                {t("clearAll")}
              </button>
            )}
          </div>
          {local.length === 0 ? (
            <EmptyState text={t("emptyLocal")} />
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {local.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{prettifyTool(entry.toolType)}</span>
                      <span className="text-xs text-muted-foreground">
                        {t("files", { count: entry.inputMeta.count })}
                      </span>
                    </div>
                    <MetaSummary entry={entry} />
                    <div className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {savedIds.has(entry.id) ? (
                      <span className="text-sm text-muted-foreground">{t("saved")}</span>
                    ) : (
                      <button
                        onClick={() => saveToCloud(entry)}
                        disabled={savingId === entry.id}
                        className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-50"
                      >
                        {t("saveToCloud")}
                      </button>
                    )}
                    <button
                      onClick={() => deleteLocal(entry.id)}
                      className="rounded-md px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      {t("delete")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{t("cloudNote")}</p>
          {cloudLoading ? (
            <p className="text-sm text-muted-foreground">{t("loadingCloud")}</p>
          ) : cloudError ? (
            <EmptyState text={cloudError} />
          ) : cloud.length === 0 ? (
            <EmptyState text={t("emptyCloud")} />
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {cloud.map((entry) => (
                <li key={entry.cloudId} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{prettifyTool(entry.toolType)}</span>
                      <span className="text-xs text-muted-foreground">
                        {t("files", { count: entry.inputMeta.count })}
                      </span>
                    </div>
                    <MetaSummary entry={entry} />
                    <div className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</div>
                  </div>
                  <button
                    onClick={() => deleteCloud(entry.cloudId)}
                    className="rounded-md px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    {t("delete")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm transition-colors",
        active ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

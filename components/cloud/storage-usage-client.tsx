"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCloudStatus } from "@/hooks/use-cloud-status";
import { formatBytes } from "@/features/image-processing";
import { AccountSubNav } from "./account-subnav";

export function StorageUsageClient() {
  const t = useTranslations("Cloud");
  const { status, usage, refresh } = useCloudStatus();
  const [cleanupMsg, setCleanupMsg] = useState("");
  const [cleaning, setCleaning] = useState(false);

  const onCleanup = async () => {
    setCleaning(true);
    setCleanupMsg("");
    try {
      const r = await fetch("/api/cloud/storage/cleanup", { method: "POST" });
      if (!r.ok) {
        setCleanupMsg("Cleanup failed.");
        return;
      }
      const data = await r.json();
      setCleanupMsg(t("cleanupDone", { tasks: data.expiredTasks, objects: data.orphanObjects }));
      refresh();
    } finally {
      setCleaning(false);
    }
  };

  const usedPct =
    usage && usage.quotaBytes > 0
      ? Math.min(100, Math.round((usage.usedBytes / usage.quotaBytes) * 100))
      : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <AccountSubNav />
      <h1 className="text-2xl font-bold tracking-tight">{t("storageTitle")}</h1>

      {status !== "ready" && (
        <p className="text-sm text-muted-foreground">
          {status === "disabled" ? t("unavailable") : t("loading")}
        </p>
      )}

      {status === "ready" && usage && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{t("used")}</span>
              <span>
                {formatBytes(usage.usedBytes)} / {formatBytes(usage.quotaBytes)}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{t("available")}</dt>
              <dd className="font-medium">{formatBytes(usage.availableBytes)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("reserved")}</dt>
              <dd className="font-medium">{formatBytes(usage.reservedBytes)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("quota")}</dt>
              <dd className="font-medium">{formatBytes(usage.quotaBytes)}</dd>
            </div>
          </dl>
          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={onCleanup}
              disabled={cleaning}
              className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-60"
            >
              {cleaning ? t("cleaning") : t("cleanup")}
            </button>
            {cleanupMsg && <p className="mt-2 text-xs text-muted-foreground">{cleanupMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

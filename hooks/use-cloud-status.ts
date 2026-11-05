"use client";

import { useCallback, useEffect, useState } from "react";

export interface CloudUsage {
  quotaBytes: number;
  usedBytes: number;
  reservedBytes: number;
  availableBytes: number;
}

export type CloudStatus = "loading" | "anonymous" | "disabled" | "ready";

/**
 * Reports cloud-storage availability for the current session:
 * - `anonymous`  — not signed in (401).
 * - `disabled`   — signed in but no storage adapter configured (503).
 * - `ready`      — signed in and storage available, with usage figures.
 * - `loading`    — initial fetch in flight.
 */
export function useCloudStatus() {
  const [status, setStatus] = useState<CloudStatus>("loading");
  const [usage, setUsage] = useState<CloudUsage | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    fetch("/api/cloud/storage/usage", { cache: "no-store" })
      .then(async (r) => {
        if (!active) return;
        if (r.status === 401) {
          setStatus("anonymous");
          return;
        }
        if (r.status === 503) {
          setStatus("disabled");
          return;
        }
        if (r.ok) {
          setUsage(await r.json());
          setStatus("ready");
          return;
        }
        setStatus("disabled");
      })
      .catch(() => {
        if (active) setStatus("disabled");
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return { status, usage, refresh };
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { uploadToCloud } from "@/lib/cloud/client";
import type { OperationType } from "@/features/cloud-storage/types";

interface SaveToCloudButtonProps {
  blob: Blob;
  fileName: string;
  mimeType?: string;
  category: "ORIGINAL" | "PROCESSED";
  /** For PROCESSED results: the tool that produced this file. */
  operationType?: OperationType;
  onSaved?: () => void;
}

type State = "idle" | "saving" | "saved" | "error";

/**
 * Saves a single blob (original or processed image) to the user's private cloud
 * via the browser-direct upload flow. Only rendered for signed-in users with
 * storage enabled (SPEC §6.2: cloud save is a logged-in capability).
 */
export function SaveToCloudButton({
  blob,
  fileName,
  mimeType,
  category,
  operationType,
  onSaved,
}: SaveToCloudButtonProps) {
  const t = useTranslations("Cloud");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  const onSave = async () => {
    setState("saving");
    setError("");
    try {
      await uploadToCloud(blob, {
        fileName,
        mimeType: mimeType || blob.type || "application/octet-stream",
        category,
        operationType,
      });
      setState("saved");
      onSaved?.();
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
  };

  if (state === "saved") {
    return <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t("saved")}</span>;
  }

  const label = category === "ORIGINAL" ? t("saveOriginal") : t("saveResult");
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={state === "saving"}
      title={state === "error" ? error : undefined}
      className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
    >
      {state === "saving" ? t("saving") : label}
      {state === "error" ? " ⚠" : ""}
    </button>
  );
}

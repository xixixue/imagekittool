"use client";

import { useTranslations } from "next-intl";

interface DownloadButtonsProps {
  onDownloadZip: () => void;
  onClear: () => void;
  disabled: boolean;
  count: number;
}

export function DownloadButtons({ onDownloadZip, onClear, disabled, count }: DownloadButtonsProps) {
  const t = useTranslations("Workspace");
  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onDownloadZip}
        disabled={disabled || count === 0}
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow disabled:opacity-50 disabled:shadow-none"
      >
        {t("downloadAll", { count })}
      </button>
      <button
        onClick={onClear}
        disabled={disabled}
        className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
      >
        {t("clearAll")}
      </button>
    </div>
  );
}

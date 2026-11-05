"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { CheckIcon, GlobeIcon } from "@/components/tools/tool-icon";
import { localeLabels, locales, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Header language switcher. Writes the chosen locale to a cookie and reloads so
 * the server re-renders with the new locale (and RTL direction for Arabic).
 */
export function LanguageSwitcher() {
  const current = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function select(next: Locale) {
    setOpen(false);
    if (next === current) return;
    document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
    // Full reload so <html lang/dir> and RTL CSS re-apply cleanly.
    window.location.reload();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Language"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
      >
        <GlobeIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{localeLabels[current]?.native ?? "English"}</span>
      </button>
      {open && (
        <ul className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg">
          {locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                onClick={() => select(l)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                  l === current && "font-semibold text-primary",
                )}
              >
                {localeLabels[l].native}
                {l === current && <CheckIcon className="h-4 w-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * AdSense publisher client ID (ca-pub-…). When unset, every <AdSlot/> renders
 * nothing, so the site ships no ad code before AdSense approval and in dev.
 * Set NEXT_PUBLIC_ADSENSE_CLIENT in production to enable ads.
 */
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

interface AdSlotProps {
  /** Ad unit slot ID (data-ad-slot) from your AdSense account. */
  slot: string;
  /** Ad format: "auto" (responsive), "horizontal", "rectangle", "vertical". */
  format?: "auto" | "horizontal" | "rectangle" | "vertical";
  className?: string;
}

/**
 * Compliant AdSense ad slot.
 *
 * Placement policy (see ADS.md):
 * - Only ever rendered inside content zones (tool SEO content, homepage
 *   sections) — never inside the tool workspace, so no ad sits near the
 *   upload / process / download buttons (misleading-placement policy).
 * - Labeled "Advertisement" with a dashed container and generous vertical
 *   margins for clear visual separation from interactive controls.
 * - A static in-content unit: no interstitial pop-up, no auto-refresh, never
 *   shown over a processing/result interface.
 * - Renders nothing until NEXT_PUBLIC_ADSENSE_CLIENT is configured.
 */
export function AdSlot({ slot, format = "auto", className }: AdSlotProps) {
  const t = useTranslations("Ads");

  useEffect(() => {
    if (!ADSENSE_CLIENT) return;
    try {
      // adsbygoogle is injected by the AdSense script loaded in <Analytics />.
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {
      // Script blocked or not yet loaded — fail silently.
    }
  }, []);

  if (!ADSENSE_CLIENT) return null;

  return (
    <aside
      aria-label={t("label")}
      className={cn(
        "my-10 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-5",
        className,
      )}
    >
      <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {t("label")}
      </p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  );
}

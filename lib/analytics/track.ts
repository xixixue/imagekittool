"use client";

/**
 * GA4 dataLayer adapter (SPEC V2 §13).
 *
 * Pushes events to `window.dataLayer` (consumed by the GA4 gtag snippet loaded
 * by <Analytics/>). No-op during SSR and when NEXT_PUBLIC_GA_MEASUREMENT_ID is
 * unset — so the site runs zero analytics until the operator configures GA4
 * (V2 §1.1, §13: no third-party requests without explicit configuration).
 *
 * Callers must pass only privacy-safe attributes (use the builders in
 * events.ts). Never image content, file names, EXIF/GPS, or personal data.
 */
type TrackPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function track(event: string, payload: TrackPayload = {}): void {
  if (typeof window === "undefined") return;
  if (!GA_ID) return;
  const dataLayer = window.dataLayer ?? (window.dataLayer = []);
  dataLayer.push({ event, ...payload });
}

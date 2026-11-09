import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Production security headers (SPEC §12, §17 Phase 4). Applied to every route.
 * - HSTS, nosniff, frame-ancestors none, Referrer-Policy, Permissions-Policy.
 * - A pragmatic Content-Security-Policy: 'self' by default, inline styles
 *   permitted (Tailwind + Next inject runtime styles), blobs/data for locally
 *   processed images, and cross-origin https for presigned R2 uploads/downloads.
 *   Analytics/script sources are added only when their env IDs are present
 *   (AGENTS: no third-party loads without explicit configuration).
 *
 * NOTE: scripts allow 'unsafe-inline' for now (next/script inline payloads). A
 * nonce-based CSP is a future hardening item and does not block launch.
 */
async function securityHeaders() {
  // Accumulate per-category origins instead of pushing separate directives:
  // CSP ignores duplicate directives (only the first wins), so a single
  // script-src-elem / frame-src directive must list every configured source.
  const scriptSrcElemExtra: string[] = [];
  const frameSrcExtra: string[] = [];

  if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    scriptSrcElemExtra.push("https://www.googletagmanager.com", "https://www.google-analytics.com");
  }
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    scriptSrcElemExtra.push("https://browser.sentry-cdn.com");
  }
  if (process.env.NEXT_PUBLIC_ADSENSE_CLIENT) {
    // AdSense loader + creatives (iframes + impression pixels).
    scriptSrcElemExtra.push("https://pagead2.googlesyndication.com");
    frameSrcExtra.push(
      "https://googleads.g.doubleclick.net",
      "https://*.googleads.g.doubleclick.net",
      "https://pagead2.googlesyndication.com",
      "https://tpc.googlesyndication.com",
    );
  }

  const scriptSrcElem = `script-src-elem 'self' 'unsafe-inline'${
    scriptSrcElemExtra.length ? ` ${scriptSrcElemExtra.join(" ")}` : ""
  }`;

  const cspParts: string[] = [
    "default-src 'self'",
    // Images: same-origin, data:/blob: (local processing), any https (presigned R2 GETs).
    "img-src 'self' data: blob: https:",
    // Styles: Tailwind + Next runtime inject inline styles.
    "style-src 'self' 'unsafe-inline'",
    // Scripts: self + inline payloads; analytics/ad sources added conditionally.
    "script-src 'self' 'unsafe-inline'",
    scriptSrcElem,
    // Connect: same-origin API + presigned R2 PUT/GET + analytics/sentry/ad beacons.
    "connect-src 'self' https:",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  // AdSense renders ad creatives inside iframes; allow them only when enabled.
  if (frameSrcExtra.length) {
    cspParts.push(`frame-src 'self' ${frameSrcExtra.join(" ")}`);
  }

  return [
    {
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
        },
        { key: "Content-Security-Policy", value: cspParts.join("; ") },
      ],
    },
  ];
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Core local tools must work even when object storage is not configured.
  // Cloud features degrade gracefully (showed as unavailable) rather than failing startup.
  headers: securityHeaders,
};

export default withNextIntl(nextConfig);

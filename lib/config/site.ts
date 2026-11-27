/**
 * Owner-provided ad / analytics / verification identifiers for imagekittool.com.
 *
 * These are PUBLIC identifiers — an AdSense publisher client ID, a GTM container
 * ID, and a Google Search Console verification token — not secrets. AdSense and
 * GTM require them client-side, so they ship in the browser bundle by design
 * (they are visible in any AdSense-enabled site's page source).
 *
 * Sourced from the owner's ads-account configuration. Env vars override these
 * defaults so a different environment can swap or disable them. In production
 * (NODE_ENV === "production") the real IDs are the fallback, so the deployed
 * site carries the correct ads.txt record, AdSense verification <meta>, AdSense
 * loader, GTM container, and GSC verification without manual env setup. In
 * development the fallbacks are empty so no ad/tracking code runs locally.
 *
 * IMPORTANT: access `process.env.X` DIRECTLY (never via an intermediate
 * `const env = process.env` variable). Next.js's DefinePlugin only replaces
 * literal `process.env.X` tokens in the client bundle; an intermediate variable
 * leaves a bare `process` reference, which is undefined in the browser and
 * throws "process is not defined".
 *
 * AGENTS.md note: these values were provided by the owner (not fabricated).
 */
const isProd = process.env.NODE_ENV === "production";

/** Google AdSense publisher client ID (ca-pub-…). Empty → no AdSense code. */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? (isProd ? "ca-pub-1792545344328768" : "");

/** Google Tag Manager container ID (GTM-…). Empty → no GTM. */
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? (isProd ? "GTM-WBNRCNPZ" : "");

/** Google Analytics 4 measurement ID (G-…). Env-only; no production default. */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

/** Sentry browser DSN. Env-only. */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

/**
 * Google Search Console site-verification token (the content value of the
 * google-site-verification meta tag). Always present — it is a static
 * verification record, harmless in any environment.
 */
export const GSC_VERIFICATION = "w9bwL_DQph55bvYfoAeZKQLLgIqUh0PgadJ808_Kodk";

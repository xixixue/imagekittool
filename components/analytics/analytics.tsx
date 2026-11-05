"use client";

import Script from "next/script";

/**
 * Conditionally loads third-party analytics and monitoring scripts.
 *
 * Nothing is loaded unless the operator has provided the corresponding
 * NEXT_PUBLIC_* value. In development and before launch these are empty, so no
 * third-party script, cookie, or network request is introduced. This keeps the
 * privacy promise accurate: the site runs no analytics until explicitly
 * configured (see Privacy Policy and Cookie Policy).
 *
 * - GA4: Google Analytics 4, loaded via the gtag snippet.
 * - Sentry: browser error monitoring, loaded from the Sentry CDN.
 *
 * Server-side error capture via @sentry/nextjs is a production follow-up and
 * would use the (non-public) SENTRY_DSN; it is intentionally not added here to
 * avoid pulling a build-time dependency without owner configuration.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_VERSION = "8.49.0";

export function Analytics() {
  return (
    <>
      {GA_ID ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
          </Script>
        </>
      ) : null}

      {SENTRY_DSN ? (
        <>
          <Script
            src={`https://browser.sentry-cdn.com/${SENTRY_VERSION}/bundle.min.js`}
            strategy="afterInteractive"
          />
          <Script id="sentry-init" strategy="afterInteractive">
            {`Sentry.init({ dsn: '${SENTRY_DSN}' });`}
          </Script>
        </>
      ) : null}
    </>
  );
}

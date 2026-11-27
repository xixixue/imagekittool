"use client";

import Script from "next/script";
import {
  ADSENSE_CLIENT,
  GA_MEASUREMENT_ID,
  GTM_ID,
  SENTRY_DSN,
} from "@/lib/config/site";

/**
 * Conditionally loads third-party analytics, tag manager, and monitoring
 * scripts.
 *
 * Identifiers come from lib/config/site (owner-provided production defaults,
 * env-overridable). In development they are empty, so no third-party script,
 * cookie, or network request is introduced — keeping the privacy promise
 * accurate (see Privacy Policy and Cookie Policy).
 *
 * - GTM: Google Tag Manager container (gtm.js). Used for imagekittool.com.
 * - GA4: Google Analytics 4 via gtag (env-only; loaded only if configured).
 * - Sentry: browser error monitoring from the Sentry CDN.
 * - AdSense: the adsbygoogle loader. <AdSlot/> units push to
 *   window.adsbygoogle. In production the publisher ID is set by default.
 *
 * Server-side error capture via @sentry/nextjs is a production follow-up and
 * would use the (non-public) SENTRY_DSN; it is intentionally not added here to
 * avoid pulling a build-time dependency without owner configuration.
 */
const SENTRY_VERSION = "8.49.0";

export function Analytics() {
  return (
    <>
      {GTM_ID ? (
        <Script id="gtm-base" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      ) : null}

      {GA_MEASUREMENT_ID ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
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

      {ADSENSE_CLIENT ? (
        <Script
          id="adsbygoogle-js"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        />
      ) : null}
    </>
  );
}

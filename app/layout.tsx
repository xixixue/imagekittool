import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Analytics } from "@/components/analytics/analytics";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { localeLabels, type Locale } from "@/i18n/routing";
import { ADSENSE_CLIENT, GSC_VERIFICATION, GTM_ID } from "@/lib/config/site";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  const title = t("title");
  const description = t("description");
  // AdSense site-verification meta (reviewer requirement: AdSense verification
  // code in <head>). Emitted when a publisher client ID is configured (the
  // production default is set in lib/config/site). Renders as
  // <meta name="google-adsense-account" …>.
  // GSC verification renders as <meta name="google-site-verification" …>.
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ImageKitTools`,
    },
    description,
    keywords: [
      "image compressor",
      "image resizer",
      "image converter",
      "image cropper",
      "compress image to KB",
      "online image tools",
    ],
    authors: [{ name: "ImageKitTools" }],
    openGraph: {
      title,
      description,
      type: "website",
      url: siteUrl,
      siteName: "ImageKitTools",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: GSC_VERIFICATION,
    },
    ...(ADSENSE_CLIENT
      ? { other: { "google-adsense-account": ADSENSE_CLIENT } }
      : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale() as Locale;
  const messages = await getMessages();
  const dir = localeLabels[locale]?.dir ?? "ltr";
  return (
    <html lang={locale} dir={dir}>
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        {/* GTM noscript fallback — first in <body> per Google Tag Manager docs. */}
        {GTM_ID ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}

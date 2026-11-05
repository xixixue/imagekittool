import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Analytics } from "@/components/analytics/analytics";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { localeLabels, type Locale } from "@/i18n/routing";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  const title = t("title");
  const description = t("description");
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

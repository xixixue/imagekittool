import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { CompressorClient } from "./compressor-client";

export const metadata: Metadata = {
  title: "Image Compressor",
  description:
    "Compress JPG, PNG, and WebP images in your browser. Adjust quality, batch process, and download individually or as a ZIP. No upload required.",
  alternates: { canonical: "/image-compressor" },
};

// Tool pages are statically prerendered for fast TTFB and crawlable SEO content
// (SPEC V2 §9.2). The root layout still reads the locale cookie dynamically for
// the NextIntlClientProvider, so client-side tool controls localize per locale;
// the server-rendered header/SEO content is prerendered in the default locale
// (en), consistent with the guides pages.
export const dynamic = "force-static";

export default function ImageCompressorPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="image-compressor" />
      <CompressorClient />
      <PrivacyNote />
      <ToolSeoContent slug="image-compressor" />
    </div>
  );
}

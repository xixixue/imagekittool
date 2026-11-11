import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { FaviconGeneratorClient } from "./favicon-generator-client";

export const metadata: Metadata = {
  title: "Favicon Generator",
  description:
    "Generate a multi-size favicon package from one image — PNGs (16–512), a multi-size ICO, a web manifest, and an HTML snippet — all in your browser. Nothing is uploaded.",
  alternates: { canonical: "/favicon-generator" },
};

// Statically prerendered for fast TTFB + crawlable SEO (see image-compressor).

export default function FaviconGeneratorPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="favicon-generator" />
      <FaviconGeneratorClient />
      <PrivacyNote />
      <ToolSeoContent slug="favicon-generator" />
    </div>
  );
}

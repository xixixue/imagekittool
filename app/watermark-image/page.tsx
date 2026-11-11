import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { WatermarkClient } from "./watermark-client";

export const metadata: Metadata = {
  title: "Watermark Image",
  description:
    "Add a text watermark to JPG, PNG, and WebP images in your browser. Choose position, opacity, angle, or repeat as a tile. No upload required.",
  alternates: { canonical: "/watermark-image" },
};

// Statically prerendered for fast TTFB + crawlable SEO (see image-compressor).

export default function WatermarkImagePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="watermark-image" />
      <WatermarkClient />
      <PrivacyNote />
      <ToolSeoContent slug="watermark-image" />
    </div>
  );
}

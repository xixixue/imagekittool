import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { BlurClient } from "./blur-client";

export const metadata: Metadata = {
  title: "Blur Image",
  description:
    "Blur or pixelate regions of an image in your browser. Draw rectangles over faces, plates or any sensitive area. No upload required.",
  alternates: { canonical: "/blur-image" },
};

// Statically prerendered for fast TTFB + crawlable SEO (see image-compressor).

export default function BlurImagePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="blur-image" />
      <BlurClient />
      <PrivacyNote />
      <ToolSeoContent slug="blur-image" />
    </div>
  );
}

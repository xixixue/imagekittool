import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { RotateClient } from "./rotate-client";

export const metadata: Metadata = {
  title: "Rotate Image",
  description:
    "Rotate JPG, PNG, and WebP images by 90° steps and flip horizontally or vertically in your browser. Batch processing. No upload required.",
  alternates: { canonical: "/rotate-image" },
};

// Statically prerendered for fast TTFB + crawlable SEO (see image-compressor).

export default function RotateImagePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="rotate-image" />
      <RotateClient />
      <PrivacyNote />
      <ToolSeoContent slug="rotate-image" />
    </div>
  );
}

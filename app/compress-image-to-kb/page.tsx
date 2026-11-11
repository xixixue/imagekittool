import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { CompressToKbClient } from "./compress-to-kb-client";

export const metadata: Metadata = {
  title: "Compress Image to KB",
  description:
    "Compress an image to a target file size (50 KB, 100 KB, 200 KB, …) in your browser. A bounded quality search gets as close as possible and tells you honestly when a target can't be reached.",
  alternates: { canonical: "/compress-image-to-kb" },
};

// Statically prerendered for fast TTFB + crawlable SEO (see image-compressor).

export default function CompressImageToKbPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="compress-image-to-kb" />
      <CompressToKbClient />
      <PrivacyNote />
      <ToolSeoContent slug="compress-image-to-kb" />
    </div>
  );
}

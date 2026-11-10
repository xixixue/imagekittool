import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { DpiChangerClient } from "./dpi-changer-client";

export const metadata: Metadata = {
  title: "DPI Changer",
  description:
    "Change the DPI/PPI metadata of a JPEG or PNG losslessly — pixels and EXIF are preserved. Includes a print-size preview. Runs locally in your browser; nothing is uploaded.",
  alternates: { canonical: "/dpi-changer" },
};

// Statically prerendered for fast TTFB + crawlable SEO (see image-compressor).
export const dynamic = "force-static";

export default function DpiChangerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="dpi-changer" />
      <DpiChangerClient />
      <PrivacyNote />
      <ToolSeoContent slug="dpi-changer" />
    </div>
  );
}

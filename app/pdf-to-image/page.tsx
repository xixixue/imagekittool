import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { PdfToImageClient } from "./pdf-to-image-client";

export const metadata: Metadata = {
  title: "PDF to Image",
  description:
    "Convert PDF pages to PNG or JPG in your browser — choose a page range, DPI, and format, then download individually or as a ZIP. Rendered locally with pdf.js; nothing is uploaded.",
  alternates: { canonical: "/pdf-to-image" },
};

// Statically prerendered for fast TTFB + crawlable SEO (see image-compressor).

export default function PdfToImagePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="pdf-to-image" />
      <PdfToImageClient />
      <PrivacyNote />
      <ToolSeoContent slug="pdf-to-image" />
    </div>
  );
}

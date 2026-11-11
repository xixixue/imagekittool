import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { ImageToPdfClient } from "./image-to-pdf-client";

export const metadata: Metadata = {
  title: "Image to PDF",
  description:
    "Combine multiple images into one PDF in your browser — reorder pages, choose A4 or Letter, orientation, and margins. Generated locally with pdf-lib; nothing is uploaded.",
  alternates: { canonical: "/image-to-pdf" },
};

// Statically prerendered for fast TTFB + crawlable SEO (see image-compressor).

export default function ImageToPdfPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="image-to-pdf" />
      <ImageToPdfClient />
      <PrivacyNote />
      <ToolSeoContent slug="image-to-pdf" />
    </div>
  );
}

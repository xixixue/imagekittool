import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { ExifRemoverClient } from "./exif-remover-client";

export const metadata: Metadata = {
  title: "EXIF Remover",
  description:
    "Remove EXIF, IPTC, XMP and GPS metadata from a photo by re-encoding it in your browser. The output is verified to contain no metadata. The image is never uploaded.",
  alternates: { canonical: "/exif-remover" },
};

// Statically prerendered for fast TTFB + crawlable SEO (see image-compressor).

export default function ExifRemoverPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="exif-remover" />
      <ExifRemoverClient />
      <PrivacyNote />
      <ToolSeoContent slug="exif-remover" />
    </div>
  );
}

import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { ExifViewerClient } from "./exif-viewer-client";

export const metadata: Metadata = {
  title: "EXIF Viewer",
  description:
    "View the EXIF metadata of a photo — camera, lens, exposure, orientation, and GPS — parsed locally in your browser. The image is never uploaded.",
  alternates: { canonical: "/exif-viewer" },
};

// Statically prerendered for fast TTFB + crawlable SEO (see image-compressor).

export default function ExifViewerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="exif-viewer" />
      <ExifViewerClient />
      <PrivacyNote />
      <ToolSeoContent slug="exif-viewer" />
    </div>
  );
}

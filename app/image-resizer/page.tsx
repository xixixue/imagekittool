import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { ResizerClient } from "./resizer-client";

export const metadata: Metadata = {
  title: "Image Resizer",
  description:
    "Resize JPG, PNG, and WebP images by pixels, percentage, or presets in your browser. Lock aspect ratio and batch process. No upload required.",
  alternates: { canonical: "/image-resizer" },
};

export default function ImageResizerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="image-resizer" />
      <ResizerClient />
      <PrivacyNote />
      <ToolSeoContent slug="image-resizer" />
    </div>
  );
}

import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { PhotoEditorClient } from "./photo-editor-client";

export const metadata: Metadata = {
  title: "Photo Editor",
  description:
    "Edit images in your browser: adjust brightness, contrast and saturation, apply filters, and drag text and emoji stickers onto your photo. No upload required.",
  alternates: { canonical: "/photo-editor" },
};

// Statically prerendered for fast TTFB + crawlable SEO (see image-compressor).
export const dynamic = "force-static";

export default function PhotoEditorPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="photo-editor" />
      <PhotoEditorClient />
      <PrivacyNote />
      <ToolSeoContent slug="photo-editor" />
    </div>
  );
}

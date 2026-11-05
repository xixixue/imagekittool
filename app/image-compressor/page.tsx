import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { CompressorClient } from "./compressor-client";

export const metadata: Metadata = {
  title: "Image Compressor",
  description:
    "Compress JPG, PNG, and WebP images in your browser. Adjust quality, batch process, and download individually or as a ZIP. No upload required.",
  alternates: { canonical: "/image-compressor" },
};

export default function ImageCompressorPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="image-compressor" />
      <CompressorClient />
      <PrivacyNote />
      <ToolSeoContent slug="image-compressor" />
    </div>
  );
}

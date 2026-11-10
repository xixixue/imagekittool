import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { CropperClient } from "./cropper-client";

export const metadata: Metadata = {
  title: "Image Cropper",
  description:
    "Crop JPG, PNG, and WebP images in your browser with free or fixed aspect ratios (1:1, 4:3, 3:2, 16:9), 90° rotation, and touch support. No upload required.",
  alternates: { canonical: "/image-cropper" },
};

// Statically prerendered for fast TTFB + crawlable SEO (see image-compressor).
export const dynamic = "force-static";

export default function ImageCropperPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="image-cropper" />
      <CropperClient />
      <PrivacyNote />
      <ToolSeoContent slug="image-cropper" />
    </div>
  );
}

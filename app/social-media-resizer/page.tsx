import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { SocialMediaResizerClient } from "./social-media-resizer-client";

export const metadata: Metadata = {
  title: "Social Media Image Resizer",
  description:
    "Resize images for Instagram, Facebook, YouTube, Pinterest, and LinkedIn in your browser — pick a preset or custom size, choose Cover or Contain fit, and export PNG, JPG, or WebP. Runs locally; nothing is uploaded.",
  alternates: { canonical: "/social-media-resizer" },
};


export default function SocialMediaResizerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="social-media-resizer" />
      <SocialMediaResizerClient />
      <PrivacyNote />
      <ToolSeoContent slug="social-media-resizer" />
    </div>
  );
}

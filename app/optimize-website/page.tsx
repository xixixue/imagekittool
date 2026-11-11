import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { OptimizeWebsiteClient } from "./optimize-website-client";

export const metadata: Metadata = {
  title: "Optimize for Website",
  description:
    "Convert an image to WebP and compress it in one pass for smaller, web-ready files. See the original size, result size, and savings. Runs locally in your browser; nothing is uploaded.",
  alternates: { canonical: "/optimize-website" },
};


export default function OptimizeWebsitePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="optimize-website" />
      <OptimizeWebsiteClient />
      <PrivacyNote />
      <ToolSeoContent slug="optimize-website" />
    </div>
  );
}

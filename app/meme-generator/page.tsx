import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { MemeClient } from "./meme-client";

export const metadata: Metadata = {
  title: "Meme Generator",
  description:
    "Make a meme from any image with classic top and bottom text. Bold outlined lettering stays readable over any background. No upload required.",
  alternates: { canonical: "/meme-generator" },
};

// Statically prerendered for fast TTFB + crawlable SEO (see image-compressor).

export default function MemeGeneratorPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="meme-generator" />
      <MemeClient />
      <PrivacyNote />
      <ToolSeoContent slug="meme-generator" />
    </div>
  );
}

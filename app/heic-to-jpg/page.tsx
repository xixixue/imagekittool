import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { HeicToJpgClient } from "./heic-to-jpg-client";

export const metadata: Metadata = {
  title: "HEIC to JPG Converter",
  description:
    "Convert HEIC and HEIF photos (from iPhone) to JPG, PNG, or WebP in your browser — no upload, no signup. Adjust quality and download. Runs locally.",
  alternates: { canonical: "/heic-to-jpg" },
};

export const dynamic = "force-static";

export default function HeicToJpgPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="heic-to-jpg" />
      <HeicToJpgClient />
      <PrivacyNote />
      <ToolSeoContent slug="heic-to-jpg" />
    </div>
  );
}

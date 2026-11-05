import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { ConverterClient } from "./converter-client";

export const metadata: Metadata = {
  title: "Image Converter",
  description:
    "Convert images between JPG, PNG, and WebP in your browser. Transparency is filled correctly when converting to JPG. No upload required.",
  alternates: { canonical: "/image-converter" },
};

export default function ImageConverterPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="image-converter" />
      <ConverterClient />
      <PrivacyNote />
      <ToolSeoContent slug="image-converter" />
    </div>
  );
}

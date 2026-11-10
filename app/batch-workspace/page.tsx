import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { BatchWorkspaceClient } from "./batch-workspace-client";

export const metadata: Metadata = {
  title: "Batch Workspace",
  description:
    "Process many images at once in your browser — add files, chain steps (resize, convert, compress, watermark, rotate, rename), and download individually or as a ZIP. Runs locally; nothing is uploaded.",
  alternates: { canonical: "/batch-workspace" },
};

// Statically prerendered for fast TTFB + crawlable SEO (see image-compressor).
export const dynamic = "force-static";

export default function BatchWorkspacePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ToolPageHeader slug="batch-workspace" />
      <BatchWorkspaceClient />
      <PrivacyNote />
      <ToolSeoContent slug="batch-workspace" />
    </div>
  );
}

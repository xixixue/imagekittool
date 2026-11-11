import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { ToolSeoContent } from "@/components/tools/tool-seo-content";
import { SizeReferenceClient } from "./size-reference-client";
import type { Crumb } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Image Size Reference",
  description:
    "A searchable reference of recommended image sizes for social media, websites, email, video thumbnails, profiles, and print. Each entry links to a resizer tool. Reviewed and dated.",
  alternates: { canonical: "/image-size-reference" },
};

export const dynamic = "force-static";

export default async function ImageSizeReferencePage() {
  const t = await getTranslations("Tool.image-size-reference");
  const trail: Crumb[] = [
    { name: "Home", href: "/" },
    { name: t("name"), href: "/image-size-reference" },
  ];
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Breadcrumbs trail={trail} />
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("name")}</h1>
        <p className="mt-1 text-sm font-medium text-primary">{t("tagline")}</p>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t("headerDescription")}</p>
      </header>
      <SizeReferenceClient />
      <div className="mt-10">
        <PrivacyNote />
      </div>
      <ToolSeoContent slug="image-size-reference" />
    </div>
  );
}

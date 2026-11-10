import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ToolCard } from "@/components/tools/tool-card";
import { ShieldIcon } from "@/components/tools/tool-icon";
import { tools } from "@/lib/data/tools";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import type { Crumb } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "All Image Tools",
  description:
    "Browse every free image tool: compressor, resizer, converter, cropper, and compress-to-KB. All run locally in your browser.",
  alternates: { canonical: "/tools" },
};

export default async function ToolsPage() {
  const t = await getTranslations("ToolsPage");
  const tNav = await getTranslations("Nav");
  const trail: Crumb[] = [
    { name: "ImageKitTools", href: "/" },
    { name: tNav("tools"), href: "/tools" },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <Breadcrumbs trail={trail} />
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <ShieldIcon className="h-3.5 w-3.5" />
          {t("badge")}
        </p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </div>
  );
}

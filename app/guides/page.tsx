import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { guides } from "@/lib/data/guides";
import { GuideCard } from "@/components/guides/guide-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { buildItemList, type Crumb } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Image Guides — ImageKitTools",
  description:
    "Illustrated, in-depth explainers on image formats, compression, resolution, color, and editing — how the image tools you use actually work.",
  alternates: { canonical: "/guides" },
};

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function GuidesIndexPage() {
  const t = await getTranslations("Guides");
  const tNav = await getTranslations("Nav");
  // Newest first; stable fallback to declaration order when dates match.
  const sorted = [...guides].sort(
    (a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug),
  );
  const trail: Crumb[] = [
    { name: "ImageKitTools", href: "/" },
    { name: tNav("guides"), href: "/guides" },
  ];
  // ItemList of the guides actually listed on this page (§9.2 structured data).
  const itemList = buildItemList(
    sorted.map((g) => ({ name: g.title, url: `/guides/${g.slug}` })),
    SITE_URL,
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <Breadcrumbs trail={trail} />
      <JsonLd data={itemList} />
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("indexTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("indexSubtitle")}</p>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((guide) => (
          <GuideCard key={guide.slug} guide={guide} />
        ))}
      </div>
    </div>
  );
}

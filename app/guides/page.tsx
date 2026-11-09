import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { guides } from "@/lib/data/guides";
import { GuideCard } from "@/components/guides/guide-card";

export const metadata: Metadata = {
  title: "Image Guides — ImageKitTools",
  description:
    "Illustrated, in-depth explainers on image formats, compression, resolution, color, and editing — how the image tools you use actually work.",
  alternates: { canonical: "/guides" },
};

export default async function GuidesIndexPage() {
  const t = await getTranslations("Guides");
  // Newest first; stable fallback to declaration order when dates match.
  const sorted = [...guides].sort(
    (a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug),
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
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

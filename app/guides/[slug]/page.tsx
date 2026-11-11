import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { guides, howToFromGuide } from "@/lib/data/guides";
import { getToolBySlug } from "@/lib/data/tools";
import { GuideBody } from "@/components/guides/guide-body";
import { GuideCover } from "@/components/guides/guide-diagram";
import { ArrowRightIcon } from "@/components/tools/tool-icon";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { buildArticle, buildHowTo, type Crumb } from "@/lib/seo/json-ld";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = guides.find((g) => g.slug === slug);
  if (!guide) return {};
  return {
    title: `${guide.title} — ImageKitTools`,
    description: guide.description,
    alternates: { canonical: `/guides/${slug}` },
  };
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = guides.find((g) => g.slug === slug);
  if (!guide) notFound();

  const t = await getTranslations("Guides");
  const tNav = await getTranslations("Nav");
  const toolName = await getTranslations("Tool");
  const related = guide.relatedToolSlugs
    .map((s) => getToolBySlug(s))
    .filter((entry): entry is NonNullable<ReturnType<typeof getToolBySlug>> => Boolean(entry));

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const canonical = `${siteUrl}/guides/${slug}`;
  const trail: Crumb[] = [
    { name: "ImageKitTools", href: "/" },
    { name: tNav("guides"), href: "/guides" },
    { name: guide.title, href: `/guides/${slug}` },
  ];
  // Article structured data mirrors the guide's real headline, description,
  // publish date and cover (SPEC V2 §9.2).
  const articleLd = buildArticle({
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedAt,
    image: guide.coverImage ? `${siteUrl}${guide.coverImage}` : undefined,
    url: canonical,
  });
  // HowTo structured data for how-to guides: steps derived from the list under
  // the "How to" heading (§9.2 — mirrors the rendered content). Null otherwise.
  const howTo = howToFromGuide(guide);
  const howToLd = howTo
    ? buildHowTo({
        name: howTo.name,
        description: howTo.description,
        url: canonical,
        steps: howTo.steps,
      })
    : null;
  const structuredData = howToLd ? [articleLd, howToLd] : articleLd;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd data={structuredData} />
      <Breadcrumbs trail={trail} />

      <Link
        href="/guides"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowRightIcon className="h-4 w-4 rotate-180" />
        {t("backToGuides")}
      </Link>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground/80">
          {guide.category}
        </span>
        <span>·</span>
        <span>{t("minRead", { min: guide.readingTimeMin })}</span>
      </div>

      <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        {guide.title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{guide.description}</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border">
        <GuideCover coverImage={guide.coverImage} name={guide.coverDiagram} className="h-48 sm:h-56" alt={guide.title} />
      </div>

      <div className="mt-10">
        <GuideBody blocks={guide.body} />
      </div>

      {related.length > 0 && (
        <div className="mt-12 border-t border-border pt-8">
          <h2 className="text-lg font-bold tracking-tight text-foreground">{t("relatedTools")}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((tool) => (
              <Link
                key={tool.slug}
                href={tool.href}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
              >
                {toolName(`${tool.slug}.name`)}
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

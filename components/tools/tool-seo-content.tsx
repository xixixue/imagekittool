import Link from "next/link";
import { getMessages, getTranslations } from "next-intl/server";
import { AdSlot } from "@/components/ads/ad-slot";
import { getToolBySlug } from "@/lib/data/tools";
import { TOOL_SEO_RELATED, type ToolDeepDiveData, type ToolSeoData } from "@/lib/data/tool-seo";

type ToolEntry = NonNullable<ReturnType<typeof getToolBySlug>>;

/**
 * Structured, indexable SEO content for a tool page (SPEC §13): how-to steps,
 * use cases, format/size knowledge, FAQ, and internal links to related tools.
 *
 * All copy is localized and read from the current locale's messages under the
 * `ToolSeo` namespace. Related-tool slugs are non-translatable structure; their
 * display names come from the existing `Tool` namespace so they stay in sync
 * with the rest of the UI.
 */
export async function ToolSeoContent({ slug }: { slug: string }) {
  const messages = (await getMessages()) as {
    ToolSeo?: Record<string, ToolSeoData>;
    ToolDeepDive?: Record<string, ToolDeepDiveData>;
  };
  const seo = messages.ToolSeo?.[slug];
  if (!seo) return null;
  // Merge the base ToolSeo content with the extra ToolDeepDive knowledge/FAQ so
  // each tool page carries more original copy (AdSense low-value-content defense).
  const deep = messages.ToolDeepDive?.[slug];
  const knowledge = [...seo.knowledge, ...(deep?.knowledge ?? [])];
  const faq = [...seo.faq, ...(deep?.faq ?? [])];

  const t = await getTranslations("ToolSeo");
  const toolName = await getTranslations("Tool");
  const relatedSlugs = TOOL_SEO_RELATED[slug] ?? [];
  const related = relatedSlugs
    .map((s) => getToolBySlug(s))
    .filter((entry): entry is ToolEntry => Boolean(entry));

  return (
    <section className="mt-16 space-y-10">
      {/* In-content ad — sits inside the SEO content zone, far below the tool's
          upload/process/download buttons. Renders nothing until AdSense is
          configured (see ADS.md). */}
      <AdSlot slot="tool-content-top" />

      <div>
        <h2 className="text-xl font-bold tracking-tight">{t("howToUse")}</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-muted-foreground">
          {seo.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <div>
        <h2 className="text-xl font-bold tracking-tight">{t("whenToUse")}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-muted-foreground">
          {seo.useCases.map((u, i) => (
            <li key={i}>{u}</li>
          ))}
        </ul>
      </div>

      {knowledge.map((k, i) => (
        <div key={i}>
          <h2 className="text-xl font-bold tracking-tight">{k.heading}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{k.body}</p>
        </div>
      ))}

      <div>
        <h2 className="text-xl font-bold tracking-tight">{t("faq")}</h2>
        <dl className="mt-3 space-y-4">
          {faq.map((f, i) => (
            <div key={i}>
              <dt className="text-sm font-medium text-foreground">{f.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t("relatedTools")}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {related.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={entry.href}
                  className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
                >
                  {toolName(`${entry.slug}.name`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Below-content ad — after all editorial content, never near the tool. */}
      <AdSlot slot="tool-content-bottom" />
    </section>
  );
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PrivacyNote } from "@/components/tools/privacy-note";
import { WORKFLOWS } from "@/lib/data/workflows";
import type { Crumb } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Quick Workflows",
  description:
    "Curated multi-step image workflows — optimize for the web, prepare for Instagram or printing, or reduce to a target size. Each runs locally in your browser; nothing is uploaded.",
  alternates: { canonical: "/workflows" },
};


/**
 * Quick Workflows index (SPEC V2 §6, Phase 4). The task entry point that
 * surfaces all four workflows. Pipeline workflows link to their own page;
 * routeTo workflows link to the existing tool that implements the capability.
 */
export default async function WorkflowsPage() {
  const t = await getTranslations("Tool.workflows");
  const tW = await getTranslations("Workflows");
  const trail: Crumb[] = [
    { name: "Home", href: "/" },
    { name: t("name"), href: "/workflows" },
  ];
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Breadcrumbs trail={trail} />
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("name")}</h1>
        <p className="mt-1 text-sm font-medium text-primary">{t("tagline")}</p>
        <p className="mt-3 text-muted-foreground">{t("headerDescription")}</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {WORKFLOWS.map((w) => {
          const href = w.steps ? `/${w.id}` : w.routeTo!;
          return (
            <li key={w.id}>
              <a
                href={href}
                className="block rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <h2 className="text-lg font-semibold">{tW(`${w.id}.name`)}</h2>
                <p className="text-sm font-medium text-primary">{tW(`${w.id}.tagline`)}</p>
                <p className="mt-2 text-sm text-muted-foreground">{tW(`${w.id}.description`)}</p>
              </a>
            </li>
          );
        })}
      </ul>
      <div className="mt-10">
        <PrivacyNote />
      </div>
    </div>
  );
}

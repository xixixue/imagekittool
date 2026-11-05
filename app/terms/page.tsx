import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { renderLegalBody, type LegalMessages } from "@/components/legal/legal-body";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.terms");
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: { canonical: "/terms" },
  };
}

export default async function TermsPage() {
  const messages = (await getMessages()) as { Legal: LegalMessages };
  const terms = messages.Legal.terms;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{terms.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{terms.lastUpdated}</p>
      <div className="mt-8 space-y-8">
        {terms.sections?.map((section, i) => (
          <section key={i} className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
            {renderLegalBody(section.body)}
            {section.items && (
              <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                {section.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

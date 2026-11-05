import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { renderLegalBody, type LegalMessages } from "@/components/legal/legal-body";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.privacy");
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: { canonical: "/privacy-policy" },
  };
}

export default async function PrivacyPolicyPage() {
  const messages = (await getMessages()) as { Legal: LegalMessages };
  const privacy = messages.Legal.privacy;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{privacy.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{privacy.lastUpdated}</p>
      <div className="mt-8 space-y-8">
        {privacy.sections?.map((section, i) => (
          <section key={i} className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
            {renderLegalBody(section.body)}
          </section>
        ))}
      </div>
    </div>
  );
}

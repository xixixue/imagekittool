import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { renderLegalBody, type LegalMessages } from "@/components/legal/legal-body";

/** Support email shown on the Contact page (owner-provided; on the site domain). */
const SUPPORT_EMAIL = "support@imagekittool.com";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.contact");
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const messages = (await getMessages()) as { Legal: LegalMessages };
  const contact = messages.Legal.contact;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{contact.title}</h1>
      <div className="mt-6 space-y-8">
        {contact.intro && (
          <p className="text-sm leading-relaxed text-muted-foreground">{contact.intro}</p>
        )}
        {contact.emailLabel && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {contact.emailLabel}:{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
        )}
        {contact.sections?.map((section, i) => (
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
            {section.after && renderLegalBody(section.after)}
          </section>
        ))}
      </div>
    </div>
  );
}

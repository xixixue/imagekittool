import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { renderLegalBody, type LegalMessages } from "@/components/legal/legal-body";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.cookie");
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: { canonical: "/cookie-policy" },
  };
}

export default async function CookiePolicyPage() {
  const messages = (await getMessages()) as { Legal: LegalMessages };
  const cookie = messages.Legal.cookie;
  const headers = cookie.tableHeaders;
  const rows = cookie.essentialCookies ?? [];
  // The essential-cookies table renders right after the "Essential cookies"
  // section (index 1 in the source structure).
  const ESSENTIAL_SECTION_INDEX = 1;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{cookie.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{cookie.lastUpdated}</p>
      <div className="mt-8 space-y-8">
        {cookie.sections?.map((section, i) => (
          <section key={i} className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
            {renderLegalBody(section.body)}
            {i === ESSENTIAL_SECTION_INDEX && headers && rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4 font-semibold text-foreground">{headers.cookie}</th>
                      <th className="py-2 pr-4 font-semibold text-foreground">{headers.purpose}</th>
                      <th className="py-2 pr-4 font-semibold text-foreground">{headers.duration}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.name} className="border-b border-border">
                        <td className="py-2 pr-4 font-medium text-foreground">{row.name}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{row.purpose}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{row.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

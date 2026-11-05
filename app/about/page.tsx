import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { renderLegalBody, type LegalMessages, type LegalSegment } from "@/components/legal/legal-body";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.about");
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const messages = (await getMessages()) as { Legal: LegalMessages };
  const about = messages.Legal.about;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{about.title}</h1>
      <div className="mt-6 space-y-4">
        {about.paragraphs?.map((p: string | LegalSegment[], i: number) => (
          <div key={i}>{renderLegalBody(p)}</div>
        ))}
      </div>
    </div>
  );
}

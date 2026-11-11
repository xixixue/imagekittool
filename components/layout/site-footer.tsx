import Link from "next/link";
import { getTranslations } from "next-intl/server";

const footerLinks = [
  { href: "/workflows", key: "workflows" },
  { href: "/image-size-reference", key: "imageSizeReference" },
  { href: "/guides", key: "guides" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
  { href: "/privacy-policy", key: "privacy" },
  { href: "/terms", key: "terms" },
  { href: "/cookie-policy", key: "cookies" },
] as const;

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>{t("rights", { year })}</p>
        <nav className="flex flex-wrap gap-4">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

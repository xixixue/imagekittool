import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ImageIcon } from "@/components/tools/tool-icon";
import { HeaderAuth } from "./header-auth";
import { LanguageSwitcher } from "./language-switcher";

const navLinks = [
  { href: "/tools", key: "tools" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export async function SiteHeader() {
  const t = await getTranslations("Nav");
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
            <ImageIcon className="h-5 w-5" />
          </span>
          <span>
            <span className="text-primary">ImageKit</span>Tools
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm text-muted-foreground sm:gap-4">
          {/* Primary nav links collapse on mobile so login/register/language stay visible. */}
          <div className="hidden items-center gap-4 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {t(link.key)}
              </Link>
            ))}
          </div>
          <HeaderAuth />
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}

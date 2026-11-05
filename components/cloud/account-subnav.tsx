"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/account", key: "accountNav" },
  { href: "/account/files", key: "filesNav" },
  { href: "/account/storage", key: "storageNav" },
] as const;

/** Sub-navigation shared across /account, /account/files, /account/storage. */
export function AccountSubNav() {
  const t = useTranslations("Cloud");
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2">
      {ITEMS.map((it) => {
        const active = pathname === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:bg-muted",
            )}
          >
            {t(it.key)}
          </Link>
        );
      })}
    </nav>
  );
}

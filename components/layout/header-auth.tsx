"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface SessionUser {
  email: string;
  username: string | null;
  emailVerified: boolean;
}

export function HeaderAuth() {
  const t = useTranslations("Nav");
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { user: SessionUser | null }) => {
        if (active) setUser(d.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  };

  if (user === undefined) return null;
  if (!user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/login"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("signIn")}
        </Link>
        <Link
          href="/register"
          className="rounded-md bg-primary px-2.5 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 sm:px-3"
        >
          {t("register")}
        </Link>
      </div>
    );
  }
  const displayName = user.username ?? user.email;
  const initial = displayName.charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/account"
        title={user.email}
        className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 py-1 pl-1 pr-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initial}
        </span>
        <span className="max-w-[90px] truncate sm:max-w-[140px]">{displayName}</span>
      </Link>
      <button
        type="button"
        onClick={signOut}
        className="rounded-md border border-border px-2.5 py-1.5 text-sm transition-colors hover:bg-muted sm:px-3"
      >
        {t("signOut")}
      </button>
    </div>
  );
}

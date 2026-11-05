"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface SessionUser {
  email: string;
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
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("signIn")}
        </Link>
        <Link
          href="/register"
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("register")}
        </Link>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/account"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {user.email}
      </Link>
      <button
        type="button"
        onClick={signOut}
        className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
      >
        {t("signOut")}
      </button>
    </div>
  );
}

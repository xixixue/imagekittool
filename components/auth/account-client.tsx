"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function AccountClient({ emailVerified }: { emailVerified: boolean }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="mt-8 space-y-4">
      {!emailVerified && (
        <p className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          {t("verifyReminder")}
        </p>
      )}
      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-60"
      >
        {busy ? t("signingOut") : t("signOutBtn")}
      </button>
    </div>
  );
}

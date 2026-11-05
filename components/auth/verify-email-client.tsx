"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

type Status = "verifying" | "success" | "error";

export function VerifyEmailClient() {
  const t = useTranslations("Auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError(t("verifyMissingToken"));
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!active) return;
        if (res.ok) {
          setStatus("success");
        } else {
          const j = await res.json().catch(() => ({}));
          setStatus("error");
          setError(j.error ?? t("verifyError"));
        }
      } catch {
        if (active) {
          setStatus("error");
          setError(t("networkError"));
        }
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (status === "verifying") {
    return <p className="text-sm text-muted-foreground">{t("verifying")}</p>;
  }
  if (status === "success") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-primary">{t("verifySuccess")}</p>
        <Link
          href="/account"
          className="inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("goToAccount")}
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-destructive">{error ?? t("verifyError")}</p>
      <Link
        href="/account"
        className="inline-block rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
      >
        {t("backToAccount")}
      </Link>
    </div>
  );
}

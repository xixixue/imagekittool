import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StorageUsageClient } from "@/components/cloud/storage-usage-client";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Storage",
  description: "Your cloud storage usage.",
  robots: { index: false, follow: false },
};

export default async function StoragePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/storage");
  return <StorageUsageClient />;
}

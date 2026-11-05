import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CloudFilesClient } from "@/components/cloud/cloud-files-client";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Cloud files",
  description: "Your saved image files.",
  robots: { index: false, follow: false },
};

export default async function CloudFilesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/files");
  return <CloudFilesClient />;
}

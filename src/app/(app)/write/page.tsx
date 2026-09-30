import { Feather } from "lucide-react";
import type { Metadata } from "next";
import { requireUser } from "@/server/users";
import { EmptyState, Page } from "@/components/page";

export const metadata: Metadata = { title: "Write" };

// Placeholder until the editor lands in Phase 2.
export default async function WritePage() {
  await requireUser();
  return (
    <Page>
      <EmptyState className="animate-rise mt-4" icon={Feather} title="Your writing space is almost ready">
        The editor arrives in the next update. Everything you write will be encrypted before it&apos;s stored.
      </EmptyState>
    </Page>
  );
}

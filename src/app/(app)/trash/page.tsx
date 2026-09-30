import { Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { TrashList } from "@/components/memory/trash-list";
import { EmptyState, Page, PageHeader } from "@/components/page";
import { listEntries } from "@/server/entries";
import { requireUser } from "@/server/users";

export const metadata: Metadata = { title: "Trash" };

export default async function TrashPage() {
  const user = await requireUser();
  const items = await listEntries(user.id, { trash: true, limit: 200 });

  return (
    <Page className="max-w-3xl">
      <PageHeader title="Trash" description="Deleted memories stay here for 30 days, then they're gone for good." />
      {items.length === 0 ? (
        <EmptyState className="animate-rise mt-8" icon={Trash2} title="Trash is empty">
          Nothing to see here. Your memories are all where they belong.
        </EmptyState>
      ) : (
        <TrashList items={items.map((e) => ({ id: e.id, title: e.title, excerpt: e.excerpt, memoryDate: e.memoryDate }))} />
      )}
    </Page>
  );
}

import { Search } from "lucide-react";
import type { Metadata } from "next";
import { MemoryCard } from "@/components/memory/memory-card";
import { SearchBox } from "@/components/memory/search-box";
import { EmptyState, Page, PageHeader } from "@/components/page";
import { listCollections } from "@/server/collections";
import { searchEntries } from "@/server/entries";
import { requireUser } from "@/server/users";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const { q = "" } = await searchParams;
  const query = q.slice(0, 200);
  const [hits, collections] = await Promise.all([
    query.trim() ? searchEntries(user.id, query) : Promise.resolve([]),
    listCollections(user.id),
  ]);
  const byId = new Map(collections.map((c) => [c.id, c]));

  return (
    <Page className="max-w-3xl">
      <PageHeader title="Search" description="Every word you've written, searchable, and still encrypted." />
      <SearchBox initial={query} />

      {!query.trim() ? (
        <EmptyState className="animate-rise mt-8" icon={Search} title="Find any memory">
          Try a person, a place, a feeling, or something you learned.
        </EmptyState>
      ) : hits.length === 0 ? (
        <EmptyState className="animate-rise mt-8" icon={Search} title={`Nothing found for "${query}"`}>
          Try fewer words, or a different spelling.
        </EmptyState>
      ) : (
        <div className="mt-6">
          <p className="mb-3 text-sm text-muted-foreground">
            {hits.length} {hits.length === 1 ? "memory" : "memories"}
          </p>
          <div className="space-y-3">
            {hits.map((h) => (
              <MemoryCard key={h.id} entry={h} collection={byId.get(h.collectionId)} snippet={h.snippet} />
            ))}
          </div>
        </div>
      )}
    </Page>
  );
}

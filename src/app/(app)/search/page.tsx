import { Search } from "lucide-react";
import type { Metadata } from "next";
import { requireUser } from "@/server/users";
import { EmptyState, Page, PageHeader } from "@/components/page";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage() {
  await requireUser();
  return (
    <Page>
      <PageHeader title="Search" />
      <label className="animate-rise mt-6 flex h-12 items-center gap-3 rounded-xl border border-input bg-card px-4 focus-within:ring-3 focus-within:ring-ring/40">
        <Search className="size-5 text-muted-foreground" aria-hidden />
        <span className="sr-only">Search your memories</span>
        <input
          type="search"
          placeholder="Search your memories"
          className="h-full flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          disabled
        />
      </label>
      <EmptyState className="animate-rise mt-8" icon={Search} title="Nothing to search yet">
        Once you&apos;ve written a few memories, you can find any of them here, even years from now.
      </EmptyState>
    </Page>
  );
}

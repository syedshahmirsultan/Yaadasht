import { ArrowLeft, Folder, PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COLLECTION_COLORS, COLLECTION_ICONS } from "@/components/collection-style";
import { CollectionDialog } from "@/components/memory/collection-dialog";
import { MemoryCard } from "@/components/memory/memory-card";
import { EmptyState, Page } from "@/components/page";
import { cn } from "@/lib/utils";
import { getCollection } from "@/server/collections";
import { listEntries } from "@/server/entries";
import { requireUser } from "@/server/users";

export const metadata: Metadata = { title: "Collection" };

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const collection = await getCollection(user.id, id);
  if (!collection) notFound();
  const entries = await listEntries(user.id, { collectionId: id, limit: 100 });
  const Icon = COLLECTION_ICONS[collection.icon] ?? Folder;

  return (
    <Page className="max-w-3xl">
      <Link href="/collections" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Collections
      </Link>

      <header className="animate-rise mt-6 flex flex-wrap items-center gap-4">
        <span className={cn("inline-flex size-14 items-center justify-center rounded-2xl", COLLECTION_COLORS[collection.color])}>
          <Icon className="size-6" aria-hidden />
        </span>
        <div className="flex-1">
          <h1 className="font-serif text-[2.4rem] leading-tight tracking-[-0.02em]">{collection.name}</h1>
          <p className="text-muted-foreground">
            {collection.description ?? `${collection.entryCount} ${collection.entryCount === 1 ? "memory" : "memories"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CollectionDialog
            existing={{ id: collection.id, name: collection.name, color: collection.color, icon: collection.icon, custom: collection.kind === "custom" }}
          />
          <Link
            href={`/write?collection=${collection.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
          >
            <PenLine className="size-4" aria-hidden />
            Write
          </Link>
        </div>
      </header>

      {entries.length === 0 ? (
        <EmptyState className="animate-rise mt-10" icon={Icon} title={`Nothing in ${collection.name} yet`}>
          {collection.kind === "learnings"
            ? "What's something you learned recently?"
            : collection.kind === "ideas"
              ? "Write down the idea before it floats away."
              : "Your first memory here is one click away."}
        </EmptyState>
      ) : (
        <div className="mt-10 space-y-3">
          {entries.map((e, i) => (
            <div key={e.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
              <MemoryCard entry={e} />
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}

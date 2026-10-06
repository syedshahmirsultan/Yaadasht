import { ArrowUpRight, Folder, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { COLLECTION_COLORS, COLLECTION_ICONS } from "@/components/collection-style";
import { CollectionDialog } from "@/components/memory/collection-dialog";
import { Page, PageHeader } from "@/components/page";
import { cn } from "@/lib/utils";
import { listCollections } from "@/server/collections";
import { requireUser } from "@/server/users";

export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const user = await requireUser();
  const items = await listCollections(user.id);

  return (
    <Page className="max-w-4xl">
      <PageHeader
        title="Collections"
        description="Where your memories live. Make your own for books, travel, work, anything."
      />

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c, i) => {
          const Icon = COLLECTION_ICONS[c.icon] ?? Folder;
          return (
            <li key={c.id} className="animate-rise" style={{ animationDelay: `${60 + i * 50}ms` }}>
              <Link
                href={`/collections/${c.id}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:border-saffron/40 hover:shadow-lift"
              >
                <span
                  className={cn(
                    "inline-flex size-12 items-center justify-center rounded-2xl transition group-hover:scale-105 group-hover:-rotate-6",
                    COLLECTION_COLORS[c.color] ?? COLLECTION_COLORS.saffron,
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <ArrowUpRight className="absolute top-6 right-6 size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" aria-hidden />
                <p className="mt-5 font-serif text-2xl">{c.name}</p>
                {c.description && <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>}
                <p className="mt-auto pt-5 text-sm text-muted-foreground tabular-nums">
                  {c.entryCount === 0 ? "Nothing here yet" : `${c.entryCount} ${c.entryCount === 1 ? "memory" : "memories"}`}
                </p>
              </Link>
            </li>
          );
        })}
        <li className="animate-rise" style={{ animationDelay: `${60 + items.length * 50}ms` }}>
          <CollectionDialog trigger="card" />
        </li>
        <li className="animate-rise" style={{ animationDelay: `${60 + (items.length + 1) * 50}ms` }}>
          <Link
            href="/trash"
            className="group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:border-destructive/40 hover:shadow-lift"
          >
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive transition group-hover:scale-105 group-hover:-rotate-6">
              <Trash2 className="size-5" aria-hidden />
            </span>
            <ArrowUpRight className="absolute top-6 right-6 size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" aria-hidden />
            <p className="mt-5 font-serif text-2xl">Trash</p>
            <p className="mt-1 text-sm text-muted-foreground">Deleted memories ready to restore or empty.</p>
          </Link>
        </li>
      </ul>
    </Page>
  );
}

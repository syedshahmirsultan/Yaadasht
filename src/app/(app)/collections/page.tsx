import { Folder } from "lucide-react";
import type { Metadata } from "next";
import { COLLECTION_COLORS, COLLECTION_ICONS } from "@/components/collection-style";
import { Page, PageHeader } from "@/components/page";
import { cn } from "@/lib/utils";
import { listCollections } from "@/server/collections";
import { requireUser } from "@/server/users";

export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const user = await requireUser();
  const items = await listCollections(user.id);

  return (
    <Page>
      <PageHeader title="Collections" description="Where your memories live. Make your own for books, travel, work, anything." />

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {items.map((c, i) => {
          const Icon = COLLECTION_ICONS[c.icon] ?? Folder;
          return (
            <li key={c.id} className="animate-rise" style={{ animationDelay: `${60 + i * 50}ms` }}>
              <div className="group flex h-full flex-col rounded-[1.5rem] border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
                <span
                  className={cn(
                    "inline-flex size-12 items-center justify-center rounded-2xl transition group-hover:scale-105",
                    COLLECTION_COLORS[c.color] ?? COLLECTION_COLORS.saffron,
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <p className="mt-5 font-serif text-2xl">{c.name}</p>
                {c.description && <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>}
                <p className="mt-auto pt-5 text-sm text-muted-foreground">
                  {c.entryCount === 0 ? "Nothing here yet" : `${c.entryCount} ${c.entryCount === 1 ? "memory" : "memories"}`}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Page>
  );
}

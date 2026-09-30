import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MemoryCard } from "@/components/memory/memory-card";
import { EmptyState, Page, PageHeader } from "@/components/page";
import { formatMemoryDate, monthLabel } from "@/lib/format";
import { listCollections } from "@/server/collections";
import { listEntries, type EntryCard } from "@/server/entries";
import { requireUser } from "@/server/users";

export const metadata: Metadata = { title: "Timeline" };

const PAGE = 60;

export default async function TimelinePage({ searchParams }: { searchParams: Promise<{ before?: string }> }) {
  const user = await requireUser();
  const { before } = await searchParams;
  const cursor = parseCursor(before);
  const [entries, collections] = await Promise.all([
    listEntries(user.id, { limit: PAGE, before: cursor }),
    listCollections(user.id),
  ]);
  const byId = new Map(collections.map((c) => [c.id, c]));

  // Group: year → month → entries
  const years = new Map<string, Map<string, EntryCard[]>>();
  for (const e of entries) {
    const y = e.memoryDate.slice(0, 4);
    const m = e.memoryDate.slice(0, 7);
    if (!years.has(y)) years.set(y, new Map());
    const months = years.get(y)!;
    if (!months.has(m)) months.set(m, []);
    months.get(m)!.push(e);
  }
  const last = entries.at(-1);

  return (
    <Page className="max-w-3xl">
      <PageHeader title="Timeline" description="Your life, year by year." />

      {entries.length === 0 && !cursor ? (
        <EmptyState
          className="animate-rise mt-8"
          icon={CalendarDays}
          title="Your timeline begins with your first memory"
          action={
            <Link href="/write" className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">
                Write something
              </Link>
          }
        >
          Every memory you keep will appear here, in the order you lived it.
        </EmptyState>
      ) : (
        <div className="mt-10 space-y-14">
          {[...years.entries()].map(([year, months]) => (
            <section key={year} aria-label={year}>
              <h2 className="sticky top-14 z-10 -mx-2 mb-6 bg-background/85 px-2 py-2 font-serif text-4xl tracking-[-0.02em] backdrop-blur md:top-0">
                {year}
              </h2>
              <div className="space-y-10">
                {[...months.entries()].map(([month, list]) => (
                  <div key={month} className="relative pl-7">
                    <div aria-hidden className="absolute top-2 bottom-0 left-[5px] w-px bg-gradient-to-b from-saffron/60 to-border" />
                    <h3 className="relative mb-4 text-sm font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      <span aria-hidden className="absolute top-1/2 -left-7 size-3 -translate-y-1/2 rounded-full bg-saffron shadow-[0_0_12px_var(--glow-amber)]" />
                      {monthLabel(month)}
                    </h3>
                    <div className="space-y-3">
                      {list.map((e) => (
                        <MemoryCard key={e.id} entry={e} collection={byId.get(e.collectionId)} eyebrow={formatMemoryDate(e.memoryDate, "long")} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {entries.length === PAGE && last && (
            <div className="flex justify-center">
              <Link
                href={`/timeline?before=${last.memoryDate}_${last.id}`}
                className="inline-flex h-10 items-center rounded-full border border-border bg-card px-5 text-sm font-medium shadow-soft hover:-translate-y-0.5"
              >
                Show earlier memories
              </Link>
            </div>
          )}
        </div>
      )}
    </Page>
  );
}

function parseCursor(v: string | undefined) {
  const m = v?.match(/^(\d{4}-\d{2}-\d{2})_([0-9a-f-]{36})$/);
  return m ? { date: m[1], id: m[2] } : undefined;
}

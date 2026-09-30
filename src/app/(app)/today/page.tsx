import { ArrowRight, Feather, Moon, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { COLLECTION_COLORS, COLLECTION_ICONS } from "@/components/collection-style";
import { MemoryCard } from "@/components/memory/memory-card";
import { Page, SectionTitle } from "@/components/page";
import { formatLongDate, greetingFor, todayIn } from "@/lib/dates";
import { yearsAgoLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listCollections } from "@/server/collections";
import { listEntries, onThisDay } from "@/server/entries";
import { requireUser } from "@/server/users";

export const metadata: Metadata = { title: "Today" };

const PROMPTS = ["How was your day?", "What did you learn?", "What are you grateful for?", "What should future you remember?"];

export default async function TodayPage() {
  const user = await requireUser();
  const today = todayIn(user.timezone);
  const [collections, recent, past] = await Promise.all([
    listCollections(user.id),
    listEntries(user.id, { limit: 6 }),
    onThisDay(user.id, today),
  ]);
  const byId = new Map(collections.map((c) => [c.id, c]));
  const total = collections.reduce((n, c) => n + c.entryCount, 0);
  const now = new Date();
  const name = user.displayName?.trim();

  return (
    <Page className="max-w-4xl">
      <header className="animate-rise">
        <p className="text-sm font-medium text-saffron">{formatLongDate(user.timezone, now)}</p>
        <h1 className="mt-1 font-serif text-[2.2rem] leading-tight tracking-[-0.02em] md:text-[3rem]">
          {greetingFor(user.timezone, now)}
          {name ? `, ${name}` : ""}.
        </h1>
      </header>

      {/* The one thing to do here: write */}
      <section
        className="animate-rise relative mt-8 overflow-hidden rounded-[1.75rem] border border-border bg-card p-6 shadow-soft md:p-8"
        style={{ animationDelay: "60ms" }}
      >
        <div
          aria-hidden
          className="animate-glow pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--glow-amber)_28%,transparent),transparent)]"
        />
        <Link href="/write" className="group relative block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Feather className="size-4 text-saffron" aria-hidden />
            Journal · today
          </span>
          <span className="mt-3 block font-serif text-2xl leading-snug text-foreground/70 transition-colors group-hover:text-foreground md:text-[1.9rem]">
            What do you want to remember about today?
          </span>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_0_30px_-8px_var(--glow-amber)] transition group-hover:-translate-y-0.5">
            Start writing
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </Link>
        <div className="relative mt-7 border-t border-border/70 pt-5">
          <p className="text-xs text-muted-foreground">Or begin with a question</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PROMPTS.map((p) => (
              <Link
                key={p}
                href={`/write?prompt=${encodeURIComponent(p)}`}
                className="rounded-full border border-border bg-background/60 px-3.5 py-1.5 text-sm text-foreground/80 transition hover:-translate-y-0.5 hover:border-saffron/50 hover:text-foreground"
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* On this day */}
      <section className="animate-rise mt-12" style={{ animationDelay: "120ms" }} aria-labelledby="otd">
        <SectionTitle>
          <span id="otd">On this day</span>
        </SectionTitle>
        {past.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(145deg,#141a33,#0a0e1c_65%)] p-6 text-[#eef1fb] shadow-soft">
            <Moon className="size-6 text-[#ff9f43]" aria-hidden />
            <p className="mt-4 font-serif text-xl leading-snug">Nothing from this day yet.</p>
            <p className="mt-2 text-sm text-[#9aa6c8]">A year from now, this is where you&apos;ll find what you write today.</p>
            <div aria-hidden className="pointer-events-none absolute -right-6 -bottom-10 size-40 rounded-full bg-[#ff9f43]/10" />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {past.map((e) => (
              <MemoryCard
                key={e.id}
                entry={e}
                collection={byId.get(e.collectionId)}
                eyebrow={yearsAgoLabel(e.memoryDate, today)}
                className="bg-[linear-gradient(160deg,color-mix(in_oklab,var(--glow-amber)_7%,var(--card)),var(--card)_55%)]"
              />
            ))}
          </div>
        )}
      </section>

      <div className="mt-12 grid gap-10 md:grid-cols-[1.4fr_1fr]">
        <section className="animate-rise" style={{ animationDelay: "180ms" }} aria-labelledby="recent">
          <div className="flex items-baseline justify-between">
            <SectionTitle>
              <span id="recent">Recently</span>
            </SectionTitle>
            {recent.length > 0 && (
              <Link href="/timeline" className="text-sm text-muted-foreground hover:text-foreground">
                See timeline
              </Link>
            )}
          </div>
          {recent.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-5 text-muted-foreground shadow-soft">
              Your first memory will appear here. Everything you write is encrypted before it&apos;s stored.
            </p>
          ) : (
            <div className="space-y-3">
              {recent.map((e) => (
                <MemoryCard key={e.id} entry={e} collection={byId.get(e.collectionId)} />
              ))}
            </div>
          )}
        </section>

        <section className="animate-rise" style={{ animationDelay: "240ms" }} aria-labelledby="cols">
          <SectionTitle>
            <span id="cols">Your collections</span>
          </SectionTitle>
          <ul className="space-y-2">
            {collections.map((c) => {
              const Icon = COLLECTION_ICONS[c.icon] ?? Sparkles;
              return (
                <li key={c.id}>
                  <Link
                    href={`/collections/${c.id}`}
                    className="flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition hover:border-border hover:bg-card hover:shadow-soft"
                  >
                    <span className={cn("inline-flex size-9 items-center justify-center rounded-lg", COLLECTION_COLORS[c.color] ?? COLLECTION_COLORS.saffron)}>
                      <Icon className="size-[1.05rem]" aria-hidden />
                    </span>
                    <span className="flex-1 font-medium">{c.name}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">{c.entryCount}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            {total === 0 ? "Everything you write is encrypted before it's stored." : `${total} ${total === 1 ? "memory" : "memories"} kept so far.`}
          </p>
        </section>
      </div>
    </Page>
  );
}

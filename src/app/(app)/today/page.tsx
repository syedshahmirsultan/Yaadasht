import { ArrowRight, Feather, Moon, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { COLLECTION_COLORS, COLLECTION_ICONS } from "@/components/collection-style";
import { Page, SectionTitle } from "@/components/page";
import { formatLongDate, greetingFor } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { listCollections } from "@/server/collections";
import { requireUser } from "@/server/users";

export const metadata: Metadata = { title: "Today" };

const PROMPTS = [
  "How was your day?",
  "What did you learn?",
  "What are you grateful for?",
  "What should future you remember?",
];

export default async function TodayPage() {
  const user = await requireUser();
  const collections = await listCollections(user.id);
  const total = collections.reduce((n, c) => n + c.entryCount, 0);
  const now = new Date();
  const name = user.displayName?.trim();

  return (
    <Page className="max-w-3xl">
      <header className="animate-rise">
        <p className="text-sm font-medium text-saffron-strong">{formatLongDate(user.timezone, now)}</p>
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
          className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--saffron)_22%,transparent),transparent)]"
        />
        <Link href="/write" className="group relative block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Feather className="size-4 text-saffron-strong" aria-hidden />
            Journal · today
          </span>
          <span className="mt-3 block font-serif text-2xl leading-snug text-foreground/70 transition-colors group-hover:text-foreground md:text-[1.9rem]">
            What do you want to remember about today?
          </span>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition group-hover:-translate-y-0.5 group-hover:shadow-lift">
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

      <div className="mt-12 grid gap-10 md:grid-cols-[1.1fr_1fr]">
        <section className="animate-rise" style={{ animationDelay: "120ms" }} aria-labelledby="otd">
          <SectionTitle>
            <span id="otd">On this day</span>
          </SectionTitle>
          <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(145deg,#2b2433,#1f2029_60%)] p-6 text-[#ece6db] shadow-soft">
            <Moon className="size-6 text-[#dba35d]" aria-hidden />
            <p className="mt-4 font-serif text-xl leading-snug">Nothing from this day yet.</p>
            <p className="mt-2 text-sm text-[#b3ac9e]">
              A year from now, this is where you&apos;ll find what you write today.
            </p>
            <div aria-hidden className="pointer-events-none absolute -right-6 -bottom-10 size-40 rounded-full bg-[#dba35d]/10" />
          </div>
        </section>

        <section className="animate-rise" style={{ animationDelay: "180ms" }} aria-labelledby="cols">
          <SectionTitle>
            <span id="cols">Your collections</span>
          </SectionTitle>
          <ul className="space-y-2">
            {collections.map((c) => {
              const Icon = COLLECTION_ICONS[c.icon] ?? Sparkles;
              return (
                <li key={c.id}>
                  <Link
                    href="/collections"
                    className="flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition hover:border-border hover:bg-card hover:shadow-soft"
                  >
                    <span className={cn("inline-flex size-9 items-center justify-center rounded-lg", COLLECTION_COLORS[c.color] ?? COLLECTION_COLORS.saffron)}>
                      <Icon className="size-[1.05rem]" aria-hidden />
                    </span>
                    <span className="flex-1 font-medium">{c.name}</span>
                    <span className="text-sm text-muted-foreground">{c.entryCount}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            {total === 0
              ? "Everything you write is encrypted before it's stored."
              : `${total} ${total === 1 ? "memory" : "memories"} kept so far.`}
          </p>
        </section>
      </div>
    </Page>
  );
}

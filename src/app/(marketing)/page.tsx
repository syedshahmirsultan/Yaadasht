import {
  ArrowRight,
  BookOpen,
  Brain,
  Camera,
  Download,
  EyeOff,
  FileJson,
  FileText,
  GraduationCap,
  Heart,
  Image as ImageIcon,
  Lightbulb,
  Lock,
  Map,
  MessageCircleHeart,
  Moon,
  NotebookPen,
  Palette,
  Plane,
  Quote,
  Search,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { LogoTile } from "@/components/brand/logo";
import { AccentDemo, IdeasDemo, OnThisDayDemo, SearchDemo } from "@/components/landing/demos";
import { LifetimeScroll } from "@/components/landing/lifetime";
import { HeroOrbit } from "@/components/landing/hero-orbit";
import { CountUp, CursorGlow, RotatingWord, Scramble, SpotlightCard, Typewriter } from "@/components/landing/interactive";
import { SiteHeader } from "@/components/landing/site-header";
import { Reveal } from "@/components/reveal";

type Item = { icon: typeof BookOpen; label: string };

const KEEP_ROW_1: Item[] = [
  { icon: NotebookPen, label: "Daily journal" },
  { icon: GraduationCap, label: "What I learned today" },
  { icon: Lightbulb, label: "Ideas at 2 a.m." },
  { icon: BookOpen, label: "Book highlights" },
  { icon: Plane, label: "Travel stories" },
  { icon: Heart, label: "Family moments" },
  { icon: Target, label: "Goals for this year" },
  { icon: Camera, label: "Photos that mean something" },
];
const KEEP_ROW_2: Item[] = [
  { icon: Quote, label: "Quotes that stayed with me" },
  { icon: Brain, label: "Lessons from mistakes" },
  { icon: Trophy, label: "Small wins" },
  { icon: MessageCircleHeart, label: "Letters to future me" },
  { icon: Map, label: "Places I lived" },
  { icon: ImageIcon, label: "Screenshots worth keeping" },
  { icon: Sparkles, label: "Dreams and what-ifs" },
  { icon: FileText, label: "Course notes" },
];

function Chip({ icon: Icon, label }: Item) {
  return (
    <span className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2.5 text-sm whitespace-nowrap shadow-soft backdrop-blur">
      <Icon className="size-4 text-saffron" aria-hidden />
      {label}
    </span>
  );
}

function Marquee({ items, reverse, duration }: { items: Item[]; reverse?: boolean; duration: string }) {
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <div
        className="animate-marquee flex w-max gap-3 pr-3 hover:[animation-play-state:paused]"
        style={{ ["--marquee-duration" as string]: duration, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {[...items, ...items].map((it, k) => (
          <Chip key={k} {...it} />
        ))}
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-saffron uppercase">
      <span className="h-px w-6 bg-saffron/70" />
      {children}
    </p>
  );
}

function FeatureHead({ icon: Icon, title, body }: { icon: typeof BookOpen; title: string; body: string }) {
  return (
    <div>
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="mt-4 font-serif text-2xl tracking-[-0.01em]">{title}</h3>
      <p className="mt-1.5 text-muted-foreground">{body}</p>
    </div>
  );
}

const PRIMARY_CTA =
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary font-medium text-primary-foreground shadow-[0_0_40px_-8px_var(--glow-amber)] transition hover:-translate-y-0.5 hover:shadow-[0_0_60px_-6px_var(--glow-amber)]";

function Sheen() {
  return (
    <span
      aria-hidden
      className="animate-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
    />
  );
}

// Static: served instantly from the edge. Signed-in visitors are sent to /today by the proxy.
export default function LandingPage() {
  return (
    <div className="relative overflow-x-clip">
      <SiteHeader />

      {/* Hero */}
      <CursorGlow className="grain relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="animate-aurora absolute -top-40 -left-32 size-[40rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--electric)_45%,transparent),transparent)] blur-3xl" />
          <div className="animate-aurora absolute -top-20 right-[-10rem] size-[36rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--glow-amber)_38%,transparent),transparent)] blur-3xl [animation-delay:-8s]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--foreground)_5%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_5%,transparent)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)] bg-[size:56px_56px]" />
        </div>

        <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 pt-32 pb-20 md:grid-cols-[1.05fr_1fr] md:px-8 md:pt-40 md:pb-28">
          <div>
            <p className="animate-rise glow-border inline-flex items-center gap-2 rounded-full bg-card/60 px-3.5 py-1.5 text-xs font-medium backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-saffron opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-saffron" />
              </span>
              Your second memory, for everything
            </p>

            <h1
              className="animate-rise mt-7 font-serif text-[3rem] leading-[0.98] tracking-[-0.035em] md:text-[4.9rem]"
              style={{ animationDelay: "80ms" }}
            >
              Remember
              <br />
              everything you{" "}
              <RotatingWord
                words={["learn.", "think.", "feel.", "build.", "dream.", "live."]}
                className="animate-gradient bg-[linear-gradient(90deg,var(--glow-amber),#ffd08a,var(--electric),var(--glow-amber))] bg-clip-text pb-2 text-transparent italic"
              />
            </h1>

            <p
              className="animate-rise mt-6 max-w-lg text-lg leading-relaxed text-pretty text-muted-foreground"
              style={{ animationDelay: "160ms" }}
            >
              Yaadasht is one private, beautiful home for your journal, the things you learn, your ideas and the moments
              you never want to lose. And it brings them back to you, right when they matter.
            </p>

            <div className="animate-rise mt-9 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ animationDelay: "240ms" }}>
              <Link href="/sign-up" className={`${PRIMARY_CTA} h-13 px-7`}>
                <Sheen />
                Start remembering, free
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
              <a
                href="#features"
                className="inline-flex h-13 items-center justify-center rounded-full border border-border bg-card/50 px-6 font-medium backdrop-blur transition hover:bg-card"
              >
                See how it works
              </a>
            </div>

            <ul className="animate-rise mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground" style={{ animationDelay: "320ms" }}>
              {["Encrypted before it's stored", "No ads, ever", "Export everything", "Open source"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-saffron" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-rise" style={{ animationDelay: "200ms" }}>
            <HeroOrbit />
          </div>
        </section>
      </CursorGlow>

      {/* Everything worth keeping */}
      <section id="everything" className="scroll-mt-24 py-20 md:py-28">
        <Reveal className="mx-auto max-w-3xl px-5 text-center">
          <Eyebrow>Not just a diary</Eyebrow>
          <h2 className="mt-4 font-serif text-4xl leading-tight tracking-[-0.025em] text-balance md:text-6xl">
            If it matters to you, it belongs here.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Your days, your lessons, your sparks of genius. Keep all of it in one calm place instead of twenty apps.
          </p>
        </Reveal>
        <div className="mt-12 space-y-3">
          <Marquee items={KEEP_ROW_1} duration="60s" />
          <Marquee items={KEEP_ROW_2} duration="70s" reverse />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-24 md:px-8">
        <Reveal className="max-w-2xl">
          <Eyebrow>How it feels</Eyebrow>
          <h2 className="mt-4 font-serif text-4xl leading-tight tracking-[-0.025em] text-balance md:text-5xl">
            Built for the next thirty years of your life.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <SpotlightCard className="h-full">
              <FeatureHead
                icon={NotebookPen}
                title="Write like it's your diary"
                body="Open it and start typing. Today's date is already there. No folders, no formatting, no pressure."
              />
              <div className="mt-6 rounded-2xl border border-border bg-background/70 p-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="rounded-full bg-accent px-2.5 py-1 font-medium text-accent-foreground">Journal</span>
                  <span className="flex items-center gap-1.5">
                    <Lock className="size-3" /> Saved · encrypted
                  </span>
                </div>
                <p className="mt-4 min-h-[5.5rem] font-writing text-xl leading-relaxed md:text-[1.35rem]">
                  <Typewriter
                    texts={[
                      "Today I finally understood why the sky turns orange at sunset. Light travels further, and the blue scatters away.",
                      "Ammi called. We laughed about the bazaar, the jalebi, and the shopkeeper who looked after me.",
                      "Idea: a weekend reading club for the kids on our street. Start with ten books and one mat.",
                    ]}
                  />
                </p>
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal className="md:col-span-2" delay={100}>
            <SpotlightCard className="h-full">
              <FeatureHead icon={GraduationCap} title="Learnings that stay learned" body="Every lesson, course and aha moment, kept and findable." />
              <div className="mt-8">
                <p className="font-serif text-6xl tracking-tight">
                  <CountUp to={1826} />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">lessons kept in five years, one a day</p>
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal className="md:col-span-3" delay={50}>
            <SpotlightCard className="h-full">
              <FeatureHead icon={Moon} title="On this day" body="Every morning, a memory from years ago comes back to find you." />
              <OnThisDayDemo />
            </SpotlightCard>
          </Reveal>

          <Reveal className="md:col-span-3" delay={120}>
            <SpotlightCard className="h-full">
              <FeatureHead icon={Search} title="Find anything, instantly" body="One word, and years of writing answer back." />
              <SearchDemo />
            </SpotlightCard>
          </Reveal>

          <Reveal className="md:col-span-2" delay={50}>
            <SpotlightCard className="h-full">
              <FeatureHead icon={Lightbulb} title="Ideas, caught mid-flight" body="Write it down before it floats away." />
              <IdeasDemo />
            </SpotlightCard>
          </Reveal>

          <Reveal className="md:col-span-2" delay={110}>
            <SpotlightCard className="h-full">
              <FeatureHead icon={Palette} title="Make it yours" body="Your colours, your layout, your fonts. Try it:" />
              <AccentDemo />
            </SpotlightCard>
          </Reveal>

          <Reveal className="md:col-span-2" delay={170}>
            <SpotlightCard className="h-full">
              <FeatureHead icon={Download} title="Yours, forever" body="Download everything in open formats, anytime." />
              <ul className="mt-6 space-y-2 text-sm">
                {[
                  { icon: FileText, name: "journal/2026-09-30.md" },
                  { icon: FileJson, name: "yaadasht-archive.json" },
                  { icon: Camera, name: "photos/hunza-sunrise.jpg" },
                ].map(({ icon: Icon, name }) => (
                  <li key={name} className="flex items-center gap-2.5 rounded-xl bg-muted/60 px-3.5 py-2.5 transition hover:translate-x-1">
                    <Icon className="size-4 text-saffron" aria-hidden />
                    <span className="truncate font-mono text-xs">{name}</span>
                    <Download className="ml-auto size-3.5 text-muted-foreground" aria-hidden />
                  </li>
                ))}
              </ul>
            </SpotlightCard>
          </Reveal>
        </div>
      </section>

      {/* A lifetime, in weeks (pinned scroll story) */}
      <LifetimeScroll />

      {/* Privacy */}
      <section id="privacy" className="scroll-mt-24 px-5 py-24 md:px-8">
        <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.25rem] bg-[#060913] text-[#eef1fb] ring-1 ring-white/10">
          <div
            aria-hidden
            className="animate-aurora absolute -right-24 -bottom-32 size-[30rem] rounded-full bg-[radial-gradient(closest-side,rgba(61,90,254,0.35),transparent)] blur-3xl"
          />
          <div className="relative grid gap-12 px-7 py-14 md:grid-cols-2 md:px-14 md:py-20">
            <div>
              <Eyebrow>Private by design</Eyebrow>
              <h2 className="mt-4 font-serif text-4xl leading-tight tracking-[-0.025em] md:text-5xl">Your memories are yours alone.</h2>
              <p className="mt-5 max-w-md text-lg text-[#9aa6c8]">Before anything you write touches our database, it becomes this:</p>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-relaxed text-[#ffc58a]">
                <Scramble text="I want to remember how the rain smelled that night." />
              </div>
              <p className="mt-4 text-sm text-[#8f9bbd]">
                Every account has its own key. We never sell, advertise or train AI on your memories.
              </p>
            </div>
            <ul className="grid content-center gap-3 sm:grid-cols-2">
              {[
                { icon: EyeOff, t: "Private by default", d: "Nothing is public unless you share one memory." },
                { icon: Lock, t: "Encrypted at rest", d: "Your words are ciphertext in our database." },
                { icon: Sparkles, t: "AI is off", d: "Optional, and only if you turn it on." },
                { icon: Download, t: "Leave anytime", d: "Export everything in open formats." },
              ].map(({ icon: Icon, t, d }) => (
                <li key={t} className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-white/[0.07]">
                  <Icon className="size-5 text-[#ff9f43]" aria-hidden />
                  <p className="mt-3 font-medium">{t}</p>
                  <p className="mt-1 text-sm text-[#9aa6c8]">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* Final call */}
      <section className="relative overflow-hidden px-5 pt-10 pb-32 text-center">
        <div
          aria-hidden
          className="animate-glow absolute top-10 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--glow-amber)_30%,transparent),transparent)] blur-2xl"
        />
        <Reveal className="relative mx-auto max-w-3xl">
          <LogoTile className="mx-auto size-20 rounded-[1.6rem] shadow-[0_0_60px_-10px_var(--glow-amber)]" title="" />
          <h2 className="mt-8 font-serif text-5xl leading-[1.02] tracking-[-0.03em] text-balance md:text-7xl">
            What will you want to remember?
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">Start today. Your future self is already grateful.</p>
          <Link href="/sign-up" className={`${PRIMARY_CTA} mt-10 h-14 px-8 text-lg`}>
            <Sheen />
            Start remembering, free
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </Reveal>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row md:px-8">
          <div className="flex items-center gap-3">
            <LogoTile className="size-7" title="" />
            <span>
              <span className="font-serif text-lg text-foreground">Yaadasht</span>
            </span>
          </div>
          <nav className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/sign-in" className="hover:text-foreground">
              Sign in
            </Link>
            <span>Open source</span>
          </nav>
        </div>
      </footer>
    </div>
  );
}

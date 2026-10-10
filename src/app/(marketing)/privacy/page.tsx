import type { Metadata } from "next";
import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import { Logo, LogoTile } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const metadata: Metadata = { title: "Privacy" };

const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "What is protected",
    items: [
      "The contents of your memories are encrypted before they are stored in our database, so a copied database alone does not reveal what you wrote.",
      "Each account has its own encryption key. Those keys are kept outside the database, which means a stolen backup or database dump does not reveal your writing.",
      "Photos, videos and other files are kept in private storage and are only reachable through the account that uploaded them.",
      "Right now, this platform is private by default. Public sharing is not enabled.",
    ],
  },
  {
    title: "What we want you to know",
    items: [
      "We do not expose the contents of your writing to the maintainer or to the platform itself; the data is encrypted before it is stored.",
      "Some non-content metadata remains visible to support the app, such as when entries were created, how many memories you have, and how much storage you use. This does not reveal the contents of what you wrote.",
      "Sign-in is handled by Clerk, which knows your email address and sign-in methods, but never sees the contents of your memories.",
      "If you choose to email a letter or export a file, the recipient or email provider can read that content as delivered.",
    ],
  },
  {
    title: "What we will never do",
    items: [
      "Use your memories to train AI models.",
      "Send your memories to an AI service without clear action from you.",
    ],
  },
  {
    title: "Your archive is yours",
    items: [
      "You can download everything you have written and uploaded as .md and .pdf files, and you can also download any individual image or video you’ve saved.",
      "When you delete your account, your encryption key is destroyed immediately, which makes any remaining copies of your writing unreadable. Everything else is removed within 30 days.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky inset-x-0 top-0 z-50 px-3 pt-3 md:px-6">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border border-border/70 bg-background/70 px-3 shadow-soft backdrop-blur-xl md:px-4">
          <Link href="/" aria-label="Yaadasht home" className="rounded-full">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
            <Link href="/#everything" className="rounded-full px-3.5 py-2 text-foreground/80 hover:text-foreground">What you can keep</Link>
            <Link href="/#features" className="rounded-full px-3.5 py-2 text-foreground/80 hover:text-foreground">Features</Link>
            <Link href="/#privacy" className="rounded-full px-3.5 py-2 text-foreground/80 hover:text-foreground">Privacy</Link>
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Show
              when="signed-in"
              fallback={
                <>
                  <Link href="/sign-in" className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground sm:block">
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:shadow-[0_0_24px_-4px_var(--glow-amber)]"
                  >
                    Start free
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </>
              }
            >
              <Link
                href="/today"
                className="glow-border group inline-flex h-10 items-center gap-2 rounded-full bg-card/70 py-1 pr-2 pl-1 text-sm font-medium text-foreground backdrop-blur-md transition hover:bg-card hover:shadow-[0_0_28px_-6px_var(--glow-amber)]"
              >
                <LogoTile className="size-8 rounded-full ring-0" title="" />
                <span className="pl-0.5">Open Yaadasht</span>
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5 group-hover:-rotate-12">
                  <ArrowRight className="size-3.5" aria-hidden />
                </span>
              </Link>
            </Show>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-12 md:px-8">
        <h1 className="mt-10 font-serif text-[2.4rem] leading-tight text-foreground">Who can see your memories</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The honest version, in plain language. The technical details are in our open-source security documentation.
        </p>
        {SECTIONS.map((s) => (
          <section key={s.title} className="mt-12">
            <h2 className="font-serif text-2xl text-foreground">{s.title}</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-[1.02rem] leading-relaxed text-foreground/90">
              {s.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}

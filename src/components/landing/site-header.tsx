"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6">
      <div
        className={cn(
          "mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full px-3 transition-all duration-500 md:px-4",
          scrolled ? "border border-border/70 bg-background/70 shadow-soft backdrop-blur-xl" : "border border-transparent",
        )}
      >
        <Link href="/" aria-label="Yaadasht home" className="rounded-full">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          <a href="#everything" className="rounded-full px-3.5 py-2 hover:text-foreground">What you can keep</a>
          <a href="#features" className="rounded-full px-3.5 py-2 hover:text-foreground">Features</a>
          <a href="#privacy" className="rounded-full px-3.5 py-2 hover:text-foreground">Privacy</a>
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link href="/sign-in" className="hidden rounded-full px-3.5 py-2 text-sm font-medium hover:bg-muted sm:block">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:shadow-[0_0_24px_-4px_var(--glow-amber)]"
          >
            Start free
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

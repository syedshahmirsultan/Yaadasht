"use client";

import { UserButton } from "@clerk/nextjs";
import { PenLine, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, LogoTile } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "./nav-items";

export function AppShell({
  children,
  layout = "sidebar",
}: {
  children: React.ReactNode;
  layout?: "sidebar" | "topbar";
}) {
  const pathname = usePathname();
  const topbar = layout === "topbar";

  return (
    <div className={cn("min-h-dvh", !topbar && "md:grid md:grid-cols-[16.5rem_1fr]")}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      {/* Desktop top bar (layout option) */}
      {topbar && (
        <header className="sticky top-0 z-30 hidden border-b border-border/70 bg-background/85 backdrop-blur-md md:block">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
            <Link href="/today" aria-label="Yaadasht, go to Today">
              <Logo />
            </Link>
            <nav aria-label="Main" className="flex items-center gap-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground",
                      active && "bg-card font-medium text-foreground shadow-soft",
                    )}
                  >
                    <Icon className={cn("size-4", active && "text-saffron-strong")} aria-hidden />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <Link
                href="/settings"
                aria-label="Settings"
                className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Settings className="size-[1.1rem]" aria-hidden />
              </Link>
              <span className="mx-1 inline-flex">
                <UserButton />
              </span>
              <Link
                href="/write"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <PenLine className="size-4" aria-hidden />
                Write
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh flex-col border-r border-border/70 bg-sidebar px-4 py-6",
          !topbar && "md:flex",
        )}
      >
        <Link href="/today" className="px-2" aria-label="Yaadasht, go to Today">
          <Logo />
        </Link>

        <Link
          href="/write"
          className="group mt-8 flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-4 font-medium text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <PenLine className="size-4 transition-transform group-hover:-rotate-12" aria-hidden />
          Write
        </Link>

        <nav aria-label="Main" className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.95rem] text-muted-foreground transition-colors hover:bg-card hover:text-foreground",
                  active && "bg-card font-medium text-foreground shadow-soft",
                )}
              >
                <Icon className={cn("size-[1.15rem]", active && "text-saffron-strong")} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center justify-between gap-2 rounded-2xl bg-card/70 p-2 ring-1 ring-border/60">
          <UserButton />
          <div className="flex items-center">
            <ThemeToggle />
            <Link
              href="/settings"
              aria-label="Settings"
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isActive(pathname, "/settings") && "bg-muted text-foreground",
              )}
            >
              <Settings className="size-[1.1rem]" aria-hidden />
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/85 px-4 backdrop-blur-md md:hidden">
        <Link href="/today" aria-label="Yaadasht, go to Today" className="flex items-center gap-2">
          <LogoTile className="size-8" title="" />
          <span className="font-serif text-xl font-medium">Yaadasht</span>
        </Link>
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label="Settings"
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <Settings className="size-[1.1rem]" aria-hidden />
          </Link>
          <span className="ml-1 inline-flex">
            <UserButton />
          </span>
        </div>
      </header>

      <main id="main" className="min-w-0 pb-28 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <MobileTab key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}
          <li className="flex justify-center">
            <Link
              href="/write"
              aria-label="Write"
              className="-mt-7 inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift ring-4 ring-background transition active:scale-95"
            >
              <PenLine className="size-6" aria-hidden />
            </Link>
          </li>
          {NAV_ITEMS.slice(2).map((item) => (
            <MobileTab key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}
        </ul>
      </nav>
    </div>
  );
}

function MobileTab({
  href,
  label,
  icon: Icon,
  active,
}: (typeof NAV_ITEMS)[number] & { active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] text-muted-foreground",
          active && "font-medium text-foreground",
        )}
      >
        <Icon className={cn("size-5", active && "text-saffron-strong")} aria-hidden />
        {label}
      </Link>
    </li>
  );
}

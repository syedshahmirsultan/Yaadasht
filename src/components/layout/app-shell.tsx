"use client";

import { UserButton } from "@clerk/nextjs";
import { Command, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, PenLine, Search, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Logo, LogoTile } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";
import { openCommandPalette, useAppearance } from "./appearance";
import { CommandPalette, type PaletteCollection } from "./command-palette";
import { NAV_ITEMS, isActive } from "./nav-items";

/**
 * The app frame. The menu can live on the left, right, top or bottom, and the
 * side menu can collapse to a slim rail. Phones always get a top bar plus a
 * bottom tab bar.
 */
export function AppShell({ children, collections }: { children: React.ReactNode; collections: PaletteCollection[] }) {
  const pathname = usePathname();
  const { prefs, update } = useAppearance();
  const pos = prefs.navPosition;
  const side = pos === "left" || pos === "right";
  const collapsed = side && prefs.sidebarCollapsed;

  // Ctrl/Cmd + \ collapses the side menu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\" && side) {
        e.preventDefault();
        update({ sidebarCollapsed: !prefs.sidebarCollapsed });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [side, prefs.sidebarCollapsed, update]);

  const railWidth = collapsed ? "5rem" : "16.5rem";

  return (
    <div
      className={cn(
        "min-h-dvh md:transition-[grid-template-columns] md:duration-300 md:ease-[cubic-bezier(0.22,1,0.36,1)]",
        side && "md:grid",
      )}
      style={
        side
          ? ({ "--rail": railWidth, gridTemplateColumns: pos === "left" ? "var(--rail) minmax(0,1fr)" : "minmax(0,1fr) var(--rail)" } as React.CSSProperties)
          : undefined
      }
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      {pos === "left" && <Sidebar pathname={pathname} collapsed={collapsed} right={false} />}
      {pos === "top" && <TopBar pathname={pathname} />}

      {/* Phone top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/85 px-4 backdrop-blur-md md:hidden">
        <Link href="/" aria-label="Yaadasht home" className="flex items-center gap-2">
          <LogoTile className="size-8" title="" />
          <span className="font-serif text-xl font-medium">Yaadasht</span>
        </Link>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="Search or jump to"
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <Command className="size-[1.1rem]" />
          </button>
          <ThemeToggle />
          <span className="ml-1 inline-flex">
            <UserButton />
          </span>
        </div>
      </header>

      <main id="main" className={cn("min-w-0 pb-28", pos === "bottom" ? "md:pb-32" : "md:pb-0")}>
        {children}
      </main>

      {pos === "right" && <Sidebar pathname={pathname} collapsed={collapsed} right />}
      {pos === "bottom" && <Dock pathname={pathname} />}

      {/* Phone tab bar */}
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
              className="-mt-7 inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_30px_-6px_var(--glow-amber)] ring-4 ring-background transition active:scale-95"
            >
              <PenLine className="size-6" aria-hidden />
            </Link>
          </li>
          {NAV_ITEMS.slice(2).map((item) => (
            <MobileTab key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}
        </ul>
      </nav>

      <CommandPalette collections={collections} />
    </div>
  );
}

/** Label that appears beside an icon when the side menu is collapsed. */
function RailTip({ label, right }: { label: string; right: boolean }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute top-1/2 z-50 -translate-y-1/2 rounded-lg border border-border bg-popover px-2.5 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground opacity-0 shadow-lift transition group-hover/tip:opacity-100",
        right ? "right-full mr-3" : "left-full ml-3",
      )}
    >
      {label}
    </span>
  );
}

function Sidebar({ pathname, collapsed, right }: { pathname: string; collapsed: boolean; right: boolean }) {
  const { prefs, update } = useAppearance();
  const toggle = () => update({ sidebarCollapsed: !prefs.sidebarCollapsed });
  const CollapseIcon = right ? (collapsed ? PanelRightOpen : PanelRightClose) : collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh flex-col border-border/70 bg-sidebar py-5 md:flex",
        right ? "border-l" : "border-r",
        collapsed ? "items-center px-3" : "px-4",
      )}
    >
      <div className={cn("flex items-center", collapsed ? "flex-col gap-3" : "justify-between px-1")}>
        <Link href="/" aria-label="Yaadasht home" className="rounded-xl">
          {collapsed ? <LogoTile className="size-10" title="" /> : <Logo />}
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          title={`${collapsed ? "Expand" : "Collapse"} menu (Ctrl + \\)`}
          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-card hover:text-foreground"
        >
          <CollapseIcon className="size-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={openCommandPalette}
        className={cn(
          "group/tip relative mt-6 flex items-center rounded-xl border border-border bg-card/60 text-sm text-muted-foreground transition hover:border-saffron/40 hover:text-foreground",
          collapsed ? "size-11 justify-center" : "h-10 w-full gap-2 px-3",
        )}
      >
        <Search className="size-4 shrink-0" />
        {collapsed ? (
          <RailTip label="Search or jump (Ctrl K)" right={right} />
        ) : (
          <>
            <span className="flex-1 text-left">Search or jump to…</span>
            <kbd className="rounded-md border border-border bg-background px-1.5 py-0.5 font-sans text-[0.65rem]">Ctrl K</kbd>
          </>
        )}
      </button>

      <Link
        href="/write"
        className={cn(
          "group/tip relative mt-3 flex items-center justify-center gap-2 rounded-full bg-primary font-medium text-primary-foreground shadow-[0_0_28px_-10px_var(--glow-amber)] transition hover:-translate-y-0.5 hover:shadow-[0_0_36px_-6px_var(--glow-amber)]",
          collapsed ? "size-11" : "h-12 w-full px-4",
        )}
      >
        <PenLine className="size-4 shrink-0" aria-hidden />
        {collapsed ? <RailTip label="Write" right={right} /> : "Write"}
      </Link>

      <nav aria-label="Main" className={cn("mt-7 flex flex-col gap-1", collapsed && "items-center")}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? label : undefined}
              className={cn(
                "group/tip relative flex items-center rounded-xl text-[0.95rem] text-muted-foreground transition-colors hover:bg-card hover:text-foreground",
                collapsed ? "size-11 justify-center" : "gap-3 px-3.5 py-2.5",
                active && "bg-card font-medium text-foreground shadow-soft",
              )}
            >
              {active && !collapsed && (
                <span
                  aria-hidden
                  className={cn("absolute top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-saffron", right ? "-right-1" : "-left-1")}
                />
              )}
              <Icon className={cn("size-[1.15rem] shrink-0", active && "text-saffron")} aria-hidden />
              {collapsed ? <RailTip label={label} right={right} /> : label}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "mt-auto flex items-center rounded-2xl bg-card/70 p-2 ring-1 ring-border/60",
          collapsed ? "flex-col gap-2" : "w-full justify-between gap-2",
        )}
      >
        <UserButton />
        <div className={cn("flex items-center", collapsed && "flex-col")}>
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
  );
}

function TopBar({ pathname }: { pathname: string }) {
  return (
    <header className="sticky top-0 z-30 hidden border-b border-border/70 bg-background/80 backdrop-blur-xl md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-5 px-6">
        <Link href="/" aria-label="Yaadasht home">
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
                <Icon className={cn("size-4", active && "text-saffron")} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={openCommandPalette}
            className="mr-1 inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card/60 px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <Search className="size-4" />
            <kbd className="font-sans text-xs">Ctrl K</kbd>
          </button>
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
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_0_28px_-8px_var(--glow-amber)] transition hover:-translate-y-0.5"
          >
            <PenLine className="size-4" aria-hidden />
            Write
          </Link>
        </div>
      </div>
    </header>
  );
}

/** A floating dock at the bottom of the screen. Icons lift toward the pointer. */
function Dock({ pathname }: { pathname: string }) {
  const item =
    "group/tip relative inline-flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-[translate,scale,color,background-color] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-2 hover:scale-115 hover:bg-card hover:text-foreground";
  const tip = (label: string) => (
    <span className="pointer-events-none absolute bottom-full mb-3 rounded-lg border border-border bg-popover px-2.5 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground opacity-0 shadow-lift transition group-hover/tip:opacity-100">
      {label}
    </span>
  );
  return (
    <nav
      aria-label="Main"
      className="fixed bottom-5 left-1/2 z-40 hidden -translate-x-1/2 items-center gap-1 rounded-[1.4rem] border border-border/80 bg-background/75 p-2 shadow-lift backdrop-blur-xl md:flex"
    >
      <Link href="/" aria-label="Yaadasht home" className={item}>
        <LogoTile className="size-9" title="" />
        {tip("Home")}
      </Link>
      <span className="mx-1 h-7 w-px bg-border" />
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link key={href} href={href} aria-label={label} aria-current={active ? "page" : undefined} className={cn(item, active && "bg-card text-foreground")}>
            <Icon className={cn("size-5", active && "text-saffron")} />
            {active && <span aria-hidden className="absolute -bottom-0.5 size-1 rounded-full bg-saffron" />}
            {tip(label)}
          </Link>
        );
      })}
      <Link
        href="/write"
        aria-label="Write"
        className="group/tip relative mx-1 inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_30px_-6px_var(--glow-amber)] transition-[translate,scale] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-2 hover:scale-110"
      >
        <PenLine className="size-5" />
        {tip("Write")}
      </Link>
      <span className="mx-1 h-7 w-px bg-border" />
      <button type="button" onClick={openCommandPalette} aria-label="Search or jump" className={item}>
        <Command className="size-5" />
        {tip("Search or jump (Ctrl K)")}
      </button>
      <ThemeToggle className="size-11 rounded-xl" />
      <Link href="/settings" aria-label="Settings" className={item}>
        <Settings className="size-5" />
        {tip("Settings")}
      </Link>
      <span className="mx-1 inline-flex">
        <UserButton />
      </span>
    </nav>
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
        <Icon className={cn("size-5", active && "text-saffron")} aria-hidden />
        {label}
      </Link>
    </li>
  );
}

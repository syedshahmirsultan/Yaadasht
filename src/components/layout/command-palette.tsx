"use client";

import {
  ArrowRight,
  CalendarDays,
  CornerDownLeft,
  Folder,
  Library,
  Monitor,
  Moon,
  PanelBottom,
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelTop,
  PenLine,
  Search,
  Settings,
  Sun,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { COLLECTION_ICONS } from "@/components/collection-style";
import { Portal } from "@/components/ui/portal";
import type { NavPosition } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { useAppearance } from "./appearance";

export type PaletteCollection = { id: string; name: string; icon: string };

type Item = { id: string; group: string; label: string; icon: LucideIcon; keywords?: string; run: () => void };

/** Ctrl/Cmd + K: jump anywhere, search memories, write, or change how Yaadasht looks. */
export function CommandPalette({ collections }: { collections: PaletteCollection[] }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { prefs, update } = useAppearance();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("yd:open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("yd:open-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
    setIndex(0);
  }
  const go = (href: string) => () => {
    router.push(href);
    close();
  };
  const nav = (p: NavPosition) => () => {
    update({ navPosition: p });
    close();
  };

  const items = useMemo<Item[]>(() => {
    const base: Item[] = [
      { id: "write", group: "Actions", label: "Write a new memory", icon: PenLine, keywords: "new create journal note", run: go("/write") },
      { id: "today", group: "Go to", label: "Today", icon: Sun, keywords: "home", run: go("/today") },
      { id: "timeline", group: "Go to", label: "Timeline", icon: CalendarDays, keywords: "years history", run: go("/timeline") },
      { id: "collections", group: "Go to", label: "Collections", icon: Library, run: go("/collections") },
      { id: "search", group: "Go to", label: "Search", icon: Search, run: go("/search") },
      { id: "trash", group: "Go to", label: "Trash", icon: Trash2, keywords: "deleted restore", run: go("/trash") },
      { id: "settings", group: "Go to", label: "Settings", icon: Settings, keywords: "account preferences", run: go("/settings") },
      ...collections.map((c) => ({
        id: `col-${c.id}`,
        group: "Collections",
        label: c.name,
        icon: COLLECTION_ICONS[c.icon] ?? Folder,
        keywords: "collection open",
        run: go(`/collections/${c.id}`),
      })),
      { id: "light", group: "Appearance", label: "Light mode", icon: Sun, keywords: "theme", run: () => (setTheme("light"), close()) },
      { id: "dark", group: "Appearance", label: "Dark mode", icon: Moon, keywords: "theme night", run: () => (setTheme("dark"), close()) },
      { id: "system", group: "Appearance", label: "Match device theme", icon: Monitor, keywords: "theme system", run: () => (setTheme("system"), close()) },
      { id: "nav-left", group: "Layout", label: "Menu on the left", icon: PanelLeft, keywords: "sidebar navigation layout", run: nav("left") },
      { id: "nav-right", group: "Layout", label: "Menu on the right", icon: PanelRight, keywords: "sidebar navigation layout", run: nav("right") },
      { id: "nav-top", group: "Layout", label: "Menu at the top", icon: PanelTop, keywords: "header navigation layout", run: nav("top") },
      { id: "nav-bottom", group: "Layout", label: "Menu as a bottom dock", icon: PanelBottom, keywords: "dock navigation layout", run: nav("bottom") },
    ];
    if (prefs.navPosition === "left" || prefs.navPosition === "right") {
      base.push({
        id: "collapse",
        group: "Layout",
        label: prefs.sidebarCollapsed ? "Expand the menu" : "Collapse the menu",
        icon: PanelLeftClose,
        keywords: "sidebar rail",
        run: () => {
          update({ sidebarCollapsed: !prefs.sidebarCollapsed });
          close();
        },
      });
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collections, prefs.navPosition, prefs.sidebarCollapsed]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter((i) => `${i.label} ${i.group} ${i.keywords ?? ""}`.toLowerCase().includes(q))
    : items;
  const results: Item[] = q
    ? [
        {
          id: "search-q",
          group: "Search your memories",
          label: `Search for “${query.trim()}”`,
          icon: Search,
          run: go(`/search?q=${encodeURIComponent(query.trim())}`),
        },
        ...filtered,
      ]
    : filtered;
  const active = Math.min(index, Math.max(0, results.length - 1));

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[active]?.run();
    } else if (e.key === "Escape") {
      close();
    }
  }

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  let lastGroup = "";
  return (
    <Portal>
      <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/45 px-4 pt-[12vh] backdrop-blur-sm" onClick={close}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search or jump to"
          onClick={(e) => e.stopPropagation()}
          className="animate-rise w-full max-w-xl overflow-hidden rounded-[1.4rem] border border-border bg-popover shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),0_0_0_1px_color-mix(in_oklab,var(--glow-amber)_12%,transparent)]"
        >
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="size-5 text-saffron" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIndex(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search memories, jump anywhere, change layout…"
              aria-label="Command"
              className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded-md border border-border px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">Esc</kbd>
          </div>

          <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2" role="listbox">
            {results.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing matches that.</p>}
            {results.map((item, i) => {
              const header = item.group !== lastGroup ? item.group : null;
              lastGroup = item.group;
              const Icon = item.icon;
              return (
                <div key={item.id}>
                  {header && <p className="px-3 pt-3 pb-1.5 text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{header}</p>}
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    data-index={i}
                    onMouseMove={() => setIndex(i)}
                    onClick={item.run}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      i === active ? "bg-accent text-accent-foreground" : "text-foreground/90",
                    )}
                  >
                    <span className={cn("inline-flex size-8 items-center justify-center rounded-lg", i === active ? "bg-background/60" : "bg-muted")}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {i === active ? <CornerDownLeft className="size-4 opacity-70" /> : <ArrowRight className="size-4 opacity-0" />}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            <span>↑ ↓ to move · Enter to open</span>
            <span>Ctrl K anytime</span>
          </div>
        </div>
      </div>
    </Portal>
  );
}

"use client";

import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { COLLECTION_COLORS, COLLECTION_ICONS } from "@/components/collection-style";
import { formatMemoryDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PickerCollection = { id: string; name: string; color: string; icon: string };

/** A styled collection menu (replaces the browser's plain select). */
export function CollectionPicker({
  value,
  onChange,
  collections,
}: {
  value: string;
  onChange: (id: string) => void;
  collections: PickerCollection[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = collections.find((c) => c.id === value);
  const Icon = COLLECTION_ICONS[current?.icon ?? "folder"] ?? COLLECTION_ICONS.folder;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium shadow-soft transition hover:-translate-y-0.5",
          COLLECTION_COLORS[current?.color ?? "saffron"],
        )}
      >
        <Icon className="size-4" aria-hidden />
        {current?.name ?? "Collection"}
        <ChevronDown className={cn("size-3.5 opacity-70 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Collection"
          className="animate-rise absolute top-full left-0 z-30 mt-2 w-64 rounded-2xl border border-border bg-popover p-1.5 shadow-lift"
        >
          <p className="px-2.5 pt-1.5 pb-2 text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Keep it in</p>
          {collections.map((c) => {
            const I = COLLECTION_ICONS[c.icon] ?? COLLECTION_ICONS.folder;
            const selected = c.id === value;
            return (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted",
                  selected && "bg-muted",
                )}
              >
                <span className={cn("inline-flex size-8 items-center justify-center rounded-lg", COLLECTION_COLORS[c.color])}>
                  <I className="size-4" aria-hidden />
                </span>
                <span className="flex-1 font-medium">{c.name}</span>
                {selected && <Check className="size-4 text-saffron" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Shows the memory date in words; opens the calendar on click. */
export function DatePill({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const el = input.current;
          if (!el) return;
          if (typeof el.showPicker === "function") el.showPicker();
          else el.focus();
        }}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm font-medium shadow-soft transition hover:-translate-y-0.5 hover:border-saffron/50"
      >
        <CalendarDays className="size-4 text-saffron" aria-hidden />
        {formatMemoryDate(value, "long")}
      </button>
      <input
        ref={input}
        type="date"
        value={value}
        max="2100-12-31"
        onChange={(e) => e.target.value && onChange(e.target.value)}
        aria-label="Memory date"
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 opacity-0 [color-scheme:light] dark:[color-scheme:dark]"
      />
    </div>
  );
}

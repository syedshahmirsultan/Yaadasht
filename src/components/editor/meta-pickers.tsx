"use client";

import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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

/** Shows the memory date in words; opens an elegant calendar popover on click. Defaults to today. */
export function DatePill({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const todayIso = new Date().toISOString().slice(0, 10);
  const currentDate = value || todayIso;
  const [vy, vm] = currentDate.split("-").map(Number);

  const [viewYear, setViewYear] = useState(vy || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState((vm || new Date().getMonth() + 1) - 1);

  useEffect(() => {
    if (!open) return;
    const [y, m] = (value || todayIso).split("-").map(Number);
    if (y && m) {
      setViewYear(y);
      setViewMonth(m - 1);
    }
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
  }, [open, value, todayIso]);

  const monthStart = new Date(Date.UTC(viewYear, viewMonth, 1));
  const monthEnd = new Date(Date.UTC(viewYear, viewMonth + 1, 0));
  const startDay = monthStart.getUTCDay();
  const daysInMonth = monthEnd.getUTCDate();
  const prevMonthEnd = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();

  const calendarDays: { iso: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevMonthEnd - i;
    const pm = viewMonth === 0 ? 11 : viewMonth - 1;
    const py = viewMonth === 0 ? viewYear - 1 : viewYear;
    const iso = `${py}-${String(pm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push({ iso, dayNum: d, isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push({ iso, dayNum: d, isCurrentMonth: true });
  }

  const remaining = 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    const nm = viewMonth === 11 ? 0 : viewMonth + 1;
    const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
    const iso = `${ny}-${String(nm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push({ iso, dayNum: d, isCurrentMonth: false });
  }

  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    monthStart,
  );

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function pickDate(iso: string) {
    onChange(iso);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm font-medium shadow-soft transition hover:-translate-y-0.5 hover:border-saffron/50"
      >
        <CalendarDays className="size-4 text-saffron" aria-hidden />
        {formatMemoryDate(currentDate, "long")}
        <ChevronDown className={cn("size-3.5 opacity-70 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Calendar date picker"
          className="animate-rise absolute top-full left-0 z-30 mt-2 w-72 rounded-2xl border border-border bg-popover p-4 shadow-lift select-none"
        >
          <div className="flex items-center justify-between pb-3">
            <span className="text-sm font-semibold text-foreground">{monthName}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
                className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-[0.7rem] font-semibold text-muted-foreground uppercase pb-1.5">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calendarDays.map(({ iso, dayNum, isCurrentMonth }) => {
              const isSelected = iso === currentDate;
              const isToday = iso === todayIso;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => pickDate(iso)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl transition font-medium",
                    !isCurrentMonth && "text-muted-foreground/40",
                    isCurrentMonth && !isSelected && "hover:bg-muted text-foreground",
                    isSelected && "bg-saffron text-white shadow-soft font-semibold",
                    isToday && !isSelected && "ring-1.5 ring-saffron text-saffron font-bold",
                  )}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => pickDate(todayIso)}
              className="rounded-lg px-2.5 py-1 text-saffron hover:bg-saffron/10 font-medium"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const yst = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                pickDate(yst);
              }}
              className="rounded-lg px-2.5 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Yesterday
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

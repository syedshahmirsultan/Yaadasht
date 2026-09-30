"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useOptimistic, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";
import { preferenceAttributes, type Preferences } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { updatePreferences } from "@/server/preferences";

const THEMES = [
  { value: "light", label: "Paper", icon: Sun },
  { value: "dark", label: "Night ink", icon: Moon },
  { value: "system", label: "Match device", icon: Monitor },
] as const;

const ACCENT_SWATCHES: { value: Preferences["accent"]; label: string; color: string }[] = [
  { value: "saffron", label: "Amber", color: "#ea7a14" },
  { value: "rose", label: "Rose", color: "#c0566a" },
  { value: "sage", label: "Sage", color: "#5f8a5a" },
  { value: "ocean", label: "Ocean", color: "#3a7ca5" },
  { value: "plum", label: "Plum", color: "#7d5ba6" },
];

function Group({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-medium">{label}</p>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Choice({
  selected,
  onSelect,
  children,
  className,
  label,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-2xl border border-border bg-background/60 px-3 py-4 text-sm transition hover:-translate-y-0.5 hover:bg-card hover:shadow-soft",
        selected && "border-saffron bg-card shadow-soft ring-2 ring-saffron/25",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function AppearancePicker({ initial }: { initial: Preferences }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [prefs, setOptimistic] = useOptimistic(initial, (cur, patch: Partial<Preferences>) => ({ ...cur, ...patch }));
  const [, startTransition] = useTransition();

  function choose(patch: Partial<Preferences>) {
    // Apply instantly, then save to the account in the background.
    const attrs = preferenceAttributes({ ...prefs, ...patch });
    for (const [k, v] of Object.entries(attrs)) document.documentElement.setAttribute(k, v);
    startTransition(async () => {
      setOptimistic(patch);
      const res = await updatePreferences(patch);
      if (!res.ok) toast.error("We couldn't save that change. Please try again.");
    });
  }

  return (
    <div className="space-y-8 rounded-2xl border border-border bg-card p-5 shadow-soft md:p-6">
      <Group label="Theme">
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <Choice key={value} label={label} selected={mounted && theme === value} onSelect={() => setTheme(value)}>
              <Icon className="size-5" aria-hidden />
              {label}
            </Choice>
          ))}
        </div>
      </Group>

      <Group label="Accent colour" hint="Used for highlights, links and little touches across Yaadasht.">
        <div role="radiogroup" aria-label="Accent colour" className="flex flex-wrap gap-3">
          {ACCENT_SWATCHES.map((a) => {
            const selected = prefs.accent === a.value;
            return (
              <button
                key={a.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose({ accent: a.value })}
                className="group flex flex-col items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className={cn(
                    "inline-flex size-11 items-center justify-center rounded-full shadow-soft ring-offset-2 ring-offset-card transition group-hover:scale-105",
                    selected && "ring-2 ring-foreground/70",
                  )}
                  style={{ background: a.color }}
                >
                  {selected && <Check className="size-5 text-white" aria-hidden />}
                </span>
                <span className={cn(selected && "font-medium text-foreground")}>{a.label}</span>
              </button>
            );
          })}
        </div>
      </Group>

      <Group label="Navigation" hint="Where your main menu lives on larger screens.">
        <div role="radiogroup" aria-label="Navigation layout" className="grid grid-cols-2 gap-2">
          <Choice label="Sidebar" selected={prefs.layout === "sidebar"} onSelect={() => choose({ layout: "sidebar" })}>
            <span aria-hidden className="flex h-14 w-24 gap-1 rounded-lg border border-border bg-background p-1">
              <span className="w-6 rounded bg-muted" />
              <span className="flex-1 rounded bg-card" />
            </span>
            Sidebar
          </Choice>
          <Choice label="Top bar" selected={prefs.layout === "topbar"} onSelect={() => choose({ layout: "topbar" })}>
            <span aria-hidden className="flex h-14 w-24 flex-col gap-1 rounded-lg border border-border bg-background p-1">
              <span className="h-3 rounded bg-muted" />
              <span className="flex-1 rounded bg-card" />
            </span>
            Top bar
          </Choice>
        </div>
      </Group>

      <Group label="Writing font" hint="The typeface for your memories.">
        <div role="radiogroup" aria-label="Writing font" className="grid grid-cols-2 gap-2">
          <Choice label="Classic serif" selected={prefs.writingFont === "serif"} onSelect={() => choose({ writingFont: "serif" })}>
            <span className="font-serif text-3xl leading-none">Aa</span>
            Classic
          </Choice>
          <Choice label="Clean sans" selected={prefs.writingFont === "sans"} onSelect={() => choose({ writingFont: "sans" })}>
            <span className="font-sans text-3xl leading-none">Aa</span>
            Clean
          </Choice>
        </div>
      </Group>

      <Group label="Text size">
        <div role="radiogroup" aria-label="Text size" className="grid grid-cols-3 gap-2">
          {(["small", "medium", "large"] as const).map((size, i) => (
            <Choice key={size} label={size} selected={prefs.textSize === size} onSelect={() => choose({ textSize: size })}>
              <span className="leading-none font-medium" style={{ fontSize: `${1 + i * 0.3}rem` }}>
                A
              </span>
              <span className="capitalize">{size}</span>
            </Choice>
          ))}
        </div>
      </Group>
    </div>
  );
}

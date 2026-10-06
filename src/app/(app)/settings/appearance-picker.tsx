"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { useAppearance } from "@/components/layout/appearance";
import type { NavPosition, Preferences } from "@/lib/preferences";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Paper", icon: Sun },
  { value: "dark", label: "Night ink", icon: Moon },
  { value: "system", label: "Match device", icon: Monitor },
] as const;

const ACCENT_SWATCHES: { value: Preferences["accent"]; label: string; color: string }[] = [
  { value: "default", label: "Default", color: "linear-gradient(135deg, #0f1426 50%, #fbfaf7 50%)" },
  { value: "saffron", label: "Amber", color: "#ea7a14" },
  { value: "rose", label: "Rose", color: "#c0566a" },
  { value: "sage", label: "Sage", color: "#5f8a5a" },
  { value: "ocean", label: "Ocean", color: "#3a7ca5" },
  { value: "plum", label: "Plum", color: "#7d5ba6" },
  { value: "emerald", label: "Emerald", color: "#059669" },
  { value: "violet", label: "Violet", color: "#7c3aed" },
  { value: "amber", label: "Gold", color: "#d97706" },
  { value: "crimson", label: "Crimson", color: "#e11d48" },
  { value: "coral", label: "Coral", color: "#ea580c" },
];

const NAV_CHOICES: { value: NavPosition; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom dock" },
];

/** A tiny sketch of each layout. */
function NavPreview({ position }: { position: NavPosition }) {
  const bar = "rounded bg-saffron/60";
  return (
    <span aria-hidden className={cn("flex h-14 w-24 gap-1 rounded-lg border border-border bg-background p-1", (position === "top" || position === "bottom") && "flex-col")}>
      {position === "left" && <span className={cn("w-5", bar)} />}
      {position === "top" && <span className={cn("h-2.5", bar)} />}
      <span className="relative flex-1 rounded bg-card">
        {position === "bottom" && <span className={cn("absolute bottom-1 left-1/2 h-2 w-10 -translate-x-1/2", bar)} />}
      </span>
      {position === "right" && <span className={cn("w-5", bar)} />}
    </span>
  );
}

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

export function AppearancePicker() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const { prefs, update: choose } = useAppearance();

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

      <Group label="Navigation" hint="Put your menu wherever feels right. On phones it always sits at the bottom.">
        <div role="radiogroup" aria-label="Menu position" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {NAV_CHOICES.map((n) => (
            <Choice key={n.value} label={n.label} selected={prefs.navPosition === n.value} onSelect={() => choose({ navPosition: n.value })}>
              <NavPreview position={n.value} />
              {n.label}
            </Choice>
          ))}
        </div>
        {(prefs.navPosition === "left" || prefs.navPosition === "right") && (
          <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border bg-background/60 px-4 py-3">
            <span>
              <span className="block text-sm font-medium">Slim menu</span>
              <span className="block text-xs text-muted-foreground">Icons only, more room to write. Shortcut: Ctrl + \</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.sidebarCollapsed}
              onClick={() => choose({ sidebarCollapsed: !prefs.sidebarCollapsed })}
              className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", prefs.sidebarCollapsed ? "bg-saffron" : "bg-muted")}
            >
              <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", prefs.sidebarCollapsed && "translate-x-5")} />
            </button>
          </label>
        )}
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

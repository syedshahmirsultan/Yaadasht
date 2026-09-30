"use client";

import { createContext, useCallback, useContext, useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { preferenceAttributes, type Preferences } from "@/lib/preferences";
import { updatePreferences } from "@/server/preferences";

type Ctx = { prefs: Preferences; update: (patch: Partial<Preferences>) => void };

const AppearanceContext = createContext<Ctx | null>(null);

/**
 * One source of truth for appearance choices inside the app. Changes apply
 * instantly (optimistic), then save to the account in the background.
 */
export function AppearanceProvider({ initial, children }: { initial: Preferences; children: React.ReactNode }) {
  const [prefs, setOptimistic] = useOptimistic(initial, (cur, patch: Partial<Preferences>) => ({ ...cur, ...patch }));
  const [, start] = useTransition();

  const update = useCallback(
    (patch: Partial<Preferences>) => {
      const attrs = preferenceAttributes({ ...prefs, ...patch });
      for (const [k, v] of Object.entries(attrs)) document.documentElement.setAttribute(k, v);
      start(async () => {
        setOptimistic(patch);
        const res = await updatePreferences(patch);
        if (!res.ok) toast.error("We couldn't save that change. Please try again.");
      });
    },
    [prefs, setOptimistic],
  );

  return <AppearanceContext.Provider value={{ prefs, update }}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): Ctx {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used inside AppearanceProvider");
  return ctx;
}

/** Opens the command palette from anywhere. */
export function openCommandPalette() {
  window.dispatchEvent(new Event("yd:open-palette"));
}

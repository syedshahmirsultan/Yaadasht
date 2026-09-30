"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/** Switches between light and dark. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // The saved theme is only known in the browser; keep the first render identical to the server's.
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const next = resolvedTheme === "dark" ? "light" : "dark";
  const label = mounted ? `Switch to ${next} mode` : "Switch between light and dark mode";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <Sun className="size-[1.1rem] dark:hidden" aria-hidden />
      <Moon className="hidden size-[1.1rem] dark:block" aria-hidden />
    </button>
  );
}

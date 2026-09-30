"use client";

import { Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

/** Updates results as you type (debounced), keeping the query in the URL. */
export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  function update(v: string) {
    setValue(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      start(() => router.replace(v.trim() ? `${pathname}?q=${encodeURIComponent(v)}` : pathname, { scroll: false }));
    }, 250);
  }

  return (
    <label className="animate-rise mt-6 flex h-14 items-center gap-3 rounded-2xl border border-input bg-card px-4 shadow-soft focus-within:ring-3 focus-within:ring-ring/40">
      {pending ? <Loader2 className="size-5 animate-spin text-saffron" aria-hidden /> : <Search className="size-5 text-muted-foreground" aria-hidden />}
      <span className="sr-only">Search your memories</span>
      <input
        ref={input}
        type="search"
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder="Search your memories"
        className="h-full flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => update("")} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      )}
    </label>
  );
}

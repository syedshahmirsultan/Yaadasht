"use client";

import { Hash, X } from "lucide-react";
import { useId, useState } from "react";

/** Tags as small chips. Enter or comma adds one; Backspace on empty removes the last. */
export function TagInput({
  value,
  onChange,
  suggestions,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}) {
  const [draft, setDraft] = useState("");
  const listId = useId();

  function add(raw: string) {
    const t = raw.replace(/^#/, "").trim().slice(0, 40);
    if (!t || value.some((v) => v.toLowerCase() === t.toLowerCase()) || value.length >= 20) return;
    onChange([...value, t]);
  }

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-sm shadow-soft">
      <Hash className="size-3.5 text-muted-foreground" aria-hidden />
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
          {t}
          <button
            type="button"
            aria-label={`Remove tag ${t}`}
            onClick={() => onChange(value.filter((v) => v !== t))}
            className="rounded-full opacity-70 hover:opacity-100"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        list={listId}
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(",")) {
            add(v.slice(0, -1));
            setDraft("");
          } else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
            setDraft("");
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => {
          if (draft) {
            add(draft);
            setDraft("");
          }
        }}
        placeholder={value.length ? "" : "Add tags"}
        aria-label="Add a tag"
        className="w-24 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
      />
      <datalist id={listId}>
        {suggestions
          .filter((s) => !value.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  );
}

"use client";

import { Check, Loader2, Plus, Settings2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { COLLECTION_COLORS, COLLECTION_ICONS } from "@/components/collection-style";
import { Portal } from "@/components/ui/portal";
import { cn } from "@/lib/utils";
import { createCollectionAction, deleteCollectionAction, updateCollectionAction } from "@/server/actions";

const COLORS = ["saffron", "sage", "dusk", "rose", "sky"] as const;
const ICONS = ["book-open", "lightbulb", "sparkles", "folder", "plane", "heart", "briefcase", "graduation-cap"] as const;

type Existing = { id: string; name: string; color: string; icon: string; custom: boolean };

/** Create a collection, or edit an existing one (name, colour, icon, delete when empty). */
export function CollectionDialog({ existing }: { existing?: Existing }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(existing?.name ?? "");
  const [color, setColor] = useState<string>(existing?.color ?? "rose");
  const [icon, setIcon] = useState<string>(existing?.icon ?? "folder");
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    start(async () => {
      if (existing) {
        const res = await updateCollectionAction(existing.id, existing.custom ? { name, color, icon } : { color, icon });
        if (!res.ok) return void toast.error("Couldn't save the collection.");
        toast.success("Collection updated");
      } else {
        const res = await createCollectionAction({ name, color, icon });
        if (!res.ok) return void toast.error("Couldn't create the collection.");
        toast.success(`"${name.trim()}" created`);
        router.push(`/collections/${res.id}`);
      }
      setOpen(false);
      router.refresh();
    });
  }

  function remove() {
    if (!existing) return;
    start(async () => {
      const res = await deleteCollectionAction(existing.id);
      if (res === "ok") {
        toast.success("Collection deleted");
        router.push("/collections");
      } else if (res === "not-empty") {
        toast.error("This collection still has memories. Move or delete them first, so nothing is lost.");
      } else {
        toast.error("Journal, Learnings and Ideas can't be deleted.");
      }
    });
  }

  const Icon = COLLECTION_ICONS[icon] ?? COLLECTION_ICONS.folder;

  return (
    <>
      {existing ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Edit collection"
          className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-soft hover:text-foreground"
        >
          <Settings2 className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
        >
          <Plus className="size-4" />
          New collection
        </button>
      )}

      {open && (
        <Portal>
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <form
            role="dialog"
            aria-modal="true"
            aria-label={existing ? "Edit collection" : "New collection"}
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="animate-rise w-full max-w-md rounded-[1.75rem] border border-border bg-popover p-6 shadow-lift"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl">{existing ? "Edit collection" : "New collection"}</h2>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <span className={cn("inline-flex size-12 shrink-0 items-center justify-center rounded-2xl transition", COLLECTION_COLORS[color])}>
                <Icon className="size-5" />
              </span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={existing && !existing.custom}
                maxLength={60}
                placeholder="Books, Travel, Career…"
                aria-label="Collection name"
                className="h-12 flex-1 rounded-xl border border-input bg-background px-4 text-lg outline-none focus:ring-3 focus:ring-ring/40 disabled:opacity-60"
              />
            </div>

            <p className="mt-6 text-sm font-medium">Colour</p>
            <div className="mt-2 flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => setColor(c)}
                  className={cn("inline-flex size-9 items-center justify-center rounded-full transition hover:scale-110", COLLECTION_COLORS[c], color === c && "ring-2 ring-foreground/60 ring-offset-2 ring-offset-popover")}
                >
                  {color === c && <Check className="size-4" />}
                </button>
              ))}
            </div>

            <p className="mt-5 text-sm font-medium">Icon</p>
            <div className="mt-2 grid grid-cols-8 gap-1.5">
              {ICONS.map((i) => {
                const I = COLLECTION_ICONS[i];
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={i}
                    onClick={() => setIcon(i)}
                    className={cn("inline-flex aspect-square items-center justify-center rounded-xl border border-border transition hover:bg-muted", icon === i && "border-saffron bg-accent text-accent-foreground")}
                  >
                    <I className="size-4" />
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              {existing?.custom ? (
                <button type="button" onClick={remove} disabled={pending} className="text-sm text-destructive hover:underline">
                  Delete collection
                </button>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={pending || !name.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                {existing ? "Save" : "Create"}
              </button>
            </div>
          </form>
        </div>
        </Portal>
      )}
    </>
  );
}

"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { formatMemoryDate } from "@/lib/format";
import { deleteForeverAction, emptyTrashAction, restoreEntryAction } from "@/server/actions";

type Item = { id: string; title: string | null; excerpt: string; memoryDate: string };

export function TrashList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<unknown>, message: string) =>
    start(async () => {
      await fn();
      toast.success(message);
      router.refresh();
    });

  return (
    <div className="mt-8">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm(`Delete ${items.length} ${items.length === 1 ? "memory" : "memories"} forever? This can't be undone.`)) {
              run(emptyTrashAction, "Trash emptied");
            }
          }}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-destructive/40 px-4 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="size-4" />
          Empty Trash
        </button>
      </div>
      <ul className="space-y-3">
        {items.map((e) => (
          <li key={e.id} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{formatMemoryDate(e.memoryDate, "short")}</p>
              <p className="mt-1 font-serif text-lg">{e.title || "Untitled memory"}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.excerpt}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => restoreEntryAction(e.id), "Memory restored")}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm hover:bg-muted"
              >
                <RotateCcw className="size-4" />
                Restore
              </button>
              <button
                type="button"
                disabled={pending}
                aria-label="Delete forever"
                title="Delete forever"
                onClick={() => {
                  if (window.confirm("Delete this memory forever? This can't be undone.")) {
                    run(() => deleteForeverAction(e.id), "Deleted forever");
                  }
                }}
                className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

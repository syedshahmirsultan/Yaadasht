"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatMemoryDate } from "@/lib/format";
import { deleteForeverAction, emptyTrashAction, restoreEntryAction } from "@/server/actions";

type Item = { id: string; title: string | null; excerpt: string; memoryDate: string };

export function TrashList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [emptyConfirmOpen, setEmptyConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
          onClick={() => setEmptyConfirmOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-destructive/40 px-4 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="size-4" />
          Empty Trash
        </button>
      </div>

      <ConfirmDialog
        open={emptyConfirmOpen}
        title="Empty Trash?"
        description={`Are you sure you want to delete ${items.length} ${items.length === 1 ? "memory" : "memories"} forever? This action cannot be undone.`}
        confirmLabel="Empty Trash"
        onConfirm={() => {
          setEmptyConfirmOpen(false);
          run(emptyTrashAction, "Trash emptied");
        }}
        onCancel={() => setEmptyConfirmOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete memory forever?"
        description="Are you sure you want to delete this memory forever? This action cannot be undone."
        confirmLabel="Delete forever"
        onConfirm={() => {
          if (deleteId) {
            const id = deleteId;
            setDeleteId(null);
            run(() => deleteForeverAction(id), "Deleted forever");
          }
        }}
        onCancel={() => setDeleteId(null)}
      />

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
                onClick={() => setDeleteId(e.id)}
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

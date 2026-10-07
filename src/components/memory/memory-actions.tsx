"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { restoreEntryAction, trashEntryAction } from "@/server/actions";

/** Move to Trash, with an Undo that brings it straight back. */
export function MemoryActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function trash() {
    start(async () => {
      await trashEntryAction(id);
      router.push("/today");
      toast("Moved to Trash", {
        description: "It stays there for 30 days.",
        action: {
          label: "Undo",
          onClick: async () => {
            await restoreEntryAction(id);
            router.push(`/m/${id}`);
          },
        },
      });
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={pending}
        aria-label="Move to Trash"
        title="Move to Trash"
        className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="Move memory to Trash?"
        description="This memory will move to Trash, where you can restore it within 30 days."
        confirmLabel="Move to Trash"
        onConfirm={() => {
          setConfirmOpen(false);
          trash();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";
import { Portal } from "@/components/ui/portal";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
  onCancel: () => void;
};

/** An elegant custom confirmation modal dialog (replaces browser's plain window.confirm). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Remove",
  cancelLabel = "Cancel",
  variant = "destructive",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onCancel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="animate-rise w-full max-w-md rounded-[1.75rem] border border-border bg-popover p-6 shadow-lift text-popover-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shrink-0">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <h3 className="font-serif text-xl font-medium">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={
                variant === "destructive"
                  ? "inline-flex h-10 items-center justify-center rounded-full bg-destructive px-5 text-sm font-medium text-destructive-foreground shadow-soft transition hover:opacity-90"
                  : "inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90"
              }
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

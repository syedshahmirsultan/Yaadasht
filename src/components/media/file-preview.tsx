"use client";

import { ChevronDown, Download, FileText, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { AttachmentView } from "@/server/attachments";

const TEXT_TYPES = /^(text\/|application\/(json|xml|x-yaml|yaml|csv|markdown))/;
const MAX_TEXT_BYTES = 512 * 1024;

export function isPreviewable(a: AttachmentView) {
  return Boolean(a.url) && (a.mimeType === "application/pdf" || TEXT_TYPES.test(a.mimeType) || /\.(txt|md|csv|json|log)$/i.test(a.filename));
}

/** Shows the contents of a PDF or text file right inside the memory. */
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function FilePreview({ a, onRemove }: { a: AttachmentView; onRemove?: () => void }) {
  const isPdf = a.mimeType === "application/pdf" || /\.pdf$/i.test(a.filename);
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (isPdf || !a.url) return;
    if (a.sizeBytes > MAX_TEXT_BYTES) return;
    let cancelled = false;
    fetch(a.url)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((t) => !cancelled && setText(t))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [a.url, a.sizeBytes, isPdf]);

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <FileText className="size-4" />
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{a.filename}</p>
        {a.downloadUrl && (
          <a href={a.downloadUrl} className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Download ${a.filename}`}>
            <Download className="size-4" />
          </a>
        )}
        {onRemove && (
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              aria-label={`Remove ${a.filename}`}
              className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
            <ConfirmDialog
              open={confirmOpen}
              title="Remove file?"
              description={`Are you sure you want to remove "${a.filename}" from this memory?`}
              confirmLabel="Remove"
              onConfirm={() => {
                setConfirmOpen(false);
                onRemove();
              }}
              onCancel={() => setConfirmOpen(false)}
            />
          </>
        )}
      </div>

      {isPdf ? (
        <iframe src={a.url!} title={a.filename} className="h-[70vh] w-full bg-white" />
      ) : a.sizeBytes > MAX_TEXT_BYTES ? (
        <p className="px-4 py-5 text-sm text-muted-foreground">This file is large, so download it to read it in full.</p>
      ) : failed ? (
        <p className="px-4 py-5 text-sm text-muted-foreground">Couldn&apos;t show this file here. Download it to read it.</p>
      ) : text === null ? (
        <div className="space-y-2 p-4" role="status" aria-label="Loading file">
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      ) : (
        <div className="relative">
          <pre
            className={cn(
              "overflow-x-auto px-4 py-4 font-mono text-[0.82rem] leading-relaxed whitespace-pre-wrap text-foreground/90",
              !expanded && "max-h-72 overflow-y-hidden",
            )}
          >
            {text}
          </pre>
          {!expanded && text.split("\n").length > 14 && (
            <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-card via-card/90 to-transparent pt-10 pb-3">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium shadow-soft hover:bg-muted"
              >
                Show all
                <ChevronDown className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { ChevronLeft, ChevronRight, Download, FileText, Loader2, Music, Play, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Portal } from "@/components/ui/portal";
import { cn } from "@/lib/utils";
import type { AttachmentView } from "@/server/attachments";
import { FilePreview, isPreviewable } from "./file-preview";
import type { UploadItem } from "./use-uploads";

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function formatDuration(s?: number) {
  if (!s) return null;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.round(s % 60)).padStart(2, "0")}`;
}

/**
 * Photos and videos as a gallery (click to open full screen), audio as players,
 * and other files as download cards. In edit mode items can be removed.
 */
export function AttachmentGallery({
  items,
  uploads = [],
  onRemove,
  className,
}: {
  items: AttachmentView[];
  uploads?: UploadItem[];
  onRemove?: (id: string) => void;
  className?: string;
}) {
  const visual = items.filter((a) => (a.kind === "image" || a.kind === "video") && a.url);
  const audio = items.filter((a) => a.kind === "audio" && a.url);
  const previews = items.filter((a) => a.kind === "file" && isPreviewable(a));
  const files = items.filter((a) => (a.kind === "file" || !a.url) && !isPreviewable(a));
  const [open, setOpen] = useState<number | null>(null);

  if (items.length === 0 && uploads.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {(visual.length > 0 || uploads.some((u) => u.kind === "image" || u.kind === "video")) && (
        <div className={cn("grid gap-2", visual.length === 1 && uploads.length === 0 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3")}>
          {visual.map((a, i) => (
            <div
              key={a.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border bg-muted shadow-soft",
                visual.length === 1 ? "max-h-[70vh]" : "aspect-square",
                i === 0 && visual.length >= 3 && "sm:col-span-2 sm:row-span-2 sm:aspect-auto",
              )}
            >
              <button type="button" onClick={() => setOpen(i)} className="block size-full" aria-label={`Open ${a.filename}`}>
                {a.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.url!}
                    alt={a.filename}
                    loading="lazy"
                    className={cn("size-full transition duration-500 group-hover:scale-[1.03]", visual.length === 1 ? "object-contain" : "object-cover")}
                  />
                ) : (
                  <span className="relative block size-full">
                    <video src={`${a.url}#t=0.5`} preload="metadata" muted playsInline className="size-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <span className="inline-flex size-12 items-center justify-center rounded-full bg-white/90 text-black shadow-lift transition group-hover:scale-110">
                        <Play className="size-5 translate-x-0.5" fill="currentColor" />
                      </span>
                    </span>
                    {formatDuration(a.meta.durationSec) && (
                      <span className="absolute right-2 bottom-2 rounded-md bg-black/60 px-1.5 py-0.5 text-xs text-white">
                        {formatDuration(a.meta.durationSec)}
                      </span>
                    )}
                  </span>
                )}
              </button>
              {onRemove && (
                <RemoveButton onClick={() => onRemove(a.id)} label={a.filename} />
              )}
            </div>
          ))}
          {uploads
            .filter((u) => u.kind === "image" || u.kind === "video")
            .map((u) => (
              <UploadTile key={u.key} u={u} />
            ))}
        </div>
      )}

      {audio.map((a) => (
        <div key={a.id} className="group relative flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Music className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{a.filename}</p>
            <audio src={a.url!} controls preload="none" className="mt-1 h-8 w-full" />
          </div>
          {onRemove && <RemoveButton onClick={() => onRemove(a.id)} label={a.filename} inline />}
        </div>
      ))}

      {previews.map((a) => (
        <FilePreview key={a.id} a={a} onRemove={onRemove ? () => onRemove(a.id) : undefined} />
      ))}

      {(files.length > 0 || uploads.some((u) => u.kind === "file" || u.kind === "audio")) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {files.map((a) => (
            <div key={a.id} className="group relative flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <FileText className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.filename}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(a.sizeBytes)}</p>
              </div>
              {a.downloadUrl && (
                <a href={a.downloadUrl} className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Download ${a.filename}`}>
                  <Download className="size-4" />
                </a>
              )}
              {onRemove && <RemoveButton onClick={() => onRemove(a.id)} label={a.filename} inline />}
            </div>
          ))}
          {uploads
            .filter((u) => u.kind === "file" || u.kind === "audio")
            .map((u) => (
              <div key={u.key} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
                <p className="truncate text-sm font-medium">{u.name}</p>
                <Progress u={u} />
              </div>
            ))}
        </div>
      )}

      {open !== null && visual[open] && (
        <Lightbox items={visual} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}

function RemoveButton({ onClick, label, inline }: { onClick: () => void; label: string; inline?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (window.confirm(`Remove "${label}" from this memory?`)) onClick();
      }}
      aria-label={`Remove ${label}`}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full transition",
        inline
          ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          : "absolute top-2 right-2 bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-destructive focus-visible:opacity-100",
      )}
    >
      <Trash2 className="size-4" />
    </button>
  );
}

function Progress({ u }: { u: UploadItem }) {
  if (u.error) return <p className="mt-1.5 text-xs text-destructive">{u.error}</p>;
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-saffron transition-[width] duration-200" style={{ width: `${Math.max(4, u.progress * 100)}%` }} />
    </div>
  );
}

function UploadTile({ u }: { u: UploadItem }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
      {u.previewUrl &&
        (u.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={u.previewUrl} alt="" className="size-full object-cover opacity-60" />
        ) : (
          <video src={u.previewUrl} muted className="size-full object-cover opacity-60" />
        ))}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
        {u.error ? (
          <p className="text-xs">{u.error}</p>
        ) : (
          <>
            <p className="flex items-center gap-1.5 text-xs">
              <Loader2 className="size-3.5 animate-spin" />
              {u.progress >= 1 ? "Finishing…" : `Uploading ${Math.round(u.progress * 100)}%`}
            </p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-[#ff9f43] transition-[width] duration-200" style={{ width: `${Math.max(4, u.progress * 100)}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Lightbox({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: AttachmentView[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const a = items[index];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % items.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndex]);

  return (
    <Portal>
      <div className="fixed inset-0 z-[80] flex flex-col bg-black/92 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={a.filename}>
        <div className="flex items-center justify-between p-4 text-sm text-white/80" onClick={(e) => e.stopPropagation()}>
          <span className="truncate">
            {a.filename} · {index + 1} of {items.length}
          </span>
          <div className="flex items-center gap-1">
            {a.downloadUrl && (
              <a href={a.downloadUrl} className="inline-flex size-10 items-center justify-center rounded-full hover:bg-white/10" aria-label="Download">
                <Download className="size-5" />
              </a>
            )}
            <button type="button" onClick={onClose} className="inline-flex size-10 items-center justify-center rounded-full hover:bg-white/10" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>
        </div>
        <div className="relative flex flex-1 items-center justify-center px-4 pb-6" onClick={(e) => e.stopPropagation()}>
          {a.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={a.id} src={a.url!} alt={a.filename} className="animate-rise max-h-full max-w-full rounded-lg object-contain" />
          ) : (
            <video key={a.id} src={a.url!} controls autoPlay playsInline className="animate-rise max-h-full max-w-full rounded-lg" />
          )}
          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => onIndex((index - 1 + items.length) % items.length)}
                className="absolute left-4 inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Previous"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={() => onIndex((index + 1) % items.length)}
                className="absolute right-4 inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Next"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}

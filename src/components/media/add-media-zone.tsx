"use client";

import { FileText, ImagePlus, Plus, Video } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ACCEPT = "image/*,video/*,audio/*,.pdf,.txt,.md,.csv,.json,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

function mb(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/**
 * The one obvious place to add photos, videos and files. Large and friendly
 * when a memory has no media yet; a compact "Add more" tile once it does.
 */
export function AddMediaZone({
  onFiles,
  maxBytes,
  compact = false,
}: {
  onFiles: (files: File[]) => void;
  maxBytes: number;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const handlers = {
    onDragOver: (e: React.DragEvent) => {
      if (e.dataTransfer.types.includes("Files")) {
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }
    },
    onDragLeave: () => setOver(false),
    onDrop: (e: React.DragEvent) => {
      if (e.dataTransfer.files.length) {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        onFiles(Array.from(e.dataTransfer.files));
      }
    },
  };

  const picker = (
    <input
      ref={input}
      type="file"
      multiple
      accept={ACCEPT}
      hidden
      onChange={(e) => {
        if (e.target.files?.length) onFiles(Array.from(e.target.files));
        e.target.value = "";
      }}
    />
  );

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => input.current?.click()}
        {...handlers}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-3.5 text-sm font-medium text-muted-foreground transition hover:border-saffron/60 hover:bg-accent/40 hover:text-foreground",
          over && "border-saffron bg-accent/50 text-foreground",
        )}
      >
        <Plus className="size-4" />
        Add more photos, videos or files
        {picker}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      {...handlers}
      className={cn(
        "group flex w-full flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-border bg-card/50 px-6 py-8 text-center transition hover:border-saffron/60 hover:bg-accent/30",
        over && "scale-[1.01] border-saffron bg-accent/50",
      )}
    >
      <span className="flex items-center gap-2">
        {[ImagePlus, Video, FileText].map((Icon, i) => (
          <span
            key={i}
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-soft transition duration-300 group-hover:-translate-y-1",
              i === 1 && "delay-75",
              i === 2 && "delay-150",
            )}
          >
            <Icon className="size-5" />
          </span>
        ))}
      </span>
      <span className="mt-4 font-serif text-xl">{over ? "Drop to add them" : "Add photos & videos"}</span>
      <span className="mt-1 text-sm text-muted-foreground">
        Click to choose, drag them here, or paste. Files and PDFs work too.
      </span>
      <span className="mt-3 text-xs text-muted-foreground/80">
        Up to {mb(maxBytes)} each · videos up to 10 minutes · private to you
      </span>
      {picker}
    </button>
  );
}

import { Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { COLLECTION_COLORS, COLLECTION_ICONS } from "@/components/collection-style";
import { formatMemoryDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CollectionView } from "@/server/collections";
import type { EntryCard } from "@/server/entries";

export function MemoryCard({
  entry,
  collection,
  eyebrow,
  snippet,
  className,
  compact = false,
}: {
  entry: EntryCard;
  collection?: CollectionView;
  eyebrow?: string;
  snippet?: string;
  className?: string;
  compact?: boolean;
}) {
  const Icon = COLLECTION_ICONS[collection?.icon ?? "folder"] ?? COLLECTION_ICONS.folder;
  return (
    <Link
      href={`/m/${entry.id}`}
      className={cn(
        "group block rounded-2xl border border-border bg-card p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-saffron/40 hover:shadow-lift focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className={cn(eyebrow && "font-semibold text-saffron")}>{eyebrow ?? formatMemoryDate(entry.memoryDate, "short")}</span>
          {entry.hasMedia && <ImageIcon className="size-3.5 text-saffron" aria-label="Has photos or files" />}
        </span>
        {collection && (
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium", COLLECTION_COLORS[collection.color])}>
            <Icon className="size-3" aria-hidden />
            {collection.name}
          </span>
        )}
      </div>
      <h3 className="mt-2.5 font-serif text-xl leading-snug tracking-[-0.01em] transition-colors group-hover:text-saffron-strong">
        {entry.title || <span className="text-muted-foreground italic">Untitled memory</span>}
      </h3>
      {!compact && (snippet ?? entry.excerpt) && (
        <p className="mt-1.5 line-clamp-3 font-writing leading-relaxed text-muted-foreground">{snippet ?? entry.excerpt}</p>
      )}
      {!compact && entry.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

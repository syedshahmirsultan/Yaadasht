import { ArrowLeft, Clock, Download, Lock, PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COLLECTION_COLORS, COLLECTION_ICONS } from "@/components/collection-style";
import { DocView } from "@/components/memory/doc-view";
import { MemoryActions } from "@/components/memory/memory-actions";
import { formatMemoryDate, yearsAgoLabel } from "@/lib/format";
import { todayIn } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { listCollections } from "@/server/collections";
import { getEntry } from "@/server/entries";
import { AttachmentGallery } from "@/components/media/attachment-gallery";
import { listAttachments } from "@/server/attachments";
import { storageConfigured } from "@/server/storage";
import { requireUser } from "@/server/users";

export const metadata: Metadata = { title: "Memory" };

export default async function MemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [entry, collections] = await Promise.all([getEntry(user.id, id), listCollections(user.id)]);
  if (!entry) notFound();
  const attachments = storageConfigured() ? await listAttachments(user.id, entry.id) : [];

  const collection = collections.find((c) => c.id === entry.collectionId);
  const Icon = COLLECTION_ICONS[collection?.icon ?? "folder"] ?? COLLECTION_ICONS.folder;
  const today = todayIn(user.timezone);
  const readMinutes = Math.max(1, Math.round(entry.wordCount / 220));

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-8 md:px-8 md:py-12">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={collection ? `/collections/${collection.id}` : "/timeline"}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {collection?.name ?? "Back"}
        </Link>
        <div className="flex items-center gap-1">
          <a
            href={`/api/entries/${entry.id}/markdown`}
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Download as Markdown"
            title="Download as Markdown"
          >
            <Download className="size-4" />
          </a>
          <MemoryActions id={entry.id} />
          <Link
            href={`/m/${entry.id}/edit`}
            className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
          >
            <PenLine className="size-4" aria-hidden />
            Edit
          </Link>
        </div>
      </div>

      <header className="animate-rise mt-10">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-saffron-strong">{formatMemoryDate(entry.memoryDate)}</span>
          {entry.memoryDate.slice(0, 4) !== today.slice(0, 4) && (
            <span className="text-muted-foreground">· {yearsAgoLabel(entry.memoryDate, today)}</span>
          )}
        </div>
        <h1 className="mt-3 font-serif text-[2.4rem] leading-[1.1] tracking-[-0.025em] text-balance md:text-[3.2rem]">
          {entry.title || <span className="text-muted-foreground italic">Untitled memory</span>}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          {collection && (
            <Link
              href={`/collections/${collection.id}`}
              className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium", COLLECTION_COLORS[collection.color])}
            >
              <Icon className="size-3.5" aria-hidden />
              {collection.name}
            </Link>
          )}
          {entry.tags.map((t) => (
            <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground hover:text-foreground">
              #{t}
            </Link>
          ))}
          <span className="ml-auto inline-flex items-center gap-3 text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {readMinutes} min read
            </span>
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3.5" /> Encrypted
            </span>
          </span>
        </div>
      </header>

      <div className="animate-rise mt-10 border-t border-border pt-8" style={{ animationDelay: "80ms" }}>
        {attachments.length > 0 && <AttachmentGallery items={attachments} className="mb-10" />}
        <DocView doc={entry.body} />
      </div>
    </article>
  );
}

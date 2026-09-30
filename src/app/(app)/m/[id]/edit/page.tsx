import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MemoryEditor } from "@/components/editor/memory-editor";
import { listCollections } from "@/server/collections";
import { getEntry, listTagNames } from "@/server/entries";
import { listAttachments } from "@/server/attachments";
import { storageConfigured, uploadMaxBytes } from "@/server/storage";
import { requireUser } from "@/server/users";

export const metadata: Metadata = { title: "Editing" };

export default async function EditMemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [entry, collections, tagSuggestions] = await Promise.all([
    getEntry(user.id, id),
    listCollections(user.id),
    listTagNames(user.id),
  ]);
  if (!entry) notFound();
  const attachments = storageConfigured() ? await listAttachments(user.id, entry.id) : [];

  return (
    <MemoryEditor
      initial={{
        id: entry.id,
        revision: entry.revision,
        title: entry.title ?? "",
        body: entry.body,
        memoryDate: entry.memoryDate,
        collectionId: entry.collectionId,
        tags: entry.tags,
      }}
      collections={collections}
      tagSuggestions={tagSuggestions}
      initialAttachments={attachments}
      uploadMaxBytes={uploadMaxBytes()}
      storageReady={storageConfigured()}
    />
  );
}
